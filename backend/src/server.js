const app = require('./app');
const http = require('http');
const WebSocket = require('ws');
const { sequelize } = require('./models');
const { handleConsole } = require('./services/console');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/');
  const vpsId = pathParts[pathParts.length - 1];
  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(1008, 'Missing token');
    return;
  }
  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    ws.close(1008, 'Invalid token');
    return;
  }
  handleConsole(ws, parseInt(vpsId), user);
});

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`🌀 Storm VPS Manager running on port ${PORT}`);
  });
});
