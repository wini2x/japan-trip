#!/usr/bin/env python3
"""Japan Trip Photo API — liked / tags 메타데이터 수정"""

import json
from pathlib import Path
from flask import Flask, request, jsonify

app = Flask(__name__)
UPLOADS_JSON = Path('/home/wini2x/japan-trip/public/photos/photo_uploads.json')


def load():
    try:
        return json.loads(UPLOADS_JSON.read_text(encoding='utf-8'))
    except Exception:
        return []


def save(data):
    UPLOADS_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')


@app.after_request
def cors(r):
    r.headers['Access-Control-Allow-Origin'] = '*'
    r.headers['Access-Control-Allow-Methods'] = 'GET,PATCH,OPTIONS'
    r.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return r


@app.route('/api/photos/<photo_id>', methods=['OPTIONS', 'PATCH'])
def patch_photo(photo_id):
    if request.method == 'OPTIONS':
        return '', 204
    updates = request.get_json(silent=True) or {}
    data = load()
    for item in data:
        if item.get('id') == photo_id:
            if 'liked' in updates:
                item['liked'] = bool(updates['liked'])
            if 'tags' in updates:
                item['tags'] = [str(t).strip() for t in updates['tags'] if str(t).strip()]
            save(data)
            return jsonify({'ok': True, 'item': item})
    return jsonify({'ok': False, 'error': 'not found'}), 404


@app.route('/api/health')
def health():
    return jsonify({'ok': True, 'count': len(load())})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3100, debug=False)
