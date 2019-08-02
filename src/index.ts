import { Logger, createLogger, transports, format } from 'winston';
import appRoot from 'app-root-path';


const { combine, timestamp, label, printf } = format;

const tagLen: number = 8;
const faceLen: number = 6

const levelSign: {[propName: string]: string} = {
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '⛔️',
  debug: '☢️ '
}


class ServiceLogger {
  private serviceName: string = '';
  private instanceName: string = ''; 
  private path: string = 'logs';
  private face: string = '';
  private logger: Logger | null = null;
  private config: LoggerConfig = {
    showService: true,
    silent: false
  }

  constructor(serviceName: string, instanceName: string, path?: string, face?: string, config?: LoggerConfig) {
    if (config) {
      this.config = {...this.config, ...config};
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
    if (!face) {}
    else if (face.length > faceLen) {
      this.face = face;
    } else {
      console.error(`Face string cannot be longer than ${tagLen} characters`);
      process.exit(1);
    }
    this.path = path || this.path;

    // TODO: Define type TransformableInfo 
    const style = printf((info: any): string => {
      const level: string = levelSign[info.level];
      const sern: string = this.serviceName !== '' ? '@' + this.serviceName.toUpperCase() + Array(tagLen + 1 - this.serviceName.length).join(' ') : Array(tagLen + 2).join(' ');
      const insn: string = this.instanceName !== '' ? '#' + this.instanceName.toUpperCase() + Array(tagLen + 1 - this.instanceName.length).join(' ') : Array(tagLen + 2).join(' ');
      const now: Date = new Date();
      return `${this.config.showService ? sern : ''} ${insn}` +
        `[${(now.getHours() < 10 ? ' ' : '') + now.getHours()}:${(now.getMinutes() < 10 ? ' ' : '') + now.getMinutes()}]` +
        `${this.face} ${level}| ${info.message}`;
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
    }

    this.logger = createLogger({
      format: combine(
        timestamp(),
        style
      ),
      transports: [
        new transports.File(options.file),
        new transports.Console(options.console)
      ],
      exitOnError: false
    });
  }

  public info(message: any) {
    if (this.logger != null && !this.config.silent) this.logger.info(message);
  }

  public warn(message: any) {
    if (this.logger != null && !this.config.silent) this.logger.warn(message);
  }

  public err(message: any) {
    if (this.logger != null && !this.config.silent) this.logger.error(message);
  }

  public debug(message: any) {
    if (this.logger != null) this.logger.debug(message);
  }

  public silent(mod: boolean) {
    this.config.silent = mod;
  }
}

export default class LogManager {
  private serviceName: string;
  private path: string; 
  private config: LMConfig = {
    showService: true
  }

  constructor(serviceName: string, path?: string, config?: LMConfig) {
    if (config) {
      this.config = {...this.config, ...config};
    }
    this.serviceName = serviceName;
    this.path = path || 'logs';
  }

  public getLogger(instanceName?: string, config?: LoggerConfig): ServiceLogger {
    return new ServiceLogger(this.serviceName, instanceName || '', this.path, undefined, { ...config, ...this.config}); 
  }
}

export interface LMConfig {
  showService?: boolean;  
}

export interface LoggerConfig {
  silent?: boolean;
  showService?: boolean;
}
