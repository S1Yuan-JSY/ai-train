"""Transactional SQLite adapter implementing the LangGraph BaseStore contract.
Reload inside each transaction to support multiple processes without stale caches.
"""
import asyncio, json, sqlite3
from contextlib import closing
from pathlib import Path
from langgraph.store.base import BaseStore, PutOp
from langgraph.store.memory import InMemoryStore

class SQLiteStore(BaseStore):
    def __init__(self, path):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with closing(sqlite3.connect(self.path)) as db:
            db.execute("CREATE TABLE IF NOT EXISTS agent_store(namespace TEXT, key TEXT, value TEXT, PRIMARY KEY(namespace,key))")
            db.commit()

    def batch(self, ops):
        ops = list(ops)
        db = sqlite3.connect(self.path, timeout=20)
        try:
            db.execute("BEGIN IMMEDIATE")
            memory = InMemoryStore()
            for ns, key, value in db.execute("SELECT namespace,key,value FROM agent_store"):
                memory.put(tuple(json.loads(ns)), key, json.loads(value))
            results = memory.batch(ops)
            for op in ops:
                if isinstance(op, PutOp):
                    ns = json.dumps(op.namespace)
                    if op.value is None:
                        db.execute("DELETE FROM agent_store WHERE namespace=? AND key=?", (ns,op.key))
                    else:
                        db.execute("INSERT OR REPLACE INTO agent_store VALUES(?,?,?)",(ns,op.key,json.dumps(op.value,ensure_ascii=False)))
            db.commit()
            return results
        finally:
            db.close()

    async def abatch(self, ops):
        return await asyncio.to_thread(self.batch, list(ops))
