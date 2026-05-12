const PROJECT = 'GAUSHALA';

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
type Context = Record<string, unknown>;

function formatEntry(level: LogLevel, layer: string, file: string, message: string, context?: Context): string {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const ctx = context ? ' | ' + Object.entries(context).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ') : '';
  return `[${timestamp}] [${level}] [${PROJECT}] [${layer.toUpperCase()}] [${file}] ${message}${ctx}`;
}

function write(level: LogLevel, layer: string, file: string, message: string, context?: Context) {
  const entry = formatEntry(level, layer, file, message, context);
  if (level === 'ERROR') console.error(entry);
  else if (level === 'WARN') console.warn(entry);
  else console.log(entry);
}

const logger = {
  error: (layer: string, file: string, message: string, context?: Context) => write('ERROR', layer, file, message, context),
  warn:  (layer: string, file: string, message: string, context?: Context) => write('WARN',  layer, file, message, context),
  info:  (layer: string, file: string, message: string, context?: Context) => write('INFO',  layer, file, message, context),
  debug: (layer: string, file: string, message: string, context?: Context) => write('DEBUG', layer, file, message, context),
};

export default logger;
