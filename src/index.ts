/**
 * Log manager provides simple and clear logging system that in convenient to use for microservices.
 * @module winston-microloger
 */
import { Logger, createLogger, transports, format } from 'winston';
import appRoot from 'app-root-path';

const { combine, timestamp, label, printf } = format;

/** @const tagLen - Length of _service_ and _instance_ names in log.  */
const tagLen: number = 8;

/**
 * @const faceLen - Length of _face_ in log.
 * @alpha
 */
const faceLen: number = 6;

/**
 * @const levelSign - Contains symbols represents log level.
 */
const levelSign: { [propName: string]: string } = {
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '⛔️',
  debug: '☢️ '
};

/**
 * Logger for service instances.
 */
class ServiceLogger {
  /** Name of service. Cant be longer than 8 characters. */

  private serviceName: string = '';
  /** Name of instance. Cant be longer than 8 characters. */

  private instanceName: string = '';
  /** Path to log dir. */

  private path: string = 'logs';
  /** @beta face */

  private face: string = '';
  /** logger. */

  private logger: Logger | null = null;
  /** Logger configuration. */

  private config: LoggerConfig = {
    /** Show service name in start of log message */
    showService: true,
    /** Mute instance logger */
    silent: false
  };

  /**
   * Creates and returns logger
   *
   * @param serviceName - Name of service. Cant be longer than 8 characters.
   * @param instanceName - Name of instance. Cant be longer than 8 characters.
   * @param path - Path to log dir.
   * @param @beta face
   * @param config - Logger configuration.
   *
   * @returns ServiceLogger
   */
  constructor(serviceName: string, instanceName: string, path?: string, face?: string, config?: LoggerConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (serviceName.length <= tagLen) {
      this.serviceName = serviceName;
    } else {
      console.error(`Service name cannot be longer than ${tagLen} characters`);
      process.exit(1);
    }
    if (instanceName.length <= tagLen) {
      if (instanceName.length === 0) {
        this.instanceName = '';
      } else {
        this.instanceName = instanceName;
      }
    } else {
      console.error(`Instance name cannot be longer than ${tagLen} characters`);
      process.exit(1);
    }
    if (!face) {
    } else if (face.length > faceLen) {
      this.face = face;
    } else {
      console.error(`Face string cannot be longer than ${tagLen} characters`);
      process.exit(1);
    }
    this.path = path || this.path;

    // TODO: Define type TransformableInfo
    const style = printf((info: any): string => {
      const level: string = levelSign[info.level];
      const sern: string =
        this.serviceName !== ''
          ? '@' + this.serviceName.toUpperCase() + Array(tagLen + 1 - this.serviceName.length).join(' ')
          : Array(tagLen + 2).join(' ');
      const insn: string =
        this.instanceName !== ''
          ? '#' + this.instanceName.toUpperCase() + Array(tagLen + 1 - this.instanceName.length).join(' ')
          : Array(tagLen + 2).join(' ');
      const now: Date = new Date();
      return (
        `${this.config.showService ? sern : ''} ${insn}` +
        `[${(now.getHours() < 10 ? ' ' : '') + now.getHours()}:${(now.getMinutes() < 10 ? ' ' : '') +
          now.getMinutes()}]` +
        `${this.face} ${level}| ${info.message}`
      );
    });

    const options = {
      file: {
        filename: `${appRoot}/${this.path}/${this.serviceName}.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 1,
        colorize: false
      },
      console: {
        handleExceptions: true,
        json: false,
        colorize: true
      }
    };

    this.logger = createLogger({
      format: combine(timestamp(), style),
      transports: [new transports.File(options.file), new transports.Console(options.console)],
      exitOnError: false
    });
  }

  /**
   * Make log with _info_ loglevel.
   *
   * @param message - Log message text.
   */
  public info = (message: any) => {
    if (this.logger != null && !this.config.silent) this.logger.info(message);
  };

  /**
   * Make log with _warn_ loglevel.
   *
   * @param message - Log message text.
   */
  public warn = (message: any) => {
    if (this.logger != null && !this.config.silent) this.logger.warn(message);
  };

  /**
   * Make log with _err_ loglevel.
   *
   * @param message - Log message text.
   */
  public err = (message: any) => {
    if (this.logger != null && !this.config.silent) this.logger.error(message);
  };

  /**
   * Make log with _debug_ loglevel.
   *
   * @beta
   * @param message - Log message text.
   */
  public debug = (message: any) => {
    if (this.logger != null) this.logger.debug(message);
  };

  /**
   * Mute or unmute logger.
   *
   * @param mod - true: mute, false: unmute.
   */
  public silent = (mod: boolean) => {
    this.config.silent = mod;
  };
}

/** Provides _log manager_ that can be used for service logging. */
export default class LogManager {
  /** Service name. */
  private serviceName: string;
  /** Path to log dir. */
  private path: string;
  /** Log manager configuration. */
  private config: LMConfig = {
    showService: true
  };
  /** Array of loggers. */
  private instances: ServiceLogger[] = [];

  /**
   * Provides _log manager_ that can be used for service logging.
   *
   * @param serviceName - Name of service. Cant be longer than 8 symbols.
   * @param path - Way to log dir.
   * @param config - Log manager configuration.
   *
   * @returns LogManager
   */
  constructor(serviceName: string, path?: string, config?: LMConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.serviceName = serviceName;
    this.path = path || 'logs';
  }

  /**
   * Generates and returns logger for instance.
   *
   * @param instanceName - Name of instance. If not provided - main instance.
   * @param config - Logger configuration.
   *
   * @returns ServiceLogger
   */
  public getLogger = (instanceName?: string, config?: LoggerConfig): ServiceLogger => {
    const instance = new ServiceLogger(this.serviceName, instanceName || '', this.path, undefined, {
      ...config,
      ...this.config
    });
    this.instances.push(instance);
    return instance;
  };

  /**
   * Mutes all loggers of service.
   */
  public mute = () => {
    this.instances.forEach((logger: ServiceLogger) => {
      logger.silent(true);
    });
  };

  /**
   * Unmutes all loggers of service.
   */
  public unmute = () => {
    this.instances.forEach((logger: ServiceLogger) => {
      logger.silent(false);
    });
  };
}

/** Log manager configuration. */
export interface LMConfig {
  /** Show service name in start of log message. */
  showService?: boolean;
}

/** Logger configuration. */
export interface LoggerConfig {
  /** Mute instance logger. */
  silent?: boolean;
  /** Show service name in start of log message. */
  showService?: boolean;
}
