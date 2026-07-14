const axios = require('axios');

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

  const response = await axios.post(
    'https://api.digitalocean.com/v2/droplets',
    {
      name,
      region: process.env.DO_REGION,
      size: size || process.env.DO_SIZE,
      image: 'debian-12-x64',
      user_data: userData,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const droplet = response.data.droplet;
  return {
    id: droplet.id,
    sshPassword,
  };
}

async function getDroplet(dropletId) {
  const response = await axios.get(
    `https://api.digitalocean.com/v2/droplets/${dropletId}`,
    {
      headers: { Authorization: `Bearer ${process.env.DO_API_TOKEN}` },
    }
  );
  return response.data.droplet;
}

async function powerOn(dropletId) {
  await axios.post(
    `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
    { type: 'power_on' },
    { headers: { Authorization: `Bearer ${process.env.DO_API_TOKEN}` } }
  );
}

async function powerOff(dropletId) {
  await axios.post(
    `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
    { type: 'shutdown' },
    { headers: { Authorization: `Bearer ${process.env.DO_API_TOKEN}` } }
  );
}

async function reboot(dropletId) {
  await axios.post(
    `https://api.digitalocean.com/v2/droplets/${dropletId}/actions`,
    { type: 'reboot' },
    { headers: { Authorization: `Bearer ${process.env.DO_API_TOKEN}` } }
  );
}

module.exports = { createDroplet, getDroplet, powerOn, powerOff, reboot };
