import sqlite3
from flask import g

SOLICITATIONS_DB = "server/solicitations.db"
AWARDS_DB = "server/awards.db"
COMPANIES_DB = "server/companies.db"

def get_db_connection(db_name="solicitations"):
    db_key = f'db_{db_name}'
    if db_key not in g:
        if db_name == "solicitations":
            path = SOLICITATIONS_DB
        elif db_name == "awards":
            path = AWARDS_DB
        elif db_name == "companies":
            path = COMPANIES_DB
        else:
            raise ValueError(f"Unknown database: {db_name}")
            
        g.setdefault(db_key, sqlite3.connect(path))
        g[db_key].row_factory = sqlite3.Row
    return g[db_key]

def close_db(e=None):
    for db_key in list(g.keys()):
        if db_key.startswith('db_'):
            db = g.pop(db_key, None)
            if db is not None:
                db.close()