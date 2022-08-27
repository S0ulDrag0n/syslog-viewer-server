const Syslog = require('simple-syslog-server');
const logger = require('../logger');

class SyslogServerManager {
  constructor(address = '', port = 514, socktype = 'UDP') {
    this._server = Syslog(socktype);
    this._address = address;
    this._port = port;
    this._listening = false;
    this._clients = [];
    this._count = 0;

    this._server
      .on('msg', async data => {
        logger.log('syslog', 'Message received (%i) from %s:%i\n%o\n', ++this._count, data.address, data.port, data);
        /*
        message received (1) from ::ffff:192.168.1.13:59666
        {
          "facility": "daemon",
          "facilityCode": 3,
          "severity": "info",
          "severityCode": 6,
          "tag": "systemd[1]",
          "timestamp": "2018-12-26T17:53:57.000Z",
          "hostname": "localhost",
          "address": "::ffff:192.168.1.13",
          "family": "IPv6",
          "port": 20514,
          "size": 80,
          "msg": "Started Daily apt download activities."
        }	
        */
      })
      .on('invalid', err => {
        logger.warn('syslog', 'Invalid message format received: %o\n', err);
      })
      .on('error', err => {
        logger.warn('syslog', 'Client disconnected abruptly: %o\n', err);
      })
      .on('connection', s => {
        let addr = s.address().address;
        logger.log('syslog', `Client connected: ${addr}\n`);
        this._clients.push(s);
        s.on('end', () => {
          logger.log('syslog', `Client disconnected: ${addr}\n`);
          let i = this._clients.indexOf(s);
          if (i !== -1)
          this._clients.splice(i, 1);
        });
      });
  }
  start() {
    return this._server
      .listen({ host: this._address, port: this._port })
      .then(() => {
        this._listening = true;
        logger.log('syslog', `Now listening on: ${this._address}:${this._port}`);
      })
      .catch(err => {
        if ((err.code == 'EACCES') && (this._port < 1024)) {
          logger.error('syslog', 'Cannot listen on ports below 1024 without root permissions. Select a higher port number: %o', err);
        }
        else { // Some other error so attempt to close server socket
          logger.error('syslog', `Error listening to ${this._address}:${this._port} - %o`, err);
          try {
            if (this._listening)
              server.close();
          }
          catch (err) {
            logger.warn('syslog', `Error trying to close server socket ${this._address}:${this._port} - %o`, err);
          }
        }
      });
  }
  on(event, handler) {
    this._server.on(event, handler);
  }
}

module.exports = SyslogServerManager;
