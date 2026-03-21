from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from deeptracer.agents.schemas import RefactorAgentResult
from deeptracer.agents.utils import to_json_text
from deeptracer.modeling.llm import get_chat_model


def run_refactor_agent(code: str, local_analysis: dict, structure: dict, performance: dict, memory: dict) -> dict:
    llm = get_chat_model(optional=True)
    local_suggestions = local_analysis.get("suggestions", [])

    if llm is None:
        return {"suggestions": local_suggestions}

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是 Python 重构建议助手。请综合结构、性能和内存信息，给出 1 到 3 条具体建议。"
                "建议必须适合初学者阅读，不要炫技，不要给无法解释的改法。",
            ),
            (
                "human",
                "原始代码：\n{code}\n\n结构结果：\n{structure}\n\n性能结果：\n{performance}\n\n"
                "内存结果：\n{memory}\n\n本地建议草稿：\n{local_suggestions}\n\n"
                "请输出结构化建议列表。",
            ),
        ]
    )
    chain = prompt | llm.with_structured_output(RefactorAgentResult)
    result = chain.invoke(
        {
            "code": code,
            "structure": to_json_text(structure),
            "performance": to_json_text(performance),
            "memory": to_json_text(memory),
            "local_suggestions": to_json_text({"suggestions": local_suggestions}),
        }
    )
    return result.model_dump()
