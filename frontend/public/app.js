let token = null;
let isAdmin = false;
let ws = null;
let currentVpsId = null;

const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const adminPanel = document.getElementById('adminPanel');
const vpsList = document.getElementById('vpsList');
const consoleContainer = document.getElementById('consoleContainer');
const term = document.getElementById('term');
const cmdInput = document.getElementById('cmdInput');
const consoleVpsName = document.getElementById('consoleVpsName');

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      document.getElementById('loginError').textContent = data.error || 'Login failed';
      return;
    }
    token = data.token;
    isAdmin = data.isAdmin;
    document.getElementById('loginError').textContent = '';
    loginContainer.style.display = 'none';
    dashboard.style.display = 'block';
    if (isAdmin) {
      adminPanel.style.display = 'block';
    }
    loadVPS();
  } catch (err) {
    document.getElementById('loginError').textContent = 'Network error';
  }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  token = null;
  isAdmin = false;
  dashboard.style.display = 'none';
  loginContainer.style.display = 'block';
  if (ws) { ws.close(); ws = null; }
});

// Admin: create user + VPS
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const vpsName = document.getElementById('vpsName').value;
  const plan = document.getElementById('vpsPlan').value;

  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, vpsName, plan })
    });
    const data = await res.json();
    if (!res.ok) {
      document.getElementById('adminResult').textContent = 'Error: ' + (data.error || '');
      return;
    }
    document.getElementById('adminResult').textContent = `User "${username}" created${data.vps ? ' with VPS' : ''}!`;
    document.getElementById('createUserForm').reset();
    loadVPS();
  } catch (err) {
    document.getElementById('adminResult').textContent = 'Network error';
  }
});

// Load user's VPS
async function loadVPS() {
  try {
    const res = await fetch('/api/user/vps', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load');
    const vpsArray = await res.json();
    renderVPS(vpsArray);
  } catch (err) {
    vpsList.innerHTML = '<p>Failed to load VPS list.</p>';
  }
}

function renderVPS(vpsArray) {
  if (vpsArray.length === 0) {
    vpsList.innerHTML = '<p style="color:#ccc;">No VPS assigned yet.</p>';
    return;
  }
  vpsList.innerHTML = vpsArray.map(vps => `
    <div class="vps-card">
      <h4>${vps.name}</h4>
      <p><strong>Plan:</strong> ${vps.plan}</p>
      <p><strong>IP:</strong> ${vps.ip || 'Provisioning...'}</p>
      <p><strong>Status:</strong> <span class="status-${vps.status}">${vps.status}</span></p>
      <div class="action-buttons">
        <button onclick="vpsAction(${vps.id}, 'start')" ${vps.status === 'active' ? 'disabled' : ''}>Start</button>
        <button onclick="vpsAction(${vps.id}, 'stop')" ${vps.status === 'stopped' || vps.status === 'creating' ? 'disabled' : ''}>Stop</button>
        <button onclick="vpsAction(${vps.id}, 'reboot')" ${vps.status !== 'active' ? 'disabled' : ''}>Reboot</button>
        <button onclick="openConsole(${vps.id}, '${vps.name}')">Console</button>
      </div>
    </div>
  `).join('');
}

// Perform VPS action
async function vpsAction(vpsId, action) {
  try {
    const res = await fetch(`/api/user/vps/${vpsId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data.error || 'Action failed'));
      return;
    }
    setTimeout(loadVPS, 2000);
  } catch (err) {
    alert('Network error');
  }
}

// Open WebSocket console
function openConsole(vpsId, vpsName) {
  if (ws) {
    ws.close();
    ws = null;
  }
  currentVpsId = vpsId;
  consoleVpsName.textContent = vpsName;
  consoleContainer.style.display = 'block';
  term.value = 'Connecting to console...\n';

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/console/${vpsId}?token=${token}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    term.value = 'Connected to console. Type commands below.\n';
    cmdInput.disabled = false;
    cmdInput.focus();
  };

  ws.onmessage = (e) => {
    term.value += e.data;
    term.scrollTop = term.scrollHeight;
  };

  ws.onclose = () => {
    term.value += '\n--- Connection closed ---\n';
    cmdInput.disabled = true;
  };

  ws.onerror = () => {
    term.value += '\n--- WebSocket error ---\n';
    cmdInput.disabled = true;
  };

  cmdInput.onkeydown = (e) => {
    if (e.key === 'Enter' && ws && ws.readyState === WebSocket.OPEN) {
      const cmd = cmdInput.value;
      ws.send(cmd + '\n');
      cmdInput.value = '';
    }
  };
}

document.getElementById('closeConsoleBtn').addEventListener('click', () => {
  if (ws) { ws.close(); ws = null; }
  consoleContainer.style.display = 'none';
});
