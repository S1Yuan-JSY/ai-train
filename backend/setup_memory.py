"""One-time/idempotent LangGraph store and checkpoint database migrations."""
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from .agent_memory import postgres_memory


async def main():
    load_dotenv(Path(__file__).with_name('.env'))
    async with postgres_memory() as memory:
        if memory is None:
            raise SystemExit('请先在 backend/.env 中配置 POSTGRES_URI')
        await memory.store.setup()
        await memory.checkpointer.setup()
    print('PostgresStore 与 PostgresSaver 表初始化完成。')


if __name__ == '__main__':
    asyncio.run(main())
