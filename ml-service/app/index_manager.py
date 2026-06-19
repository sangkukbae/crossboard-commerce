from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


class IndexManager:
    def __init__(self) -> None:
        self.products: list[dict] = []
        self.product_ids: list[int] = []
        self.embeddings: np.ndarray = np.empty((0, 64), dtype=np.float32)

    def load_seed(self, path: Path) -> None:
        products = json.loads(path.read_text(encoding="utf-8"))
        self.build(products)

    def build(self, products: list[dict]) -> None:
        self.products = products
        self.product_ids = [int(product["id"]) for product in products]
        vectors = [self.get_embedding(f'{product["name"]} {product["description"]}') for product in products]
        self.embeddings = np.vstack(vectors).astype(np.float32)

    def get_embedding(self, text: str) -> np.ndarray:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = np.frombuffer(digest + digest, dtype=np.uint8).astype(np.float32)[:64]
        vector = (values - values.mean()) / (values.std() + 1e-6)
        norm = np.linalg.norm(vector)
        return vector / norm

    def search(self, product_id: int, top_k: int = 5) -> list[dict]:
        if product_id not in self.product_ids:
            raise KeyError(product_id)
        index = self.product_ids.index(product_id)
        query = self.embeddings[index]
        scores = self.embeddings @ query
        ranked = sorted(
            [
                {"product_id": pid, "score": float(scores[position])}
                for position, pid in enumerate(self.product_ids)
                if pid != product_id
            ],
            key=lambda row: row["score"],
            reverse=True,
        )
        return ranked[: min(top_k, max(0, len(self.product_ids) - 1))]
