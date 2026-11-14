const app = require('./app');

const argPort = process.argv.indexOf('--port');
const port = Number(argPort > -1 ? process.argv[argPort + 1] : process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log('listening on', port));
