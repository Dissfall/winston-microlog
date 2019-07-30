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
  private serviceName: string = 'undefined';
  private instanceName: string = 'undefined'; 
  private path: string = 'logs';
  private face: string = '';
  private logger: Logger | null = null;
  private mode: string = "normal";

  constructor(serviceName: string, instanceName: string, path?: string, face?: string) {
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
        this.instanceName = '#' + instanceName;
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
      const sern: string = this.serviceName.toUpperCase() + Array(tagLen + 1 - this.serviceName.length).join(' ');
      const insn: string = this.instanceName.toUpperCase() + Array(tagLen + 1 - this.instanceName.length).join(' ');
      const now: Date = new Date();
      return `@${sern} ${insn} [${now.getHours()}:${now.getMinutes()}]  ${this.face} ${level}| ${info.message}`;
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
    if (this.logger != null) this.logger.info(message);
  }

  public warn(message: any) {
    if (this.logger != null) this.logger.warn(message);
  }

  public err(message: any) {
    if (this.logger != null) this.logger.error(message);
  }

  public debug(message: any) {
    if (this.logger != null) this.logger.debug(message);
  }

  public silent() {
    this.mode = 'silent';
  }
}

export default class LogManager {
  private serviceName: string;
  private path: string; 

  constructor(serviceName: string, path?: string) {
    this.serviceName = serviceName;
    this.path = path || 'logs';
  }

  public getLogger(instanceName?: string): ServiceLogger {
    return new ServiceLogger(this.serviceName, instanceName || '', this.path); 
  }
}
