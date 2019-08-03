# winston-microlog

Log manager provides simple and clear logging sysmem convenient to use for microservices.

[![NPM](https://nodei.co/npm/winston-microlog.png?downloads=true&downloadRank=true)](https://nodei.co/npm/winston-microlog/)

[![npm Downloads](https://img.shields.io/npm/dm/winston-microlog.svg?style=flat-square)](https://npmcharts.com/compare/winston-microlog?minimal=true)
[![commit activity](https://img.shields.io/github/commit-activity/m/dissfall/winston-microlog?style=flat-square)](https://github.com/Dissfall/winston-microlog/commits/master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
</br></br>
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/N4N510AEO)

[![Become a patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/join/dissfall?)

## Motivation

`winston-microlog` was developed in order to provide a way to keep logs from different sources (and parts of sources) in the most convenient and clear way. First of all, the project was created for microservices, where logs from different services are collected in one thread. Thus, the largest unit of logging is services. Services can include instances, which can be different functional parts of the service or just different files.

```
   Unit A1  Unit A2  Unit B1  Unit B2
     |        |        |        |
     |        |        |        |
     |        |        |        |
  +--v--------v--+  +--v--------v--+
  |              |  |              |
  |  Service A   |  |  Service B   |
  |              |  |              |
  +------+-------+  +------+-------+
         |                 |
         |                 |
         |                 |
         +---> Logfile <---+
```
## Useful resources
 * [API documentation](https://dissfall.github.io/winston-microlog/)
 * [winston repository](https://github.com/winstonjs/winston)

## Usage

To start logging you need to initialize logger for every service and then for every instance.

Example for one service:

logger.js
``` js
const LogManager = require("winston-microlog")["default"];

const logManager = new LogManager('Service');

exports["default"] = logManager;
```

db_connect.js
``` js
const logManager = require('./logger')['default'];

const logger = logManager.getLogger('db-con');

logger.info('Connecting to database...');
let db = [{'data': 'data'}];
logger.info('Database succesfully connected!');

exports['default'] = db;
```

index.js
``` js
const logManager = require('./logger')['default'];
const db = require('./db_connect')['default'];

const logger = logManager.getLogger('Main');

logger.info('Service started');

logger.err('Test error');
logger.warn('Test warning');
```

To start `node index.js`

Result:
```
@SERVICE  #DB-CON   [10:52]   ℹ| Connecting to database...
@SERVICE  #DB-CON   [10:52]   ℹ| Database succesfully connected!
@SERVICE  #MAIN     [10:52]   ℹ| Service started
@SERVICE  #MAIN     [10:52]  ⛔| Test error
@SERVICE  #MAIN     [10:52]   ⚠️| Test warning
```
## Importants
### Execution context
Note that if you want to pass logger in another module (function, class etc.) execution context wheel be changed and you need to pass logger with their context:
``` js
functionUsesLogger(logger.log.bind(logger));
```
### Using with container manager (like docker-compose)
Recomendet way to use winston-logger with managers like docker-compose is hide service name (because it already provided) with [showService](https://dissfall.github.io/winston-microlog/interfaces/lmconfig.html#showservice)
``` js
const logManager = new LogManager('Service', undefined, { showService: false });
```
