const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, VPS } = require('../models');
const { createDroplet, getDroplet } = require('../services/do');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/users', authenticate, isAdmin, async (req, res) => {
  const { username, password, vpsName, plan } = req.body;

  try {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const user = await User.create({ username, password: hashed });

    let vps = null;
    if (vpsName && plan) {
      const droplet = await createDroplet(vpsName, plan);
      vps = await VPS.create({
        userId: user.id,
        name: vpsName,
        plan: plan,
        providerId: droplet.id,
        status: 'creating',
        sshPassword: droplet.sshPassword,
      });

      setTimeout(async () => {
        try {
          const dropletInfo = await getDroplet(droplet.id);
          const ip = dropletInfo.networks.v4.find(n => n.type === 'public')?.ip_address;
          if (ip) {
            vps.ip = ip;
            vps.status = 'active';
            await vps.save();
          }
        } catch (err) {
          console.error('Failed to fetch IP', droplet.id);
        }
      }, 15000);
    }

    res.status(201).json({ user: { id: user.id, username: user.username }, vps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authenticate, isAdmin, async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'username'] });
  res.json(users);
});

module.exports = router;
