from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from deeptracer.agents.schemas import PerformanceAgentResult
from deeptracer.agents.utils import to_json_text
from deeptracer.modeling.llm import get_chat_model


def run_performance_agent(code: str, local_analysis: dict) -> dict:
    llm = get_chat_model(optional=True)
    perf_view = local_analysis["analysisMap"]["performance"]

    if llm is None:
        return {
            "summary": perf_view["summary"],
            "hottest_function": perf_view["cards"][1]["value"],
            "points": perf_view["points"],
        }

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是 Python 性能分析助手。只解释哪里慢、是否值得优化、为什么。"
                "不要夸张，不要脱离给定数据。",
            ),
            (
                "human",
                "原始代码：\n{code}\n\n性能摘要：\n{perf_view}\n\n"
                "请输出性能总结、热点函数、三条易懂说明。",
            ),
        ]
    )
    chain = prompt | llm.with_structured_output(PerformanceAgentResult)
    result = chain.invoke({"code": code, "perf_view": to_json_text(perf_view)})
    return result.model_dump()
