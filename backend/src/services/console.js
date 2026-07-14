const { Client } = require('ssh2');
const { VPS } = require('../models');

function handleConsole(ws, vpsId, user) {
  VPS.findByPk(vpsId).then(vps => {
    if (!vps) {
      ws.close(1008, 'VPS not found');
      return;
    }
    if (vps.userId !== user.id && !user.isAdmin) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const conn = new Client();
    conn.on('ready', () => {
      conn.shell((err, stream) => {
        if (err) {
          ws.close(1011, 'Shell error');
          return;
        }
        stream.on('data', (data) => {
          ws.send(data.toString('utf8'));
        });
        ws.on('message', (msg) => {
          stream.write(msg.toString());
        });
        ws.on('close', () => {
          stream.end();
          conn.end();
        });
      });
    });

    conn.on('error', (err) => {
      ws.close(1011, 'SSH error');
    });

    conn.connect({
      host: vps.ip,
      username: 'vpsuser',
      password: vps.sshPassword,
      readyTimeout: 20000,
    });
  }).catch(() => {
    ws.close(1011, 'Server error');
  });
}

module.exports = { handleConsole };
