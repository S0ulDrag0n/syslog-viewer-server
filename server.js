// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const LogManager = require('./lib/Managers/LogManager');
const SyslogServerManager = require('./lib/Managers/SyslogServerManager');
const logger = require('./lib/logger');

logger.log('Server', 'Instantiating syslog...');
const syslogManager = new SyslogServerManager();
syslogManager.start();
logger.log('Server', 'Syslog ready!');

logger.log('Server', 'Instantiating log manager...');
const logManager = new LogManager(process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD);
logger.log('Server', 'Log manager ready!');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 3000;

logger.log('Server', 'Instantiating server...');
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

logger.log('Server', 'Preparing server...');
app.prepare().then(async () => {
  logger.log('Server', 'Starting database connection initialization...');
  await logManager.initialize();

  logger.log('Server', 'Starting custom server...');
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      res.logManager = logManager;
      res.syslogManager = syslogManager;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      logger.error('Server', 'Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err
    logger.log('Server', `Ready on http://${hostname}:${port}`);
  });
});


