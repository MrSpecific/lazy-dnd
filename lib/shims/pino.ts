type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'

type Logger = {
  level: Level
  fatal: (...args: any[]) => void
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  info: (...args: any[]) => void
  debug: (...args: any[]) => void
  trace: (...args: any[]) => void
  child: () => Logger
}

const noop = () => {}

export default function pino(opts?: { level?: Level }): Logger {
  const level = opts?.level ?? 'silent'
  const logger: Logger = {
    level,
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    child: () => logger,
  }
  return logger
}
