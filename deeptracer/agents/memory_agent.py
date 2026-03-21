from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from deeptracer.agents.schemas import MemoryAgentResult
from deeptracer.agents.utils import to_json_text
from deeptracer.modeling.llm import get_chat_model


def run_memory_agent(code: str, local_analysis: dict) -> dict:
    llm = get_chat_model(optional=True)
    memory_view = local_analysis["analysisMap"]["memory"]

    if llm is None:
        return {
            "summary": memory_view["summary"],
            "focus_area": memory_view["cards"][0]["value"],
            "points": memory_view["points"],
        }

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是 Python 内存分析助手。只解释内存是否值得关注、原因是什么、初学者该怎么看。"
                "避免生硬术语。",
            ),
            (
                "human",
                "原始代码：\n{code}\n\n内存摘要：\n{memory_view}\n\n"
                "请输出内存总结、重点位置、三条易懂说明。",
            ),
        ]
    )
    chain = prompt | llm.with_structured_output(MemoryAgentResult)
    result = chain.invoke({"code": code, "memory_view": to_json_text(memory_view)})
    return result.model_dump()
