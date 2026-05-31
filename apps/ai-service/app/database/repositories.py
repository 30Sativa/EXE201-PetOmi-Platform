from sqlalchemy.orm import Session

from app.database.models import KnowledgeSources


class KnowledgeRepository:

    @staticmethod
    def get_all(db: Session):
        return db.query(KnowledgeSources).all()