"""
Catalog analytics helpers.

Small aggregation utilities over the shared ``movies`` collection. The catalog
is intentionally tiny (a couple dozen curated films), so we load the documents
and aggregate in Python — simpler and clearer than Mongo pipelines at this size.
"""

from __future__ import annotations

from app.models.documents import Movie


async def all_movies() -> list[Movie]:
    """Return every movie in the shared catalog."""
    return await Movie.find_all().to_list()


async def movies_with_roi() -> list[Movie]:
    """Movies that have a non-null ROI, sorted by ROI descending."""
    movies = [m for m in await all_movies() if m.roi is not None]
    movies.sort(key=lambda m: m.roi or 0, reverse=True)
    return movies


async def genre_roi_rows() -> list[dict]:
    """
    Per-genre average ROI aggregation, sorted by avg ROI descending.
    Shape matches what the sentiment engine and dashboard expect:
        [{"genre": str, "avg_roi": float, "count": int}, ...]
    """
    buckets: dict[str, list[float]] = {}
    for m in await all_movies():
        if m.roi is None:
            continue
        buckets.setdefault(m.genre, []).append(float(m.roi))

    rows = [
        {"genre": genre, "avg_roi": sum(rois) / len(rois), "count": len(rois)}
        for genre, rois in buckets.items()
    ]
    rows.sort(key=lambda r: r["avg_roi"], reverse=True)
    return rows
