from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .index_manager import IndexManager

app = FastAPI(title="KR-CN Commerce Recommendation Service")
manager = IndexManager()


class RecommendRequest(BaseModel):
    product_id: int


@app.on_event("startup")
def startup() -> None:
    manager.load_seed(Path(__file__).with_name("seed_products.json"))


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": "deterministic-fallback", "index_size": len(manager.product_ids)}


@app.post("/recommend")
def recommend(request: RecommendRequest) -> dict:
    try:
        return {"recommendations": manager.search(request.product_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다.") from exc


@app.get("/index/stats")
def stats() -> dict:
    return {"index_size": len(manager.product_ids), "dimension": int(manager.embeddings.shape[1])}


@app.post("/index/rebuild")
def rebuild() -> dict:
    manager.load_seed(Path(__file__).with_name("seed_products.json"))
    return {"status": "rebuilt", "index_size": len(manager.product_ids)}
