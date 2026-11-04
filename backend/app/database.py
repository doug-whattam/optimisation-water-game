from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event

from app.config import DATABASE_URL, DATABASE_SSL

# SQLite needs connect_args for async
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False, "timeout": 30}
elif DATABASE_SSL:
    connect_args = {"ssl": "require"}

# pool_pre_ping: serverless Postgres (Neon) drops idle connections when it
# scales to zero, so check each pooled connection before handing it out.
engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Enable WAL mode + busy timeout for SQLite so concurrent requests don't deadlock
if "sqlite" in DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        yield session


async def create_tables():
    """Create any missing tables (no-op for tables that already exist)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
