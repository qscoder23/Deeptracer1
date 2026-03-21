from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from deeptracer.agents.schemas import StructureAgentResult
from deeptracer.agents.utils import to_json_text
from deeptracer.modeling.llm import get_chat_model


def run_structure_agent(code: str, local_analysis: dict) -> dict:
    llm = get_chat_model(optional=True)
    ast_view = local_analysis["analysisMap"]["ast"]

    if llm is None:
        return {
            "summary": ast_view["summary"],
            "focus_function": ast_view["cards"][2]["value"],
            "points": ast_view["points"],
        }

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是 Python 结构分析助手。你只负责解释结构，不讨论性能和内存。"
                "输出要简洁、中文、适合零基础学习者。",
            ),
            (
                "human",
                "原始代码：\n{code}\n\nAST 摘要：\n{ast_view}\n\n"
                "请给出：结构总结、最值得先看的函数、三条易懂提醒。",
            ),
        ]
    )
    chain = prompt | llm.with_structured_output(StructureAgentResult)
    result = chain.invoke({"code": code, "ast_view": to_json_text(ast_view)})
    return result.model_dump()
