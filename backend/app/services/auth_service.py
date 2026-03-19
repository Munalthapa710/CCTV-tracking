from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import UserAccount


password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class AuthService:
    @staticmethod
    def login(db: Session, username: str, password: str) -> dict:
        if username == settings.STATIC_USERNAME and password == settings.STATIC_PASSWORD:
            return {
                "success": True,
                "token": "local-admin-session",
                "username": settings.STATIC_USERNAME,
                "message": "Login successful",
            }

        account = db.scalar(select(UserAccount).where(UserAccount.username == username))
        if account and password_context.verify(password, account.password_hash):
            return {
                "success": True,
                "token": f"local-user-session:{account.username}",
                "username": account.username,
                "message": "Login successful",
            }

        return {
            "success": False,
            "token": None,
            "username": None,
            "message": "Invalid username or password",
        }

    @staticmethod
    def register(db: Session, username: str, password: str) -> dict:
        normalized_username = username.strip()
        if normalized_username.lower() == settings.STATIC_USERNAME.lower():
            raise ValueError("This username is reserved")

        existing = db.scalar(select(UserAccount).where(UserAccount.username == normalized_username))
        if existing:
            raise ValueError("Username already exists")

        account = UserAccount(
            username=normalized_username,
            password_hash=password_context.hash(password),
        )
        db.add(account)
        db.commit()
        db.refresh(account)

        return {
            "success": True,
            "token": f"local-user-session:{account.username}",
            "username": account.username,
            "message": "Registration successful",
        }
