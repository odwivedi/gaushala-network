import os
import json
from datetime import datetime

LOG_DIR = '/home/openclaw/logs/gaushala-network'
PROJECT = 'GAUSHALA'

def ensure_log_dir():
    os.makedirs(LOG_DIR, exist_ok=True)

def get_log_file(layer: str) -> str:
    date = datetime.now().strftime('%Y-%m-%d')
    return os.path.join(LOG_DIR, f'{layer}-{date}.log')

def write(level: str, layer: str, file: str, message: str, context: dict = None):
    try:
        ensure_log_dir()
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ctx = ''
        if context:
            ctx = ' | ' + ' '.join(f'{k}={json.dumps(v)}' for k, v in context.items())
        entry = f'[{timestamp}] [{level}] [{PROJECT}] [{layer.upper()}] [{file}] {message}{ctx}\n'
        print(entry.strip())
        with open(get_log_file(layer), 'a') as f:
            f.write(entry)
        if level == 'ERROR':
            with open(get_log_file('errors'), 'a') as f:
                f.write(entry)
    except Exception as e:
        print(f'Logger failed: {e}')

class Logger:
    def __init__(self, layer: str, file: str):
        self.layer = layer
        self.file = file

    def error(self, message: str, context: dict = None):
        write('ERROR', self.layer, self.file, message, context)

    def warn(self, message: str, context: dict = None):
        write('WARN', self.layer, self.file, message, context)

    def info(self, message: str, context: dict = None):
        write('INFO', self.layer, self.file, message, context)

    def debug(self, message: str, context: dict = None):
        write('DEBUG', self.layer, self.file, message, context)
