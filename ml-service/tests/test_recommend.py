from pathlib import Path

from app.index_manager import IndexManager


def test_recommendations_exclude_self() -> None:
    manager = IndexManager()
    manager.load_seed(Path(__file__).parents[1] / "app" / "seed_products.json")

    recommendations = manager.search(1)

    assert recommendations
    assert all(row["product_id"] != 1 for row in recommendations)
    assert len(recommendations) == min(5, len(manager.product_ids) - 1)


def test_embedding_is_deterministic() -> None:
    manager = IndexManager()
    first = manager.get_embedding("한국어 추천 모델 운영")
    second = manager.get_embedding("한국어 추천 모델 운영")

    assert float(first @ second) >= 0.999
