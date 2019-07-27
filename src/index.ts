import { Logger, createLogger, transports, format } from 'winston';
import appRoot from 'app-root-path';

const { combine, timestamp, label, printf } = format;


class ServiceLogger {
  private serviceName: string;
  private instanceName: string; 
  private path: string;
  private face: string | null;
  private logger: Logger | null = null;
  private mode: string = "normal";

  constructor(serviceName: string, instanceName: string, path?: string, face?: string) {
    this.serviceName = serviceName;
    this.instanceName = instanceName;
    this.face = face || null;
    this.path = path || 'logs';
  }

  public createLogger() {
    // TODO: Define type TransformableInfo 
    const style = printf((info: any): string => {
      return `${this.serviceName} | [${new Date().toISOString()}] ${this.instanceName}    ${info.message}`;
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

  public info(message: string) {
    if (this.logger != null) this.logger.info(message);
  }

  public warn(message: string) {
    if (this.logger != null) this.logger.warn(message);
  }

  public err(message: string) {
    if (this.logger != null) this.logger.error(message);
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

  public getLogger(instanceName: string): ServiceLogger {
    return new ServiceLogger(this.serviceName, instanceName, this.path); 
  }
}
