const axios = require('axios');

// Railway API base URL
const RAILWAY_API = 'https://api.railway.com/v1';

// Generate random password for SSH
function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Create a new sandbox (VPS)
async function createDroplet(name, size) {
  const sshPassword = generatePassword();
  const userData = `#cloud-config
users:
  - name: vpsuser
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    passwd: ${sshPassword}
`;

  try {
    const response = await axios.post(
      `${RAILWAY_API}/sandboxes/create`,
      {
        name: name,
        image: 'debian:12',   // Debian 12
        resources: {
          cpu: size === 'small' ? 1 : 2,
          memory: size === 'small' ? 1024 : 2048,
          disk: 10 * 1024 // 10 GB
        },
        user_data: userData,
        // Enable SSH
        services: [
          {
            name: 'ssh',
            port: 22,
            protocol: 'tcp'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const sandbox = response.data;
    // Wait a moment for the sandbox to get an IP
    // The API might not return IP immediately, so we'll poll later.
    // We'll return the ID and password for now.
    return {
      id: sandbox.id,
      sshPassword: sshPassword,
    };
  } catch (error) {
    console.error('Failed to create sandbox:', error.response?.data || error.message);
    throw new Error('Failed to create VPS');
  }
}

// Get sandbox details (IP, status)
async function getDroplet(dropletId) {
  try {
    const response = await axios.get(
      `${RAILWAY_API}/sandboxes/${dropletId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`,
        },
      }
    );
    const sandbox = response.data;
    // The API might return IP under 'ip' or 'publicIp'
    const ip = sandbox.publicIp || sandbox.ip || 'Unknown';
    const status = sandbox.status === 'running' ? 'active' : 'stopped';
    return {
      id: sandbox.id,
      networks: {
        v4: [{ ip_address: ip, type: 'public' }]
      },
      status: status,
    };
  } catch (error) {
    console.error('Failed to get sandbox:', error.message);
    throw new Error('Failed to get VPS details');
  }
}

// Power on
async function powerOn(dropletId) {
  await axios.post(
    `${RAILWAY_API}/sandboxes/${dropletId}/start`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`,
      },
    }
  );
}

// Power off
async function powerOff(dropletId) {
  await axios.post(
    `${RAILWAY_API}/sandboxes/${dropletId}/stop`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`,
      },
    }
  );
}

// Reboot
async function reboot(dropletId) {
  // Some APIs have a reboot endpoint; if not, we can stop then start
  await powerOff(dropletId);
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));
  await powerOn(dropletId);
}

module.exports = { createDroplet, getDroplet, powerOn, powerOff, reboot };
