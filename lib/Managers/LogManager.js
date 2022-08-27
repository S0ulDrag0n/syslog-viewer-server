const mariadb = require('mariadb');
const logger = require('../logger');

class LogManager {
  constructor(host, user, password, connectionLimit) {
    this._pool = mariadb.createPool({
      host,
      user,
      password,
      connectionLimit,
    });
    this._initialized = false;
    logger.log('LogManager', `Using ${user}@${host} as database`);
  }
  async initialize() {
    if (this._initialized) {
      return;
    }

    const connection = await this._pool.getConnection();
    logger.log('LogManager', 'Connecting to database...');
    try {
      await connection.query(`CREATE TABLE IF NOT EXISTS ${process.env.MYSQL_DATABASE}.messages (id INT PRIMARY KEY AUTO_INCREMENT, facility TEXT, facilityCode INT, severity TEXT, severityCode INT, timestamp DATETIME, hostname TEXT, address TEXT, port TEXT, msg JSON, raw TEXT)`);
      await connection.query(`CREATE FULLTEXT INDEX IF NOT EXISTS raw_msg_search ON ${process.env.MYSQL_DATABASE}.messages(raw)`);
      await connection.end(); 
      this._initialized = true;

      logger.log('LogManager', 'Connected to database');
    } catch (e) {
      logger.error('LogManager', e);
    }
  }
  async add(log) {
    await this.initialize();
    const connection = await this._pool.getConnection();
    const id = Math.round(Math.random() * 1000);
    logger.log('LogManager', `[${id}] Adding new ${log.severity} (${log.severityCode}) message from ${log.hostname}`);
    try {
      await connection.beginTransaction();
      await connection.query(`INSERT INTO ${process.env.MYSQL_DATABASE}.messages (facility, facilityCode, severity, severityCode, timestamp, hostname, address, port, msg, raw) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        log.facility,
        log.facilityCode,
        log.severity,
        log.severityCode,
        log.timestamp,
        log.hostname,
        log.address,
        log.port,
        log,
        JSON.stringify(log),
      ]);
      await connection.commit();
      await connection.end();

      logger.log('LogManager', `[${id}] Added new ${log.severity} (${log.severityCode}) message from ${log.hostname}`);
    } catch (e) {
      logger.error(e);
    }
  }
  async getAll(descOrder = true) {
    await this.initialize();
    const connection = await this._pool.getConnection();
    const results = await connection.query(`SELECT msg FROM ${process.env.MYSQL_DATABASE}.messages ORDER BY timestamp ${descOrder ? 'DESC' : 'ASC'}`);
    await connection.end();
    return results;
  }
  async search(criteria, descOrder = true) {
    await this.initialize();
    const connection = await this._pool.getConnection();
    const results = await connection.query(`
      SELECT msg
      FROM ${process.env.MYSQL_DATABASE}.messages
      WHERE raw LIKE ?
      ORDER BY timestamp ${descOrder ? 'DESC' : 'ASC'}`, [`%${criteria}%`]);
    await connection.end();
    return results;
  }
}

module.exports = LogManager;
