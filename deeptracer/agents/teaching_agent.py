from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from deeptracer.agents.schemas import TeachingAgentResult
from deeptracer.agents.utils import to_json_text
from deeptracer.modeling.llm import get_chat_model


def run_teaching_agent(code: str, structure: dict, performance: dict, memory: dict, refactor: dict) -> dict:
    llm = get_chat_model(optional=True)

    if llm is None:
        focus = structure.get("focus_function", "当前代码")
        return {
            "overview": f"先看懂 {focus} 在做什么，再决定要不要继续优化。",
            "beginner_tip": "如果一段代码让你读起来吃力，先拆清楚函数职责，通常比直接优化更有帮助。",
            "next_step": "先点开第一条建议，看看它为什么被推荐。",
        }

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "你是面向零基础学习者的 Python 讲解助手。请把分析结果翻译成人话，简洁、温和、直接。",
            ),
            (
                "human",
                "原始代码：\n{code}\n\n结构结果：\n{structure}\n\n性能结果：\n{performance}\n\n"
                "内存结果：\n{memory}\n\n建议结果：\n{refactor}\n\n"
                "请输出：整体说明、初学者提示、推荐下一步。",
            ),
        ]
    )
    chain = prompt | llm.with_structured_output(TeachingAgentResult)
    result = chain.invoke(
        {
            "code": code,
            "structure": to_json_text(structure),
            "performance": to_json_text(performance),
            "memory": to_json_text(memory),
            "refactor": to_json_text(refactor),
        }
    )
    return result.model_dump()
