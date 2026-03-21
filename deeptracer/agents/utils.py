from __future__ import annotations

import json
from typing import Any


def to_json_text(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2)
