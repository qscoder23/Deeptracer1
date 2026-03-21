from __future__ import annotations

import os
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from deeptracer import DEEPTRACER_DEV_ROOT
from deeptracer.graph.workflow import run_analysis_graph_for_input


HOST = "127.0.0.1"
PORT = 8000


def create_app() -> FastAPI:
    app = FastAPI(
        title="deeptracer",
        description="Python code analysis workspace",
    )

    static_path = os.path.join(DEEPTRACER_DEV_ROOT, "deeptracer", "static")
    templates_path = os.path.join(DEEPTRACER_DEV_ROOT, "deeptracer", "templates")
    os.makedirs(static_path, exist_ok=True)
    os.makedirs(templates_path, exist_ok=True)

    app.mount("/static", StaticFiles(directory=static_path), name="static")
    templates = Jinja2Templates(directory=templates_path)

    @app.get("/", response_class=HTMLResponse, summary="Web workspace")
    async def index(request: Request):
        try:
            return templates.TemplateResponse("index.html", {"request": request})
        except Exception:
            return HTMLResponse(content="<h1>404 - File Not Found</h1>", status_code=404)

    @app.post("/api/analyze", summary="Analyze Python code with the LangGraph workflow")
    async def analyze(payload: dict[str, str]):
        target_path = (payload.get("path") or "").strip()
        source_code = payload.get("code") or ""
        if not target_path and not source_code.strip():
            raise HTTPException(status_code=400, detail="Missing required field: code or path")

        try:
            return run_analysis_graph_for_input(
                path_text=target_path or None,
                source_code=source_code or None,
            )
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def catch_all(request: Request, full_path: Any = None):
        try:
            return templates.TemplateResponse("index.html", {"request": request})
        except Exception:
            return HTMLResponse(content="<h1>404 - File Not Found</h1>", status_code=404)

    return app


def main() -> None:
    uvicorn.run(
        app=create_app(),
        host=HOST,
        port=PORT,
        log_level="info",
    )


def start(astAnalyer=None, speedAnalyer=None, workflow=None) -> None:
    # Keep backward compatibility with the original server entrypoint.
    main()


if __name__ == "__main__":
    main()
