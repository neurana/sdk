export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
}

export interface LoggerConfig {
  level?: LogLevel;
  prefix?: string;
  handler?: (entry: LogEntry) => void;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

class Logger {
  #level: LogLevel = "warn";
  #prefix: string = "neurana";
  #handler?: (entry: LogEntry) => void;

  configure(config: LoggerConfig): void {
    if (config.level) this.#level = config.level;
    if (config.prefix) this.#prefix = config.prefix;
    if (config.handler) this.#handler = config.handler;
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log("debug", message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log("info", message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log("warn", message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log("error", message, data, context);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ?? this.#prefix,
      data: this.sanitizeData(data),
    };

    if (this.#handler) {
      this.#handler(entry);
      return;
    }

    this.output(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.#level];
  }

  private sanitizeData(data: unknown): unknown {
    if (data === undefined || data === null) return undefined;

    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack?.split("\n").slice(0, 5).join("\n"),
      };
    }

    if (typeof data === "object") {
      return this.redactSensitive(data as Record<string, unknown>);
    }

    return data;
  }

  private redactSensitive(
    obj: Record<string, unknown>
  ): Record<string, unknown> {
    const sensitiveKeys = [
      "apiKey",
      "key",
      "secret",
      "password",
      "token",
      "authorization",
    ];
    const result: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(obj)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        result[k] = "[REDACTED]";
      } else if (typeof v === "object" && v !== null) {
        result[k] = this.redactSensitive(v as Record<string, unknown>);
      } else {
        result[k] = v;
      }
    }

    return result;
  }

  private output(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${
      entry.context
    }]`;
    const msg = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case "debug":
        console.debug(msg, entry.data ?? "");
        break;
      case "info":
        console.info(msg, entry.data ?? "");
        break;
      case "warn":
        console.warn(msg, entry.data ?? "");
        break;
      case "error":
        console.error(msg, entry.data ?? "");
        break;
    }
  }
}

export const logger = new Logger();
