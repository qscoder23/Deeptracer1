from __future__ import annotations

import os
from functools import lru_cache


@lru_cache(maxsize=1)
def get_chat_model(optional: bool = False):
    provider = os.getenv("DEEPTRACER_MODEL_PROVIDER", "openai").lower().strip()
    model_name = os.getenv("DEEPTRACER_MODEL_NAME") or os.getenv("OPENAI_MODEL") or "gpt-4.1-mini"

    if provider != "openai":
        if optional:
            return None
        raise ValueError(f"Unsupported model provider: {provider}")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        if optional:
            return None
        raise ValueError("OPENAI_API_KEY is missing. Please configure your model API first.")

    from langchain_openai import ChatOpenAI

    kwargs = {
        "model": model_name,
        "temperature": float(os.getenv("DEEPTRACER_MODEL_TEMPERATURE", "0.2")),
        "api_key": api_key,
    }
    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url:
        kwargs["base_url"] = base_url

    return ChatOpenAI(**kwargs)


def describe_model_runtime() -> dict[str, object]:
    provider = os.getenv("DEEPTRACER_MODEL_PROVIDER", "openai").lower().strip()
    model_name = os.getenv("DEEPTRACER_MODEL_NAME") or os.getenv("OPENAI_MODEL") or "gpt-4.1-mini"
    has_api_key = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "provider": provider,
        "model": model_name,
        "llmConfigured": has_api_key and provider == "openai",
    }
