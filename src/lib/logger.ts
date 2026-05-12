import fs from 'fs';
import path from 'path';

const LOG_DIR = '/home/openclaw/logs/gaushala-network';
const PROJECT = 'GAUSHALA';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogFile(layer: string): string {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `${layer}-${date}.log`);
}

function formatEntry(level: LogLevel, layer: string, file: string, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const ctx = context ? ' | ' + Object.entries(context).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ') : '';
  return `[${timestamp}] [${level}] [${PROJECT}] [${layer.toUpperCase()}] [${file}] ${message}${ctx}\n`;
}

function write(level: LogLevel, layer: string, file: string, message: string, context?: Record<string, unknown>) {
  try {
    ensureLogDir();
    const entry = formatEntry(level, layer, file, message, context);
    // Always write to console
    if (level === 'ERROR') console.error(entry.trim());
    else if (level === 'WARN') console.warn(entry.trim());
    else console.log(entry.trim());
    // Write to layer log file
    fs.appendFileSync(getLogFile(layer), entry);
    // Also write errors to a combined error log
    if (level === 'ERROR') {
      fs.appendFileSync(getLogFile('errors'), entry);
    }
  } catch (e) {
    console.error('Logger failed:', e);
  }
}

const logger = {
  error: (layer: string, file: string, message: string, context?: Record<string, unknown>) =>
    write('ERROR', layer, file, message, context),
  warn: (layer: string, file: string, message: string, context?: Record<string, unknown>) =>
    write('WARN', layer, file, message, context),
  info: (layer: string, file: string, message: string, context?: Record<string, unknown>) =>
    write('INFO', layer, file, message, context),
  debug: (layer: string, file: string, message: string, context?: Record<string, unknown>) =>
    write('DEBUG', layer, file, message, context),
};

export default logger;
