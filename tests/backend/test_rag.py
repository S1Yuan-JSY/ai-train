import tempfile, unittest
from pathlib import Path
from langchain_core.messages import AIMessage
from backend.rag import retrieve, corpus
from backend.agent_memory import runtime_memory
from test_agent_memory import ToolModel, STATE
from unittest.mock import patch
import os

class RAGTests(unittest.IsolatedAsyncioTestCase):
    def test_sources_and_relevance(self):
        self.assertEqual(len({d['source'] for d in corpus()}),24)
        hits = retrieve('卧推胸部训练')
        self.assertTrue(hits)
        self.assertTrue(any('卧推' in h['text'] for h in hits))
        self.assertEqual(retrieve('zzzznonexistentterm'),[])

    async def test_checkpoint_and_preference_survive_restart(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ,{'POSTGRES_URI':''}):
            path = Path(directory)/'memory.sqlite3'
            hit = retrieve('卧推')[0]
            async with runtime_memory(path) as memory:
                memory.model = ToolModel(replies=[AIMessage(content=f"参考 [{hit['id']}] 与 [K999999]")])
                await memory.put('alice','time','每次40分钟')
                result = await memory.chat('alice','thread','卧推',STATE)
                self.assertEqual([s['id'] for s in result['sources']],[hit['id']])
            async with runtime_memory(path) as memory:
                self.assertEqual((await memory.list('alice'))[0]['text'],'每次40分钟')
                self.assertEqual(await memory.list('bob'),[])
                saved = await memory.checkpointer.aget_tuple({'configurable':{'thread_id':'thread'}})
                self.assertEqual(saved.checkpoint['channel_values']['messages'][-1].content,result['answer'])
                await memory.delete('alice','time')
            async with runtime_memory(path) as memory:
                self.assertEqual(await memory.list('alice'),[])
