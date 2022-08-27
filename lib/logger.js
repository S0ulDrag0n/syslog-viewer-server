const dayjs = require('dayjs');

const logger = {
  log(caller, msg) {
    const now = dayjs();
    console.log(`[${now.format("YYYY-MM-DD h:mm:ss").toString()}] [${caller}] ${msg}`);
  },
  warn(caller, msg) {
    const now = dayjs();
    console.warn(`[${now.format("YYYY-MM-DD h:mm:ss").toString()}] [${caller}] ${msg}`);
  },
  error(caller, msg) {
    const now = dayjs();
    console.error(`[${now.format("YYYY-MM-DD h:mm:ss").toString()}] [${caller}] ${msg}`);
  },
};

module.exports = logger;
