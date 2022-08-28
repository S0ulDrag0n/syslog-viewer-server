// server.js
const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');
const next = require('next');
const LogManager = require('./lib/Managers/LogManager');
const SyslogServerManager = require('./lib/Managers/SyslogServerManager');
const logger = require('./lib/logger');
const LogEvents = require('./lib/constants/LogEvents');

const syslogManager = new SyslogServerManager();
syslogManager.start();

const logManager = new LogManager(process.env.MYSQL_HOST, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD);

const dev = process.env.NODE_ENV !== 'production';
const hostname = '';
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {

  const dbInitTask = logManager.initialize();

  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/a') {
        await app.render(req, res, '/a', query);
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      logger.error('Server', 'Error occurred handling', req.url, err)
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err
    logger.log('Server', `Ready on http://${hostname}:${port}`)
  });

  await dbInitTask;

  const io = new Server(httpServer);

  io.on('connection', socket => {
    syslogManager.on('msg', async log => {
      await logManager.add(log);
      const logs = await logManager.getAll();
      socket.emit(LogEvents.NEW_LOG, logs);
    });

    socket.on(LogEvents.GET_ALL_LOGS, async (descOrder = true) => {
      const logs = await logManager.getAll(descOrder);
      socket.emit(LogEvents.GET_ALL_LOGS, logs);
    });

    socket.on(LogEvents.SEARCH_LOGS, async (criteria, descOrder = true) => {
      const logs = criteria ? await logManager.search(criteria, descOrder) : await logManager.getAll(descOrder);
      socket.emit(LogEvents.SEARCH_LOGS, logs);
    });

    socket.on('disconnect', () => socket.removeAllListeners())
  });
});


