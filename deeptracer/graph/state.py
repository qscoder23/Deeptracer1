from __future__ import annotations

from typing import Any

from typing_extensions import NotRequired, TypedDict


class AnalysisState(TypedDict):
    code: str
    task_id: str
    path_text: NotRequired[str]
    local_analysis: dict[str, Any]
    structure_result: NotRequired[dict[str, Any]]
    performance_result: NotRequired[dict[str, Any]]
    memory_result: NotRequired[dict[str, Any]]
    refactor_result: NotRequired[dict[str, Any]]
    teaching_result: NotRequired[dict[str, Any]]
    final_response: NotRequired[dict[str, Any]]
