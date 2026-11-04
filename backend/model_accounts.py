"""Per-account model credentials. No personal credential may fall back to site billing."""
import os
from pathlib import Path
from cryptography.fernet import Fernet, InvalidToken
from .model_errors import ModelConfigurationError


class ModelAccounts:
    def __init__(self, accounts):
        self.accounts = accounts
        self.key_path = Path(accounts.path).with_name('model-credentials.key')
        with accounts.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='model_accounts'").fetchone()
            if not exists:
                db.execute("CREATE TABLE model_accounts(user_id TEXT PRIMARY KEY,mode TEXT NOT NULL CHECK(mode IN ('site','personal')),model TEXT,cipher TEXT)")
                db.execute("INSERT INTO model_accounts(user_id,mode) SELECT id,'site' FROM users")
            personal = db.execute("SELECT count(*) FROM model_accounts WHERE mode='personal'").fetchone()[0]
        if not self.key_path.exists():
            if personal:
                raise RuntimeError('个人模型加密文件缺失，请恢复 model-credentials.key，不能重新生成')
            try:
                fd=os.open(self.key_path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
                with os.fdopen(fd,'wb') as out: out.write(Fernet.generate_key())
            except FileExistsError:
                pass
        self.cipher = Fernet(self.key_path.read_bytes().strip())

    def encrypt(self, uid, key):
        return self.cipher.encrypt((uid+'\n'+key).encode()).decode()

    def resolve(self, uid):
        if uid == 'legacy': return None
        with self.accounts.connect() as db:
            row=db.execute('SELECT mode,model,cipher FROM model_accounts WHERE user_id=?',(uid,)).fetchone()
        if row is None:
            raise ModelConfigurationError('账号缺少模型配置，请在设置页更新个人模型；不会使用站点密钥。')
        mode,model,cipher=row
        if mode=='site': return None
        try:
            plain=self.cipher.decrypt(cipher.encode()).decode()
            owner,key=plain.split('\n',1)
            if owner!=uid or not model or not key: raise ValueError()
        except (InvalidToken,ValueError,AttributeError):
            raise ModelConfigurationError('个人模型配置无法读取，请在设置页更新；不会使用站点密钥。') from None
        return {'model':model,'api_key':key,'api_base':'https://api.deepseek.com'}

    def public(self, uid):
        with self.accounts.connect() as db:
            row=db.execute('SELECT mode,model FROM model_accounts WHERE user_id=?',(uid,)).fetchone()
        return {'mode':row[0] if row else 'missing','model':row[1] if row else None,'provider':'DeepSeek'}

    def update(self, uid, model, key):
        with self.accounts.connect() as db:
            row=db.execute('SELECT mode FROM model_accounts WHERE user_id=?',(uid,)).fetchone()
            if not row or row[0]!='personal':
                raise ValueError('已有账号继续使用原模型配置，无需填写个人密钥。')
            db.execute('UPDATE model_accounts SET model=?,cipher=? WHERE user_id=?',(model,self.encrypt(uid,key),uid))
