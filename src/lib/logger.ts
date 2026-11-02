/**
 * Structured Logging Utility
 * Production-ready logging with levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel = this.isDevelopment ? 'debug' : 'info'

  /**
   * Log at all levels (override for testing)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.logLevel as LogLevel]
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const levelUpper = level.toUpperCase().padEnd(5)
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${levelUpper} ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return
    console.debug(this.format('debug', message, context))
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return
    console.log(this.format('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return
    console.warn(this.format('warn', message, context))
  }

  error(message: string, error?: Error | string, context?: LogContext): void {
    if (!this.shouldLog('error')) return
    const errorStr = error instanceof Error ? error.message : error
    const fullContext = {
      ...context,
      ...(error instanceof Error && { stack: error.stack }),
    }
    console.error(this.format('error', message, fullContext))
    if (errorStr) console.error(`Details: ${errorStr}`)
  }

  /**
   * Performance timing logger (logged at info so it is visible in production)
   */
  time(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.info(`${label} completed`, { durationMs: duration })
    }
  }
}

export const logger = new Logger()
