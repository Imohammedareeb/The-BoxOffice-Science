"""
Database seeding — runs on startup (idempotent).

Ports the former Postgres seed (database/schema/02_movies.sql + the demo-user
migration) to MongoDB:
  * 18 curated films in the shared ``movies`` collection.
  * A demo account so the credentials in the README work out of the box.
"""

from __future__ import annotations

import logging

from app.models.documents import Movie, User
from app.services.auth_service import hash_password

logger = logging.getLogger("bos.seed")

DEMO_EMAIL = "demo@boxofficescience.ai"
DEMO_PASSWORD = "Demo@1234"


# ── Curated catalog (title, genre, year, budget, box_office, roi, ...) ──────────
_SEED_MOVIES: list[dict] = [
    # Original IP set
    {"title": "THE ETERNAL GLOW", "genre": "Sci-Fi", "year": 2023, "budget": 185_000_000, "box_office": 892_000_000, "roi": 382.0, "director": "Jonas Reid", "studio": "MERIDIAN", "cast_tier": "A-List", "release_season": "Summer", "description": "A gritty space opera about the last human colony.", "tags": ["space", "survival", "epic", "vfx-heavy"]},
    {"title": "NEON PROTOCOL", "genre": "Action", "year": 2022, "budget": 120_000_000, "box_office": 634_000_000, "roi": 228.0, "director": "Lyra Mune", "studio": "CHROME PIC.", "cast_tier": "A-List", "release_season": "Summer", "description": "A cyberpunk thriller in a dystopian megacity.", "tags": ["cyberpunk", "action", "AI", "urban"]},
    {"title": "FRACTURED SKY", "genre": "Thriller", "year": 2023, "budget": 80_000_000, "box_office": 441_000_000, "roi": 201.0, "director": "Iris Vale", "studio": "NOVA FILM", "cast_tier": "B-List", "release_season": "Fall", "description": "Psychological thriller aboard a near-future space station.", "tags": ["psychological", "space", "mystery"]},
    {"title": "CHROME DEITY", "genre": "Fantasy", "year": 2021, "budget": 250_000_000, "box_office": 1_240_000_000, "roi": 296.0, "director": "Aria Voss", "studio": "APEX STUDIOS", "cast_tier": "A-List", "release_season": "Holiday", "description": "Mythological fantasy with warring pantheons.", "tags": ["mythology", "fantasy", "epic", "vfx-heavy"]},
    {"title": "VOID SEEKER", "genre": "Sci-Fi", "year": 2022, "budget": 95_000_000, "box_office": 378_000_000, "roi": 198.0, "director": "Marcus Sol", "studio": "NOVA FILM", "cast_tier": "B-List", "release_season": "Spring", "description": "First contact: a linguist decodes alien signals.", "tags": ["first-contact", "cerebral", "alien"]},
    {"title": "GHOST PROTOCOL 7", "genre": "Action", "year": 2023, "budget": 160_000_000, "box_office": 820_000_000, "roi": 213.0, "director": "Sable Crown", "studio": "CARDINAL", "cast_tier": "A-List", "release_season": "Summer", "description": "Globe-trotting spy saga with practical stunts.", "tags": ["spy", "action", "franchise"]},
    {"title": "BLOOD CARNIVAL", "genre": "Horror", "year": 2021, "budget": 18_000_000, "box_office": 142_000_000, "roi": 689.0, "director": "Dex Cole", "studio": "INDIE FLAG", "cast_tier": "B-List", "release_season": "Fall", "description": "Supernatural horror in an abandoned carnival.", "tags": ["horror", "supernatural", "low-budget"]},
    {"title": "STARFALL", "genre": "Animation", "year": 2022, "budget": 170_000_000, "box_office": 610_000_000, "roi": 259.0, "director": "Zola Prim", "studio": "APEX STUDIOS", "cast_tier": "A-List", "release_season": "Holiday", "description": "Animated adventure about a girl and the stars.", "tags": ["animation", "family", "adventure", "wonder"]},
    # Real TMDb films
    {"title": "Avatar: Fire and Ash", "genre": "Science Fiction", "year": 2025, "budget": 350_000_000, "box_office": 1_485_966_646, "roi": 424.56, "studio": "20th Century Studios", "description": "Jake Sully and Neytiri face a new threat on Pandora: the Ash People.", "tags": ["science fiction", "adventure", "fantasy"]},
    {"title": "Hoppers", "genre": "Animation", "year": 2026, "budget": 150_000_000, "box_office": 334_993_260, "roi": 223.33, "studio": "Universal Pictures", "description": "Scientists discover how to hop human consciousness into robotic animals.", "tags": ["animation", "family", "science fiction", "comedy"]},
    {"title": "The Super Mario Bros. Movie", "genre": "Family", "year": 2023, "budget": 100_000_000, "box_office": 1_360_879_735, "roi": 1360.88, "studio": "Universal Pictures", "description": "Brooklyn plumbers Mario and Luigi are transported into a magical new world.", "tags": ["family", "comedy", "adventure", "fantasy", "animation"]},
    {"title": "Shelter", "genre": "Action", "year": 2026, "budget": 50_000_000, "box_office": 49_305_541, "roi": 98.61, "studio": "Lionsgate", "description": "A man in exile rescues a young girl, setting off a dangerous chain of events.", "tags": ["action", "crime", "thriller"]},
    {"title": "Crime 101", "genre": "Crime", "year": 2026, "budget": 90_000_000, "box_office": 72_559_167, "roi": 80.62, "studio": "Sony Pictures", "description": "An elusive thief eyes the score of a lifetime along the 101 freeway.", "tags": ["crime", "thriller"]},
    {"title": "Greenland 2: Migration", "genre": "Adventure", "year": 2026, "budget": 90_000_000, "box_office": 44_579_387, "roi": 49.53, "studio": "STXfilms", "description": "The Garrity family embarks on a perilous journey across post-apocalyptic Europe.", "tags": ["adventure", "thriller", "science fiction"]},
    {"title": "Project Hail Mary", "genre": "Science Fiction", "year": 2026, "budget": 200_000_000, "box_office": 433_030_505, "roi": 216.52, "studio": "MGM", "description": "A science teacher wakes on a spaceship with a mission to save the dying sun.", "tags": ["science fiction", "adventure"]},
    {"title": "GOAT", "genre": "Animation", "year": 2026, "budget": 90_000_000, "box_office": 185_575_707, "roi": 206.2, "studio": "Illumination", "description": "A small goat with big dreams gets a shot at the pros in roarball.", "tags": ["animation", "comedy", "family"]},
    {"title": "The Super Mario Galaxy Movie", "genre": "Family", "year": 2026, "budget": 110_000_000, "box_office": 437_751_829, "roi": 397.96, "studio": "Universal Pictures", "description": "Mario and Luigi travel across the stars to stop Bowser Jr.", "tags": ["family", "comedy", "adventure", "fantasy", "animation"]},
    {"title": "The Bride!", "genre": "Science Fiction", "year": 2026, "budget": 80_000_000, "box_office": 23_444_025, "roi": 29.31, "studio": "Universal Pictures", "description": "A lonely Frankenstein asks a scientist to create a companion in 1930s Chicago.", "tags": ["science fiction", "horror", "fantasy"]},
]


async def seed_movies() -> None:
    """Insert the curated catalog if the movies collection is empty."""
    if await Movie.find_all().count() > 0:
        return
    await Movie.insert_many([Movie(**m) for m in _SEED_MOVIES])
    logger.info("🎬 Seeded %d movies.", len(_SEED_MOVIES))


async def seed_demo_user() -> None:
    """Create the demo account if it does not already exist."""
    if await User.find_one(User.email == DEMO_EMAIL):
        return
    await User(
        email=DEMO_EMAIL,
        display_name="Demo Analyst",
        hashed_pw=hash_password(DEMO_PASSWORD),
        tier="Executive",
    ).insert()
    logger.info("👤 Seeded demo user (%s).", DEMO_EMAIL)


async def run_seed() -> None:
    """Run all idempotent seeders."""
    await seed_movies()
    await seed_demo_user()
