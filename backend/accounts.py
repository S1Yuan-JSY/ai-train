"""Persistent identities and revocable browser sessions; no plaintext passwords/tokens."""
import hashlib
import hmac
import secrets
import time
from contextlib import contextmanager
from pathlib import Path
import sqlite3

SESSION_SECONDS = 30 * 24 * 3600


class Accounts:
    def __init__(self, path):
        self.path = Path(path)

    @contextmanager
    def connect(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.path, timeout=10)
        try:
            db.execute('PRAGMA journal_mode=WAL')
            db.executescript('''
                CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS user_memory(user_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, json TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS agent_threads(id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created REAL NOT NULL);
            ''')
            with db:
                yield db
        finally:
            db.close()

    @staticmethod
    def password_hash(password, salt):
        return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()

    def register(self, username, password):
        uid, salt = secrets.token_hex(16), secrets.token_hex(16)
        digest = self.password_hash(password, salt)
        with self.connect() as db:
            db.execute('INSERT INTO users VALUES(?,?,?,?)', (uid, username, salt, digest))
        return uid

    def login(self, username, password):
        with self.connect() as db:
            row = db.execute('SELECT id,salt,password_hash FROM users WHERE username=?', (username,)).fetchone()
        # Hash nonexistent users too, to avoid a cheap username timing oracle.
        digest = self.password_hash(password, row[1] if row else '00' * 16)
        return row[0] if row and hmac.compare_digest(digest, row[2]) else None

    def session(self, uid):
        token = secrets.token_urlsafe(32)
        with self.connect() as db:
            db.execute('DELETE FROM sessions WHERE expires<?', (time.time(),))
            db.execute('INSERT INTO sessions VALUES(?,?,?)', (self.digest(token), uid, time.time() + SESSION_SECONDS))
        return token

    @staticmethod
    def digest(token):
        return hashlib.sha256(token.encode()).hexdigest()

    def identify(self, token):
        with self.connect() as db:
            row = db.execute('SELECT s.user_id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?', (self.digest(token), time.time())).fetchone()
        return {'id': row[0], 'username': row[1]} if row else None

    def logout(self, token):
        with self.connect() as db:
            db.execute('DELETE FROM sessions WHERE token_hash=?', (self.digest(token),))
