from __future__ import annotations

import ast
import cProfile
import io
import os
import pstats
import sys
import tempfile
import tracemalloc
from collections import Counter
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from time import perf_counter


CONTROL_NODES = (
    ast.If,
    ast.For,
    ast.AsyncFor,
    ast.While,
    ast.Try,
    ast.With,
    ast.AsyncWith,
    ast.BoolOp,
    ast.IfExp,
    ast.comprehension,
)

NOISE_CALLS = {"range", "len", "print", "enumerate", "append", "extend", "update", "add", "sleep"}


def analyze_python_input(path_text: str | None = None, source_code: str | None = None) -> dict:
    if source_code and source_code.strip():
        return _analyze_source_code(source_code)
    if path_text:
        return analyze_python_file(path_text)
    raise ValueError("需要提供 Python 文件路径或代码内容。")


def analyze_python_file(path_text: str) -> dict:
    target_path = _resolve_python_path(path_text)
    code = target_path.read_text(encoding="utf-8")
    return _build_report(code=code, execution_path=target_path, display_name=target_path.name)


def _analyze_source_code(source_code: str) -> dict:
    code = source_code.strip("\n")
    if not code.strip():
        raise ValueError("输入框里的代码为空，无法分析。")

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".py", delete=False) as temp_file:
        temp_file.write(code)
        temp_path = Path(temp_file.name)

    try:
        return _build_report(code=code, execution_path=temp_path, display_name="编辑器中的 Python 代码")
    finally:
        try:
            temp_path.unlink(missing_ok=True)
        except OSError:
            pass


def _build_report(code: str, execution_path: Path, display_name: str) -> dict:
    tree = ast.parse(code)
    source_lines = code.splitlines()
    functions = _collect_functions(tree)
    top_nodes = Counter(type(node).__name__ for node in ast.walk(tree)).most_common(4)
    print_calls = sum(
        1
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print"
    )
    loop_calls = _collect_loop_calls(tree)
    runtime = _profile_script(execution_path, code)

    ast_tab = _build_ast_tab(functions, print_calls, source_lines)
    perf_tab = _build_perf_tab(runtime, loop_calls)
    memory_tab = _build_memory_tab(runtime)
    suggestions = _build_suggestions(functions, loop_calls, print_calls, runtime, display_name)
    workflow_tab = _build_dynamic_overview_tab(runtime, display_name, top_nodes, functions, loop_calls, suggestions)

    most_complex = functions[0]["name"] if functions else "未发现函数"
    return {
        "heroMetrics": [
            {"label": "分析对象", "value": display_name, "note": "直接来自页面输入"},
            {"label": "代码行数", "value": str(len(source_lines)), "note": "按当前输入实时统计"},
            {"label": "重点函数", "value": most_complex, "note": "按结构复杂度排序"},
            {"label": "执行耗时", "value": f"{runtime['duration_ms']:.1f} ms", "note": "本地真实执行结果"},
        ],
        "analysisMap": {
            "workflow": workflow_tab,
            "ast": ast_tab,
            "performance": perf_tab,
            "memory": memory_tab,
        },
        "suggestions": suggestions,
        "stages": [
            ["输入代码", "从页面输入框读取当前 Python 代码。"],
            ["理解结构", "解析 AST 并抽取函数、控制流与热点。"],
            ["执行分析", "在本地执行代码并统计耗时与内存峰值。"],
            ["生成建议", "根据结果生成易懂的优化建议和差异预览。"],
        ],
        "meta": {
            "targetPath": display_name,
            "stdout": runtime["stdout"][:800],
            "runtimeError": runtime["error"],
        },
    }


def _resolve_python_path(path_text: str) -> Path:
    target = Path(path_text).expanduser()
    if not target.is_absolute():
        target = (Path.cwd() / target).resolve()
    if not target.exists():
        raise FileNotFoundError(f"文件不存在：{target}")
    if target.suffix.lower() != ".py":
        raise ValueError(f"仅支持 Python 文件：{target}")
    return target


def _collect_functions(tree: ast.AST) -> list[dict]:
    functions = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            complexity = 1 + sum(1 for item in ast.walk(node) if isinstance(item, CONTROL_NODES))
            end_lineno = getattr(node, "end_lineno", node.lineno)
            functions.append(
                {
                    "name": node.name,
                    "lineno": node.lineno,
                    "line_span": max(1, end_lineno - node.lineno + 1),
                    "complexity": complexity,
                }
            )
    functions.sort(key=lambda item: (item["complexity"], item["line_span"]), reverse=True)
    return functions


def _collect_loop_calls(tree: ast.AST) -> list[dict]:
    loop_calls = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.AsyncFor, ast.While)):
            counts = Counter()
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    name = _call_name(child)
                    if name and name not in NOISE_CALLS:
                        counts[name] += 1
            for name, count in counts.most_common(3):
                loop_calls.append({"name": name, "count": count, "line": getattr(node, "lineno", 1)})
    loop_calls.sort(key=lambda item: item["count"], reverse=True)
    return loop_calls[:4]


def _call_name(node: ast.Call) -> str | None:
    if isinstance(node.func, ast.Name):
        return node.func.id
    if isinstance(node.func, ast.Attribute):
        return node.func.attr
    return None


def _profile_script(path: Path, code: str) -> dict:
    profiler = cProfile.Profile()
    stdout_buffer = io.StringIO()
    cwd = os.getcwd()
    peak_bytes = 0
    duration_ms = 0.0
    profile_rows = []
    memory_rows = []
    error_message = None

    globals_dict = {
        "__file__": str(path),
        "__name__": "__main__",
        "__package__": None,
        "__cached__": None,
    }

    try:
        sys.path.insert(0, str(path.parent))
        os.chdir(path.parent)
        compiled = compile(code, str(path), "exec")
        tracemalloc.start()
        start = perf_counter()
        with redirect_stdout(stdout_buffer), redirect_stderr(stdout_buffer):
            profiler.enable()
            exec(compiled, globals_dict)
            profiler.disable()
        duration_ms = (perf_counter() - start) * 1000
        _, peak_bytes = tracemalloc.get_traced_memory()
        snapshot = tracemalloc.take_snapshot()
        profile_rows = _profile_rows(profiler, path)
        memory_rows = _memory_rows(snapshot, peak_bytes, path)
    except Exception as exc:
        profiler.disable()
        duration_ms = (perf_counter() - start) * 1000 if "start" in locals() else 0.0
        error_message = f"{type(exc).__name__}: {exc}"
        if tracemalloc.is_tracing():
            _, peak_bytes = tracemalloc.get_traced_memory()
            snapshot = tracemalloc.take_snapshot()
            memory_rows = _memory_rows(snapshot, peak_bytes, path)
        profile_rows = _profile_rows(profiler, path)
    finally:
        if tracemalloc.is_tracing():
            tracemalloc.stop()
        if sys.path and sys.path[0] == str(path.parent):
            sys.path.pop(0)
        os.chdir(cwd)

    return {
        "duration_ms": duration_ms,
        "peak_mb": peak_bytes / (1024 * 1024) if peak_bytes else 0.0,
        "profile_rows": profile_rows,
        "memory_rows": memory_rows,
        "stdout": stdout_buffer.getvalue(),
        "error": error_message,
    }


def _profile_rows(profiler: cProfile.Profile, path: Path) -> list[dict]:
    stats = pstats.Stats(profiler)
    rows = []
    for (filename, lineno, name), values in stats.stats.items():
        if not filename:
            continue
        try:
            same_file = Path(filename).resolve() == path.resolve()
        except OSError:
            same_file = False
        if not same_file:
            continue
        cc, nc, tt, ct, _ = values
        rows.append(
            {
                "label": name,
                "line": lineno,
                "calls": nc or cc,
                "total_ms": ct * 1000,
                "self_ms": tt * 1000,
            }
        )
    rows.sort(key=lambda item: item["total_ms"], reverse=True)
    return rows[:5]


def _memory_rows(snapshot: tracemalloc.Snapshot, peak_bytes: float, path: Path) -> list[dict]:
    rows = []
    for stat in snapshot.statistics("lineno")[:6]:
        frame = stat.traceback[0]
        try:
            same_file = Path(frame.filename).resolve() == path.resolve()
        except OSError:
            same_file = False
        if not same_file:
            continue
        rows.append(
            {
                "label": f"第 {frame.lineno} 行",
                "value": round((stat.size / peak_bytes * 100) if peak_bytes else 0.0, 1),
                "size_kb": round(stat.size / 1024, 1),
            }
        )
    return rows[:4]


def _build_overview_tab(runtime: dict, display_name: str, top_nodes: list[tuple[str, int]]) -> dict:
    bars = [
        {"label": "输入完成", "value": 25},
        {"label": "结构分析", "value": 55},
        {"label": "执行统计", "value": 82 if not runtime["error"] else 64},
        {"label": "建议生成", "value": 100 if not runtime["error"] else 88},
    ]
    top_node_text = "、".join(name for name, _ in top_nodes[:3]) if top_nodes else "无"
    return {
        "title": "概览",
        "summary": "先看整体结果，再决定要不要继续看性能、内存或结构细节。",
        "cards": [
            {"label": "当前对象", "value": display_name},
            {"label": "执行状态", "value": "已完成" if not runtime["error"] else "部分完成"},
            {"label": "常见语法", "value": top_node_text},
        ],
        "bars": bars,
        "points": [
            "这份结果来自你刚刚输入的代码，不需要先保存成文件。",
            "如果代码能运行，页面会展示真实的耗时和内存摘要。",
            "如果代码报错，页面也会尽量保留错误发生前拿到的分析结果。"
        ],
    }


def _build_ast_tab(functions: list[dict], print_calls: int, source_lines: list[str]) -> dict:
    top_function = functions[0]["name"] if functions else "未发现函数"
    bars = [{"label": item["name"], "value": min(100, item["complexity"] * 10)} for item in functions[:4]]
    if not bars:
        bars = [{"label": "当前代码较短", "value": 12}]
    return {
        "title": "结构",
        "summary": "用更容易理解的方式看函数数量、代码规模和结构复杂度。",
        "cards": [
            {"label": "代码行数", "value": str(len(source_lines))},
            {"label": "函数数量", "value": str(len(functions))},
            {"label": "重点函数", "value": top_function},
        ],
        "bars": bars,
        "points": [
            "函数越长、分支越多，后续维护通常越吃力。",
            f"当前最值得先读懂的是：{top_function}。",
            f"这段代码里共检测到 {print_calls} 处输出语句。"
        ],
    }


def _build_perf_tab(runtime: dict, loop_calls: list[dict]) -> dict:
    total = sum(item["total_ms"] for item in runtime["profile_rows"]) or 1
    bars = [
        {"label": f"{item['label']} @ 第 {item['line']} 行", "value": round(item["total_ms"] / total * 100, 1)}
        for item in runtime["profile_rows"][:4]
    ]
    if not bars:
        bars = [{"label": "当前没有明显热点", "value": 0}]
    hottest = runtime["profile_rows"][0]["label"] if runtime["profile_rows"] else "未发现明显热点"
    points = [
        f"本次真实执行耗时约 {runtime['duration_ms']:.1f} ms。",
        f"当前最耗时的位置更接近：{hottest}。",
    ]
    if loop_calls:
        points.append(f"循环中最值得留意的调用是 {loop_calls[0]['name']}。")
    if runtime["error"]:
        points.append(f"执行时报错：{runtime['error']}。")
    return {
        "title": "性能",
        "summary": "不需要先理解全部代码，先看哪里最慢就够了。",
        "cards": [
            {"label": "执行耗时", "value": f"{runtime['duration_ms']:.1f} ms"},
            {"label": "热点函数", "value": hottest},
            {"label": "可见样本", "value": str(len(runtime["profile_rows"]))},
        ],
        "bars": bars,
        "points": points,
    }


def _build_memory_tab(runtime: dict) -> dict:
    bars = [
        {"label": f"{item['label']} ({item['size_kb']} KB)", "value": item["value"]}
        for item in runtime["memory_rows"]
    ]
    if not bars:
        bars = [{"label": "当前没有明显热点", "value": 0}]
    return {
        "title": "内存",
        "summary": "这部分帮助你判断代码是不是持有了过多不必要的数据。",
        "cards": [
            {"label": "峰值内存", "value": f"{runtime['peak_mb']:.2f} MB"},
            {"label": "热点位置", "value": str(len(runtime["memory_rows"]))},
            {"label": "运行状态", "value": "有异常" if runtime["error"] else "正常"},
        ],
        "bars": bars,
        "points": [
            "内存数据来自 Python 标准库 tracemalloc。",
            "如果这里的峰值很高，通常说明有大对象存在时间过长。",
            "这能帮助初学者先找到问题位置，再考虑更深入优化。"
        ],
    }


def _build_suggestions(
    functions: list[dict],
    loop_calls: list[dict],
    print_calls: int,
    runtime: dict,
    display_name: str,
) -> list[dict]:
    suggestions = []

    if functions:
        target = functions[0]
        suggestions.append(
            {
                "id": "split-function",
                "title": f"先把 {target['name']} 拆小一点",
                "priority": "优先看看",
                "confidence": "高",
                "impact": f"复杂度约 {target['complexity']}",
                "risk": "低到中",
                "file": display_name,
                "note": "函数太长或分支太多时，先拆清楚职责最容易看懂。",
                "explanation": "如果一段函数同时负责读取、判断和输出，初学者会很难定位问题。先拆出更小的步骤，通常比直接做性能优化更容易理解。",
                "diff": [
                    [target["lineno"], " ", f"def {target['name']}(...) :", "context"],
                    [target["lineno"] + 1, "-", "    # mixed logic", "remove"],
                    [target["lineno"] + 1, "+", "    data = prepare_data(...)", "add"],
                    [target["lineno"] + 2, "+", "    result = compute_result(data)", "add"],
                    [target["lineno"] + 3, "+", "    return result", "add"],
                ],
            }
        )

    if loop_calls:
        loop_target = loop_calls[0]
        suggestions.append(
            {
                "id": "loop-hotspot",
                "title": f"留意循环里的 {loop_target['name']} 调用",
                "priority": "值得关注",
                "confidence": "中高",
                "impact": "可能影响整体速度",
                "risk": "低",
                "file": display_name,
                "note": f"在第 {loop_target['line']} 行附近，循环内重复调用了 {loop_target['name']}。",
                "explanation": "当同一个操作在循环中反复出现时，速度往往会受到影响。这里不一定要立刻优化，但值得先看懂它是不是重复做了相同事情。",
                "diff": [
                    [loop_target["line"], " ", "for item in items:", "context"],
                    [loop_target["line"] + 1, "-", f"    value = {loop_target['name']}(item)", "remove"],
                    [loop_target["line"] + 1, "+", "    # think about whether this can be simplified", "add"],
                ],
            }
        )

    if print_calls:
        suggestions.append(
            {
                "id": "reduce-print",
                "title": "把调试输出收一收",
                "priority": "顺手优化",
                "confidence": "高",
                "impact": f"检测到 {print_calls} 处输出",
                "risk": "低",
                "file": display_name,
                "note": "如果输出很多，页面和终端都会更难读。",
                "explanation": "print 本身没有错，但太多输出会让你很难只盯住真正重要的信息。先让输出更克制，通常会让调试更轻松。",
                "diff": [
                    [1, " ", "DEBUG = True", "context"],
                    [2, "-", "print('debug info')", "remove"],
                    [2, "+", "if DEBUG:", "add"],
                    [3, "+", "    print('debug info')", "add"],
                ],
            }
        )

    if runtime["peak_mb"] >= 1 and len(suggestions) < 3:
        suggestions.append(
            {
                "id": "trim-memory",
                "title": "减少长时间保留的大对象",
                "priority": "可以留意",
                "confidence": "中",
                "impact": f"峰值约 {runtime['peak_mb']:.2f} MB",
                "risk": "低到中",
                "file": display_name,
                "note": "内存峰值偏高时，通常可以先检查大列表、大字典是否存在太久。",
                "explanation": "如果某个大对象在程序里存活太久，内存就会一直被占着。把它拆成更短的使用周期，常常就能缓和这个问题。",
                "diff": [
                    [1, " ", "large_data = build_large_data()", "context"],
                    [2, "-", "result = process(large_data)", "remove"],
                    [2, "+", "result = process_in_small_steps()", "add"],
                    [3, "+", "del large_data", "add"],
                ],
            }
        )

    if not suggestions:
        suggestions.append(
            {
                "id": "keep-simple",
                "title": "先保持代码清晰，再决定要不要优化",
                "priority": "默认建议",
                "confidence": "中",
                "impact": "提升可读性",
                "risk": "低",
                "file": display_name,
                "note": "当前没有特别尖锐的问题，先把代码说明清楚会更有帮助。",
                "explanation": "当代码本身不复杂时，最好的下一步往往不是立刻优化，而是先让变量名、函数职责和输入输出更清楚。",
                "diff": [
                    [1, " ", "def main(...):", "context"],
                    [2, "+", "    # explain what this step does", "add"],
                ],
            }
        )

    return suggestions[:3]


def _build_dynamic_overview_tab(
    runtime: dict,
    display_name: str,
    top_nodes: list[tuple[str, int]],
    functions: list[dict],
    loop_calls: list[dict],
    suggestions: list[dict],
) -> dict:
    top_node_text = "、".join(name for name, _ in top_nodes[:3]) if top_nodes else "暂时不明显"
    status_text = "已完成" if not runtime["error"] else "部分完成"
    return {
        "title": "概览",
        "summary": "先看整体结果，再决定要不要继续深入结构、性能或内存细节。",
        "cards": [
            {
                "label": "结构复杂度",
                "value": str(_complexity_score(functions)),
                "note": f"基于 {len(functions)} 个函数和最复杂函数综合计算。",
            },
            {
                "label": "热点集中度",
                "value": str(_hotspot_score(runtime)),
                "note": "数值越高，说明耗时越集中在少数关键逻辑上。",
            },
            {
                "label": "内存压力",
                "value": str(_memory_score(runtime)),
                "note": f"当前峰值约 {runtime['peak_mb']:.2f} MB，会结合热点分布一起判断。",
            },
            {
                "label": "修改空间",
                "value": str(_refactor_score(functions, loop_calls, suggestions, runtime)),
                "note": f"当前共生成 {len(suggestions)} 条建议，执行状态为 {status_text}。",
            },
        ],
        "bars": [],
        "points": [
            f"当前分析对象是：{display_name}，常见语法主要集中在 {top_node_text}。",
            "如果代码可以成功运行，页面会展示真实的耗时与内存摘要；如果报错，也会尽量保留已有分析结果。",
            "概览里的四个数值越高，通常越值得你优先点开对应标签继续看。"
        ],
    }


def _complexity_score(functions: list[dict]) -> int:
    if not functions:
        return 8
    max_complexity = max(item["complexity"] for item in functions)
    average_span = sum(item["line_span"] for item in functions) / len(functions)
    raw_score = max_complexity * 8 + len(functions) * 6 + average_span * 1.5
    return max(6, min(100, round(raw_score)))


def _hotspot_score(runtime: dict) -> int:
    rows = runtime["profile_rows"]
    if not rows:
        return 0
    total_ms = sum(item["total_ms"] for item in rows) or 1
    hottest_share = rows[0]["total_ms"] / total_ms
    return max(4, min(100, round(hottest_share * 100)))


def _memory_score(runtime: dict) -> int:
    peak_component = min(65, runtime["peak_mb"] * 18)
    hotspot_component = runtime["memory_rows"][0]["value"] if runtime["memory_rows"] else 0
    raw_score = peak_component + hotspot_component * 0.55
    return max(3, min(100, round(raw_score)))


def _refactor_score(functions: list[dict], loop_calls: list[dict], suggestions: list[dict], runtime: dict) -> int:
    raw_score = len(suggestions) * 24 + len(loop_calls) * 9 + max(0, len(functions) - 1) * 5
    if runtime["error"]:
        raw_score += 12
    return max(12, min(100, round(raw_score)))
