"""
NLP Concept Matcher Service
Semantic similarity scoring against the high-performing IP database.
In production: uses sentence-transformers + vector similarity search.
For now: TF-IDF + keyword overlap simulation.
"""

from fastapi import HTTPException, status

from app.models.financial_specs import NLPMatchResponse

# ── IP Database (Real Data from TMDb) ──
IP_DATABASE = [
    {
        "title": "Avatar: Fire and Ash",
        "genre": "Science Fiction",
        "year": 2025,
        "box_office": 1485966646,
        "budget": 350000000,
        "roi": 424.56,
        "director": "James Cameron",
        "studio": "20th Century Studios",
        "description": "In the wake of the devastating war against the RDA and the loss of their eldest son, Jake Sully and Neytiri face a new threat on Pandora: the Ash People, a violent and power-hungry Na'vi tribe led by the ruthless Varang. Jake's family must fight for their survival and the future of Pandora in a conflict that pushes them to their emotional and physical limits.",
        "tags": ["science fiction", "adventure", "fantasy"],
    },
    {
        "title": "Hoppers",
        "genre": "Animation",
        "year": 2026,
        "box_office": 334993260,
        "budget": 150000000,
        "roi": 223.33,
        "director": "Daniel Chong",
        "studio": "Pixar",
        "description": "Scientists have discovered how to 'hop' human consciousness into lifelike robotic animals, allowing people to communicate with animals as animals. Animal lover Mabel seizes an opportunity to use the technology, uncovering mysteries within the animal world beyond anything she could have imagined.",
        "tags": ["animation", "family", "science fiction", "comedy", "adventure"],
    },
    {
        "title": "The Super Mario Bros. Movie",
        "genre": "Family",
        "year": 2023,
        "box_office": 1360879735,
        "budget": 100000000,
        "roi": 1360.88,
        "director": "Aaron Horvath",
        "studio": "Illumination",
        "description": "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi.",
        "tags": ["family", "comedy", "adventure", "fantasy", "animation"],
    },
    {
        "title": "Shelter",
        "genre": "Action",
        "year": 2026,
        "box_office": 49305541,
        "budget": 50000000,
        "roi": 98.61,
        "director": "TBA",
        "studio": "Warner Bros.",
        "description": "A man living in self-imposed exile on a remote island rescues a young girl from a violent storm, setting off a chain of events that forces him out of seclusion to protect her from enemies tied to his past.",
        "tags": ["action", "crime", "thriller"],
    },
    {
        "title": "Crime 101",
        "genre": "Crime",
        "year": 2026,
        "box_office": 72559167,
        "budget": 90000000,
        "roi": 80.62,
        "director": "Bart Layton",
        "studio": "Amazon MGM",
        "description": "When an elusive thief whose high-stakes heists unfold along the iconic 101 freeway in Los Angeles eyes the score of a lifetime, with hopes of this being his final job, his path collides with a disillusioned insurance broker who is facing her own crossroads. Determined to crack the case, a relentless detective closes in on the operation, raising the stakes even higher.",
        "tags": ["crime", "thriller"],
    },
    {
        "title": "Greenland 2: Migration",
        "genre": "Adventure",
        "year": 2026,
        "box_office": 44579387,
        "budget": 90000000,
        "roi": 49.53,
        "director": "Ric Roman Waugh",
        "studio": "STX Entertainment",
        "description": "Having found the safety of the Greenland bunker after the comet Clarke decimated the Earth, the Garrity family must now risk everything to embark on a perilous journey across the wasteland of Europe to find a new home.",
        "tags": ["adventure", "thriller", "science fiction"],
    },
    {
        "title": "Project Hail Mary",
        "genre": "Science Fiction",
        "year": 2026,
        "box_office": 433030505,
        "budget": 200000000,
        "roi": 216.52,
        "director": "Phil Lord",
        "studio": "MGM",
        "description": "Science teacher Ryland Grace wakes up on a spaceship light years from home with no recollection of who he is or how he got there. As his memory returns, he begins to uncover his mission: solve the riddle of the mysterious substance causing the sun to die out. He must call on his scientific knowledge and unorthodox ideas to save everything on Earth from extinction… but an unexpected friendship means he may not have to do it alone.",
        "tags": ["science fiction", "adventure"],
    },
    {
        "title": "GOAT",
        "genre": "Animation",
        "year": 2026,
        "box_office": 185575707,
        "budget": 90000000,
        "roi": 206.2,
        "director": "TBA",
        "studio": "Sony Pictures",
        "description": "A small goat with big dreams gets a once-in-a-lifetime shot to join the pros and play roarball, a high-intensity, co-ed, full-contact sport dominated by the fastest, fiercest animals in the world.",
        "tags": ["animation", "comedy", "family"],
    },
    {
        "title": "The Super Mario Galaxy Movie",
        "genre": "Family",
        "year": 2026,
        "box_office": 437751829,
        "budget": 110000000,
        "roi": 397.96,
        "director": "TBA",
        "studio": "Illumination",
        "description": "Having thwarted Bowser's previous plot to marry Princess Peach, Mario and Luigi now face a fresh threat in Bowser Jr., who is determined to liberate his father from captivity and restore the family legacy. Alongside companions new and old, the brothers travel across the stars to stop the young heir's crusade.",
        "tags": ["family", "comedy", "adventure", "fantasy", "animation"],
    },
    {
        "title": "The Bride!",
        "genre": "Science Fiction",
        "year": 2026,
        "box_office": 23444025,
        "budget": 80000000,
        "roi": 29.31,
        "director": "Maggie Gyllenhaal",
        "studio": "Warner Bros.",
        "description": "A lonely Frankenstein travels to 1930s Chicago to ask groundbreaking scientist Dr. Euphronious to create a companion for him. The two revive a murdered young woman and The Bride is born. But what ensues is beyond what either of them imagined.",
        "tags": ["science fiction", "horror", "fantasy"],
    },
]


def _tokenize(text: str) -> set[str]:
    """Simple tokenizer: lowercase words, remove stopwords."""
    stopwords = {"a", "an", "the", "in", "on", "of", "with", "and", "or", "is", "are", "to", "for"}
    return {w for w in text.lower().split() if len(w) > 2 and w not in stopwords}


def _score_similarity(concept: str, ip: dict) -> float:
    """
    Compute similarity score using keyword overlap.
    Production version would use sentence-transformers cosine similarity.
    """
    concept_tokens = _tokenize(concept)
    concept_lower = concept.lower()

    score = 0.0

    # Genre keyword match
    if ip["genre"].lower() in concept_lower:
        score += 0.25

    # Tag overlap
    for tag in ip["tags"]:
        tag_tokens = _tokenize(tag)
        if concept_tokens & tag_tokens:
            score += 0.10
        elif tag in concept_lower:
            score += 0.08

    # Description overlap
    desc_tokens = _tokenize(ip["description"])
    overlap = len(concept_tokens & desc_tokens)
    score += min(overlap * 0.07, 0.25)

    # Title keyword match
    title_tokens = _tokenize(ip["title"])
    if concept_tokens & title_tokens:
        score += 0.08

    return round(min(0.98, max(0.12, score)), 3)


def match_concepts(concept: str, top_k: int = 5) -> list[NLPMatchResponse]:
    """
    Match a concept string against the IP database and return
    top_k results sorted by similarity score descending.
    """
    # Validation: reject concepts with fewer than 3 significant tokens
    tokens = _tokenize(concept)
    if len(tokens) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Concept is too vague — please provide at least 3 descriptive keywords. "
                "Example: 'a space opera about survival and alien contact'."
            ),
        )

    scored = []
    for ip in IP_DATABASE:
        sim = _score_similarity(concept, ip)
        scored.append(
            NLPMatchResponse(
                title=ip["title"],
                similarity_score=sim,
                genre=ip["genre"],
                year=ip["year"],
                box_office=ip["box_office"],
                budget=ip["budget"],
                roi=ip["roi"],
                description=ip["description"],
                tags=ip["tags"],
                director=ip.get("director"),   # ISS-03 FIX
                studio=ip.get("studio"),       # ISS-03 FIX
            )
        )

    scored.sort(key=lambda x: x.similarity_score, reverse=True)
    return scored[:top_k]


# ─────────────────────────────────────────────────────────
# DB-backed Matcher (richer dataset from movies table)
# ─────────────────────────────────────────────────────────

async def match_concepts_from_db(
    concept: str,
    top_k: int = 5,
) -> list[NLPMatchResponse]:
    """
    Pull the full movies collection and score against it. Falls back to the
    in-memory IP_DATABASE via match_concepts() if the collection is empty or
    unavailable.

    Production upgrade: replace _score_similarity() with a vector similarity
    search over a pre-computed embeddings field.
    """
    # Imported lazily so this module has no hard dependency on the DB layer.
    from app.services.catalog import movies_with_roi

    try:
        movies = await movies_with_roi()
        if not movies:
            return match_concepts(concept, top_k)

        scored = [
            NLPMatchResponse(
                title=m.title,
                similarity_score=_score_similarity(concept, {
                    "title": m.title, "genre": m.genre or "",
                    "description": m.description or "", "tags": m.tags or [],
                }),
                genre=m.genre or "",
                year=m.year,
                box_office=m.box_office or 0,
                budget=m.budget or 0,
                roi=float(m.roi or 0),
                description=m.description or "",
                tags=m.tags or [],
                director=m.director,
                studio=m.studio,
            )
            for m in movies
        ]
        scored.sort(key=lambda x: x.similarity_score, reverse=True)
        return scored[:top_k]

    except Exception:
        return match_concepts(concept, top_k)
