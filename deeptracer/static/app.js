const themes = ["mist", "paper", "night"];
const loadingCopies = [
    "像素猫正在巡检结构、性能和内存，请稍等一下。",
    "正在梳理函数之间的关系，马上给你结果。",
    "热点和内存摘要还在整理中，很快就好。",
    "正在生成更容易理解的修改建议。"
];

const sampleCode = `import re
import time
from collections import defaultdict


def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


def normalize_line(line):
    line = line.strip().lower()
    line = re.sub(r"[^a-z0-9,\\s]", "", line)
    return line


def parse_records(text):
    records = []
    for raw_line in text.split("\\n"):
        line = normalize_line(raw_line)
        if not line:
            continue
        parts = [part.strip() for part in line.split(",")]
        if len(parts) != 3:
            continue
        name, category, value = parts
        if not value.isdigit():
            continue
        records.append({
            "name": name,
            "category": category,
            "value": int(value)
        })
    return records


def group_and_score(records):
    grouped = defaultdict(list)
    for record in records:
        grouped[record["category"]].append(record["value"])

    result = {}
    for category, values in grouped.items():
        total = sum(values)
        avg = total / len(values)
        score = fibonacci(min(len(values) + 8, 20))
        result[category] = {
            "count": len(values),
            "total": total,
            "avg": round(avg, 2),
            "score": score
        }
    return result


def main():
    data = """
    Alice, Books, 12
    Bob, Books, 18
    Cathy, Games, 31
    David, Books, 25
    Eva, Games, 22
    Frank, Music, 15
    Gina, Music, 17
    Helen, Games, 28
    Ivan, Books, 14
    Jack, Music, 19
    Invalid, Row
    Mike, Games, xx
    """
    start = time.perf_counter()
    records = parse_records(data)
    summary = group_and_score(records)
    elapsed = time.perf_counter() - start
    print(summary)
    print(f"Elapsed: {elapsed:.6f}s")


if __name__ == "__main__":
    main()
`;

const demoData = {
    heroMetrics: [
        { label: "分析对象", value: "示例代码", note: "可以直接替换成你自己的代码" },
        { label: "代码行数", value: "64", note: "输入框里的内容会参与分析" },
        { label: "重点函数", value: "group_and_score", note: "按结构复杂度排序" },
        { label: "执行耗时", value: "18.4 ms", note: "真实分析后会刷新这里的数据" }
    ],
    analysisMap: {
        workflow: {
            title: "概览",
            summary: "先看整体，再决定要不要继续往下看。",
            cards: [
                { label: "结构复杂度", value: "61", note: "分支和函数拆分处于中等复杂度" },
                { label: "热点集中度", value: "73", note: "耗时主要集中在少数关键函数" },
                { label: "内存压力", value: "24", note: "当前内存压力不高" },
                { label: "修改空间", value: "68", note: "有几处很适合先做的小重构" }
            ],
            bars: [],
            points: [
                "这段代码的主任务很清楚，但数据清洗和打分逻辑可以再拆开一点。",
                "真正需要优先看的往往是最慢的函数，而不是代码里最长的函数。",
                "如果你只想先改一处，优先从热点函数和高复杂度函数交叉的地方开始。"
            ]
        },
        ast: {
            title: "结构",
            summary: "帮助你快速看懂代码是不是过长、过绕，或者职责不清。",
            cards: [
                { label: "函数数量", value: "5" },
                { label: "重点函数", value: "group_and_score" },
                { label: "输出语句", value: "2" }
            ],
            bars: [
                { label: "group_and_score", value: 72 },
                { label: "parse_records", value: 66 },
                { label: "fibonacci", value: 40 }
            ],
            points: [
                "如果一个函数承担了太多事情，先拆小通常最容易读懂。",
                "结构清楚以后，性能和内存结果也会更容易理解。",
                "刚开始学 Python 时，先看每个函数是不是只做一件事。"
            ]
        },
        performance: {
            title: "性能",
            summary: "不是为了炫技，只是帮你先找到哪里最慢。",
            cards: [
                { label: "执行耗时", value: "18.4 ms" },
                { label: "热点函数", value: "fibonacci" },
                { label: "热点数量", value: "3" }
            ],
            bars: [
                { label: "fibonacci", value: 82 },
                { label: "group_and_score", value: 11 },
                { label: "parse_records", value: 7 }
            ],
            points: [
                "如果一段代码很慢，先看热点，再决定是否优化。",
                "不是所有代码都需要优化，先保证能看懂更重要。",
                "热点条越长，通常越值得优先关注。"
            ]
        },
        memory: {
            title: "内存",
            summary: "这里帮助你判断是不是有太多数据被留在内存里。",
            cards: [
                { label: "峰值内存", value: "0.58 MB" },
                { label: "热点位置", value: "2" },
                { label: "运行状态", value: "正常" }
            ],
            bars: [
                { label: "第 30 行", value: 43 },
                { label: "第 18 行", value: 26 }
            ],
            points: [
                "如果某个大对象存在太久，内存就会升高。",
                "这里的结果适合用来发现明显的大列表或大字典。",
                "就算不懂底层原理，也能先从“是不是存太多”开始理解。"
            ]
        }
    },
    suggestions: [
        {
            id: "split-parser",
            title: "把 parse_records 再拆成两步会更清楚",
            priority: "优先看看",
            confidence: "高",
            impact: "更容易理解",
            risk: "低",
            file: "当前代码",
            note: "清洗、校验和组装记录目前放在了同一个函数里。",
            explanation: "如果你刚开始学 Python，最重要的不是追求复杂写法，而是让每个函数只负责一件比较清楚的事情。",
            diff: [
                [1, " ", "def parse_records(text):", "context"],
                [2, "-", "    records = []", "remove"],
                [2, "+", "    rows = split_rows(text)", "add"],
                [3, "+", "    return build_records(rows)", "add"]
            ]
        }
    ],
    meta: {
        llmConfigured: false,
        provider: "openai",
        model: "default"
    }
};

let dataStore = deepClone(demoData);
let loadingTimer = null;

const state = {
    theme: "mist",
    activeTab: "workflow",
    activeSuggestion: demoData.suggestions[0].id,
    loading: false,
    loadingStep: 0
};

const el = {
    sourceCode: document.getElementById("sourceCode"),
    statusText: document.getElementById("statusText"),
    summaryCards: document.getElementById("summaryCards"),
    tabSummary: document.getElementById("tabSummary"),
    tabBars: document.getElementById("tabBars"),
    tabPoints: document.getElementById("tabPoints"),
    suggestionList: document.getElementById("suggestionList"),
    suggestionDetail: document.getElementById("suggestionDetail"),
    diffFile: document.getElementById("diffFile"),
    diffNote: document.getElementById("diffNote"),
    diffLines: document.getElementById("diffLines"),
    loadingOverlay: document.getElementById("loadingOverlay"),
    loadingText: document.getElementById("loadingText"),
    runAnalysis: document.getElementById("runAnalysis")
};

function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

function currentSuggestions() {
    return dataStore.suggestions || [];
}

function currentAnalysis() {
    return dataStore.analysisMap || {};
}

function currentSuggestion() {
    const suggestions = currentSuggestions();
    return suggestions.find((item) => item.id === state.activeSuggestion) || suggestions[0];
}

function setStatus(text) {
    el.statusText.textContent = text;
}

function setTheme(theme) {
    state.theme = theme;
    document.body.dataset.theme = theme;
}

function renderSummaryCards() {
    el.summaryCards.innerHTML = (dataStore.heroMetrics || []).map((item) => `
        <article class="summary-card">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <div class="suggestion-meta">${item.note || ""}</div>
        </article>
    `).join("");
}

function renderWorkflowMetrics(tabData) {
    const cards = tabData.cards || [];
    if (!cards.length) {
        return `
            <div class="notes-item">
                当前没有可展示的概览指标。
            </div>
        `;
    }

    return `
        <div class="metric-grid">
            ${cards.map((item) => `
                <article class="metric-card">
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                    <p>${item.note || ""}</p>
                </article>
            `).join("")}
        </div>
    `;
}

function renderTab() {
    const tabData = currentAnalysis()[state.activeTab] || currentAnalysis().workflow || {};
    const bars = tabData.bars || [];

    el.tabSummary.innerHTML = `
        <p class="eyebrow">${tabData.title || ""}</p>
        <p>${tabData.summary || ""}</p>
    `;

    if (state.activeTab === "workflow") {
        el.tabBars.innerHTML = renderWorkflowMetrics(tabData);
    } else {
        el.tabBars.innerHTML = `
            <div class="chart-list">
                ${bars.map((item) => `
                    <div class="chart-item">
                        <div class="chart-meta">
                            <span>${item.label}</span>
                            <strong>${item.value}%</strong>
                        </div>
                        <div class="chart-track">
                            <div class="chart-fill" style="width:${Math.max(0, Math.min(100, item.value || 0))}%"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    el.tabPoints.innerHTML = `
        <div class="notes-list">
            ${(tabData.points || []).map((text) => `<div class="notes-item">${text}</div>`).join("")}
        </div>
    `;

    document.querySelectorAll("#resultTabs button").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.tab === state.activeTab);
    });
}

function renderSuggestions() {
    el.suggestionList.innerHTML = currentSuggestions().map((item) => `
        <button class="suggestion-item ${item.id === state.activeSuggestion ? "is-active" : ""}" type="button" data-suggestion="${item.id}">
            <div class="suggestion-title">${item.title}</div>
            <div class="suggestion-meta">${item.note || ""}</div>
        </button>
    `).join("");
}

function renderSuggestionDetail() {
    const item = currentSuggestion();
    if (!item) {
        el.suggestionDetail.innerHTML = "<p>还没有可展示的建议。</p>";
        el.diffFile.textContent = "当前代码";
        el.diffNote.textContent = "分析完成后，这里会显示建议的差异预览。";
        el.diffLines.innerHTML = "";
        return;
    }

    el.suggestionDetail.innerHTML = `
        <p class="eyebrow">为什么建议这样改</p>
        <h3>${item.title}</h3>
        <p>${item.explanation || ""}</p>
        <div class="suggestion-meta">建议强度：${item.priority || "-"} · 置信度：${item.confidence || "-"} · 风险：${item.risk || "-"}</div>
    `;

    el.diffFile.textContent = item.file || "当前代码";
    el.diffNote.textContent = item.note || "";
    el.diffLines.innerHTML = (item.diff || []).map(([line, marker, text, type]) => `
        <div class="diff-line ${type}">
            <span class="line-number">${line}</span>
            <span>${marker}</span>
            <span>${text}</span>
        </div>
    `).join("");
}

function renderAll() {
    renderSummaryCards();
    renderTab();
    renderSuggestions();
    renderSuggestionDetail();
}

function applyPayload(payload) {
    dataStore = {
        heroMetrics: payload.heroMetrics || deepClone(demoData.heroMetrics),
        analysisMap: payload.analysisMap || deepClone(demoData.analysisMap),
        suggestions: payload.suggestions && payload.suggestions.length ? payload.suggestions : deepClone(demoData.suggestions),
        meta: payload.meta || {}
    };

    state.activeTab = "workflow";
    state.activeSuggestion = (currentSuggestions()[0] && currentSuggestions()[0].id) || demoData.suggestions[0].id;
    renderAll();
}

function buildAnalysisStatus(meta = {}) {
    const mode = meta.llmConfigured
        ? `多智能体已启用：${meta.provider || "openai"} / ${meta.model || "default"}`
        : "当前使用本地回退模式，配置模型 API 后会自动启用多智能体结果";

    if (meta.runtimeError) {
        return `分析已完成，但代码执行时出现异常：${meta.runtimeError}。${mode}`;
    }

    return `分析完成。${mode}`;
}

function setLoading(loading) {
    state.loading = loading;
    document.body.classList.toggle("is-loading", loading);
    el.loadingOverlay.hidden = !loading;
    el.runAnalysis.disabled = loading;

    if (!loading) {
        if (loadingTimer) {
            window.clearInterval(loadingTimer);
            loadingTimer = null;
        }
        return;
    }

    state.loadingStep = 0;
    el.loadingText.textContent = loadingCopies[state.loadingStep];
    loadingTimer = window.setInterval(() => {
        state.loadingStep = (state.loadingStep + 1) % loadingCopies.length;
        el.loadingText.textContent = loadingCopies[state.loadingStep];
    }, 1200);
}

async function runAnalysis() {
    const code = el.sourceCode.value.trim();
    if (!code) {
        setStatus("请先输入 Python 代码。");
        return;
    }

    setLoading(true);
    setStatus("正在分析这段代码，请稍等...");

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });
        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.detail || "分析失败");
        }

        applyPayload(payload);
        setStatus(buildAnalysisStatus(payload.meta || {}));
    } catch (error) {
        console.error(error);
        setStatus(`分析失败：${error.message}`);
    } finally {
        setLoading(false);
    }
}

function loadSample() {
    el.sourceCode.value = sampleCode;
    dataStore = deepClone(demoData);
    state.activeTab = "workflow";
    state.activeSuggestion = demoData.suggestions[0].id;
    renderAll();
    setStatus("示例已载入。点击“分析代码”查看真实结果。");
}

function clearCode() {
    el.sourceCode.value = "";
    dataStore = deepClone(demoData);
    state.activeTab = "workflow";
    state.activeSuggestion = demoData.suggestions[0].id;
    renderAll();
    setStatus("输入框已清空。");
}

function bind() {
    document.getElementById("themeToggle").addEventListener("click", () => {
        const index = themes.indexOf(state.theme);
        setTheme(themes[(index + 1) % themes.length]);
    });

    document.getElementById("loadSample").addEventListener("click", loadSample);
    document.getElementById("clearCode").addEventListener("click", clearCode);
    document.getElementById("runAnalysis").addEventListener("click", runAnalysis);

    document.getElementById("resultTabs").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tab]");
        if (!button) {
            return;
        }
        state.activeTab = button.dataset.tab;
        renderTab();
    });

    el.suggestionList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-suggestion]");
        if (!button) {
            return;
        }
        state.activeSuggestion = button.dataset.suggestion;
        renderSuggestions();
        renderSuggestionDetail();
    });
}

setTheme(state.theme);
loadSample();
bind();
