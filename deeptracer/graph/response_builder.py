from __future__ import annotations

from typing import Any

from deeptracer.modeling.llm import describe_model_runtime


def build_frontend_response(state: dict[str, Any]) -> dict[str, Any]:
    local_analysis = state["local_analysis"]
    structure = state.get("structure_result", {})
    performance = state.get("performance_result", {})
    memory = state.get("memory_result", {})
    refactor = state.get("refactor_result", {})
    teaching = state.get("teaching_result", {})

    analysis_map = local_analysis["analysisMap"]
    analysis_map["ast"]["summary"] = structure.get("summary", analysis_map["ast"]["summary"])
    analysis_map["ast"]["points"] = structure.get("points", analysis_map["ast"]["points"])

    analysis_map["performance"]["summary"] = performance.get("summary", analysis_map["performance"]["summary"])
    analysis_map["performance"]["points"] = performance.get("points", analysis_map["performance"]["points"])

    analysis_map["memory"]["summary"] = memory.get("summary", analysis_map["memory"]["summary"])
    analysis_map["memory"]["points"] = memory.get("points", analysis_map["memory"]["points"])

    analysis_map["workflow"]["summary"] = teaching.get("overview", analysis_map["workflow"]["summary"])
    analysis_map["workflow"]["points"] = [
        teaching.get("overview", analysis_map["workflow"]["points"][0]),
        teaching.get("beginner_tip", analysis_map["workflow"]["points"][1]),
        teaching.get("next_step", analysis_map["workflow"]["points"][2]),
    ]

    return {
        "heroMetrics": local_analysis["heroMetrics"],
        "analysisMap": analysis_map,
        "suggestions": refactor.get("suggestions", local_analysis.get("suggestions", [])),
        "stages": local_analysis["stages"],
        "teaching": teaching,
        "meta": {
            **local_analysis.get("meta", {}),
            "taskId": state["task_id"],
            "agentMode": "langgraph",
            **describe_model_runtime(),
        },
    }
