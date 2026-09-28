const { createApp } = require('./app');
const config = require('./config');
const db = require('./db');

const server = createApp().listen(config.port, () =>
  console.log(`Task Manager running at http://localhost:${config.port} [${config.env}]`)
);

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => { db.close(); process.exit(0); });
}
['SIGINT', 'SIGTERM'].forEach((s) => process.on(s, () => shutdown(s)));
