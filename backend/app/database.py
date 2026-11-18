from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import user, video, analysis
    Base.metadata.create_all(bind=engine)
    
    # Ensure newly added columns exist in existing deployments
    try:
        with engine.begin() as conn:
            inspector = inspect(conn)
            if "users" in inspector.get_table_names():
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                if "preferences" not in user_cols:
                    if engine.dialect.name == "postgresql":
                        conn.execute(text("ALTER TABLE users ADD COLUMN preferences JSON DEFAULT '{}'::json;"))
                    else:
                        conn.execute(text("ALTER TABLE users ADD COLUMN preferences JSON;"))
    except Exception as e:
        print(f"Schema migration note: {e}")
