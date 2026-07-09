"""
TF-IDF-Vektoren (128-dim) mit Character-N-Grammen.
Gemeinsam genutzt von matching.py und sync.py.
"""

from __future__ import annotations

import math
import re
from collections import Counter

EMBEDDING_DIM = 128


def tokenize(text: str) -> list[str]:
    """Lowercased Wort-Tokens + Character-N-Gramme (3-5) fuer Teilwort-Matching."""
    words = re.findall(r"[a-zäöüß]+", text.lower())
    tokens = list(words)
    for word in words:
        for n in (3, 4, 5):
            for i in range(len(word) - n + 1):
                tokens.append(word[i : i + n])
    return tokens


def build_idf(documents: list[list[str]]) -> dict[str, float]:
    """IDF ueber alle Dokumente: log(1 + N / df)."""
    n = len(documents)
    df: Counter = Counter()
    for doc in documents:
        df.update(set(doc))
    return {term: math.log(1 + n / count) for term, count in df.items()}


def tfidf_vector(tokens: list[str], idf: dict[str, float],
                 dim: int = EMBEDDING_DIM) -> list[float]:
    """TF-IDF auf festen dim-dimensionalen Vektor (Feature-Hashing)."""
    tf = Counter(tokens)
    vec = [0.0] * dim
    for term, count in tf.items():
        weight = count * idf.get(term, 0.0)
        bucket = hash(term) % dim
        vec[bucket] += weight
    return normalize(vec)


def normalize(vec: list[float]) -> list[float]:
    """L2-Normalisierung."""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine Similarity zweier gleich langer Vektoren."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def compute_single_vector(text: str) -> list[float]:
    """Berechnet einen einzelnen normalisierten TF-IDF-Vektor.
    IDF wird aus dem Dokument selbst geschaetzt (single-doc).
    """
    tokens = tokenize(text)
    idf = build_idf([tokens])
    return tfidf_vector(tokens, idf)
