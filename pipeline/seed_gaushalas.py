import json
import psycopg2
import urllib.request
import urllib.error
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pipeline.lib.logger import Logger

log = Logger('pipeline', 'seed_gaushalas.py')

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 5433,
    'dbname': 'gaushala_db',
    'user': 'gaushala_user',
    'password': 'gn_pg_pass_2026'
}

PROMPT = """You are a research assistant helping build a directory of gaushalas (cow shelters) in India.

Search the web and find 50 real gaushalas across different states of India. For each gaushala, collect:
- name (exact official name)
- state
- district
- address (as complete as possible)
- phone (if available)
- website (if available)
- cow_count (approximate number of cows, if available)
- description (1-2 sentences about the gaushala)
- latitude (approximate, if you can determine it)
- longitude (approximate, if you can determine it)

Cover at least 15 different states. Include famous ones like Pathমাতar Gaushala, Shri Krishna Gaushala Mathura, etc. and also lesser known ones.

Return ONLY a valid JSON array. No explanation, no markdown, no code blocks. Just the raw JSON array like this:
[
  {
    "name": "...",
    "state": "...",
    "district": "...",
    "address": "...",
    "phone": "...",
    "website": "...",
    "cow_count": 500,
    "description": "...",
    "latitude": 27.1234,
    "longitude": 77.5678
  }
]

If a field is not available, use null. Return exactly 50 records."""

def call_claude():
    log.info('Calling Claude API with web search tool')
    payload = json.dumps({
        'model': 'claude-sonnet-4-20250514',
        'max_tokens': 8000,
        'tools': [{'type': 'web_search_20250305', 'name': 'web_search'}],
        'messages': [{'role': 'user', 'content': PROMPT}]
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'web-search-2025-03-05'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for block in data.get('content', []):
                if block.get('type') == 'text':
                    return block['text']
        log.error('No text block in Claude response', {'content': str(data.get('content', []))[:200]})
        return None
    except Exception as e:
        log.error('Claude API call failed', {'error': str(e)})
        return None

def parse_gaushalas(text):
    try:
        text = text.strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1]
            text = text.rsplit('```', 1)[0]
        data = json.loads(text)
        log.info('Parsed gaushala data', {'count': len(data)})
        return data
    except Exception as e:
        log.error('JSON parse failed', {'error': str(e), 'preview': text[:200]})
        return []

def insert_gaushalas(gaushalas):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        succeeded = 0
        failed = 0

        for g in gaushalas:
            try:
                cur.execute("""
                    INSERT INTO gaushalas
                    (name, state, district, address, phone, website, cow_count,
                     description, latitude, longitude, data_source, is_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    g.get('name'),
                    g.get('state'),
                    g.get('district'),
                    g.get('address'),
                    g.get('phone'),
                    g.get('website'),
                    g.get('cow_count'),
                    g.get('description'),
                    g.get('latitude'),
                    g.get('longitude'),
                    'web_search',
                    False
                ))
                succeeded += 1
            except Exception as e:
                failed += 1
                log.error('Insert failed', {'name': g.get('name'), 'error': str(e)})
                conn.rollback()
                conn = psycopg2.connect(**DB_CONFIG)
                cur = conn.cursor()

        conn.commit()
        cur.close()
        conn.close()
        log.info('Insert complete', {'succeeded': succeeded, 'failed': failed})
        return succeeded, failed

    except Exception as e:
        log.error('DB connection failed', {'error': str(e)})
        return 0, len(gaushalas)

def main():
    log.info('Starting gaushala seed pipeline')

    if not ANTHROPIC_API_KEY:
        log.error('ANTHROPIC_API_KEY not set')
        sys.exit(1)

    text = call_claude()
    if not text:
        log.error('No response from Claude')
        sys.exit(1)

    gaushalas = parse_gaushalas(text)
    if not gaushalas:
        log.error('No gaushalas parsed')
        sys.exit(1)

    log.info('Inserting gaushalas', {'count': len(gaushalas)})
    succeeded, failed = insert_gaushalas(gaushalas)
    log.info('Seed complete', {'succeeded': succeeded, 'failed': failed})

if __name__ == '__main__':
    main()
