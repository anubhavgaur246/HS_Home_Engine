from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import DeclarativeBase

from core.config import settings

if settings.ENVIRONMENT == "prod":
    from google.cloud.sql.connector import Connector, IPTypes
    import pg8000

    connector = Connector()
    print("DB_USER: ", settings.DB_USER)
    print("DB_NAME: ", settings.DB_NAME)
    print("DB_PASS: ", settings.DB_PASS)
    def getconn():
        conn: pg8000.dbapi.Connection = connector.connect(
            settings.INSTANCE_CONNECTION_NAME,
            "pg8000",
            user=settings.DB_USER,
            password=settings.DB_PASS,
            db=settings.DB_NAME,
            ip_type=IPTypes.PUBLIC,
        )
        return conn

    engine = create_engine(
        "postgresql+pg8000://",
        creator=getconn,
    )
else:
    engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()