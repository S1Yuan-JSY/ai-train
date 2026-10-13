"""Local Chinese lexical RAG; no embedding API or prebuilt incompatible index."""
import math, re
from collections import Counter
from functools import lru_cache
from pathlib import Path


def tokens(text):
    text = text.lower()
    return re.findall(r"[a-z0-9]+", text) + [text[i:i+2] for i in range(len(text)-1) if all("\u4e00" <= c <= "\u9fff" for c in text[i:i+2])]


@lru_cache(maxsize=1)
def corpus():
    chunks = []
    for path in sorted((Path(__file__).resolve().parent.parent / "knowledge/fitness").glob("*.md")):
        content = path.read_text(encoding="utf-8")
        for start in range(0, len(content), 540):
            text = content[start:start+640]
            chunks.append({"id": f"K{len(chunks)+1}", "source": path.stem, "text": text, "terms": Counter(tokens(text))})
    return chunks


def retrieve(query, limit=4):
    docs = corpus(); terms = set(tokens(query)); result = []
    avg = sum(sum(d["terms"].values()) for d in docs) / max(len(docs), 1)
    for doc in docs:
        score = 0.0; length = sum(doc["terms"].values())
        for term in terms:
            tf = doc["terms"].get(term, 0)
            if tf:
                df = sum(term in d["terms"] for d in docs)
                score += math.log(1+(len(docs)-df+.5)/(df+.5))*tf*2.5/(tf+1.5*(.25+.75*length/max(avg,1)))
        if score > 0:
            result.append({k: doc[k] for k in ("id", "source", "text")} | {"score": round(score, 3)})
    return sorted(result, key=lambda d: (-d["score"], d["id"]))[:limit]
