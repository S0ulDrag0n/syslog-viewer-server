import { Server } from 'socket.io';
const LogEvents = require('../../lib/constants/LogEvents');

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    
    const { syslogManager, logManager } = res;

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

      socket.on('disconnect', () => socket.removeAllListeners());
    });

    io.engine.on("connection_error", (err) => {
      console.log(err.req);      // the request object
      console.log(err.code);     // the error code, for example 1
      console.log(err.message);  // the error message, for example "Session ID unknown"
      console.log(err.context);  // some additional error context
    });
  }
  res.end();
}

export default SocketHandler;
