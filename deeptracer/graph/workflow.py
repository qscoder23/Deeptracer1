from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from deeptracer.agents import (
    run_memory_agent,
    run_performance_agent,
    run_refactor_agent,
    run_structure_agent,
    run_teaching_agent,
)
from deeptracer.graph.response_builder import build_frontend_response
from deeptracer.graph.state import AnalysisState
from deeptracer.server.analysis_service import analyze_python_input


def local_tools_node(state: AnalysisState) -> dict:
    return {
        "local_analysis": analyze_python_input(
            path_text=state.get("path_text"),
            source_code=state["code"],
        )
    }


def structure_node(state: AnalysisState) -> dict:
    return {"structure_result": run_structure_agent(state["code"], state["local_analysis"])}


def performance_node(state: AnalysisState) -> dict:
    return {"performance_result": run_performance_agent(state["code"], state["local_analysis"])}


def memory_node(state: AnalysisState) -> dict:
    return {"memory_result": run_memory_agent(state["code"], state["local_analysis"])}


def refactor_node(state: AnalysisState) -> dict:
    return {
        "refactor_result": run_refactor_agent(
            state["code"],
            state["local_analysis"],
            state["structure_result"],
            state["performance_result"],
            state["memory_result"],
        )
    }


def teaching_node(state: AnalysisState) -> dict:
    return {
        "teaching_result": run_teaching_agent(
            state["code"],
            state["structure_result"],
            state["performance_result"],
            state["memory_result"],
            state["refactor_result"],
        )
    }


def response_node(state: AnalysisState) -> dict:
    return {"final_response": build_frontend_response(state)}


def build_analysis_graph():
    graph = StateGraph(AnalysisState)
    graph.add_node("local_tools", local_tools_node)
    graph.add_node("structure", structure_node)
    graph.add_node("performance", performance_node)
    graph.add_node("memory", memory_node)
    graph.add_node("refactor", refactor_node)
    graph.add_node("teaching", teaching_node)
    graph.add_node("response", response_node)

    graph.add_edge(START, "local_tools")
    graph.add_edge("local_tools", "structure")
    graph.add_edge("structure", "performance")
    graph.add_edge("performance", "memory")
    graph.add_edge("memory", "refactor")
    graph.add_edge("refactor", "teaching")
    graph.add_edge("teaching", "response")
    graph.add_edge("response", END)
    return graph.compile()


@lru_cache(maxsize=1)
def get_analysis_graph():
    return build_analysis_graph()


def run_analysis_graph(code: str, path_text: str | None = None) -> dict:
    state: AnalysisState = {
        "code": code,
        "task_id": str(uuid4()),
        "local_analysis": {},
    }
    if path_text:
        state["path_text"] = path_text
    result = get_analysis_graph().invoke(state)
    return result["final_response"]


def run_analysis_graph_for_input(path_text: str | None = None, source_code: str | None = None) -> dict:
    if source_code and source_code.strip():
        return run_analysis_graph(code=source_code, path_text=path_text)
    if path_text:
        target = Path(path_text).expanduser()
        code = target.read_text(encoding="utf-8")
        return run_analysis_graph(code=code, path_text=path_text)
    raise ValueError("Missing required field: code or path")
