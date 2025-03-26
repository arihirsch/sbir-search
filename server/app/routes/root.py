from flask import Blueprint, jsonify, request
from app.services.db import get_db_connection, get_db_cursor

bp = Blueprint('root', __name__, url_prefix='/api')

@bp.route('/', methods=['GET'])
def health_check():
    return "OK"