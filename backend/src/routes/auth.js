const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const ADMIN_USER = process.env.ADMIN_USER || 'vmallu';
const ADMIN_PASS = process.env.ADMIN_PASS || 'vmallu';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign(
      { id: 0, username: ADMIN_USER, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, isAdmin: true });
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, isAdmin: false },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, isAdmin: false });
});

module.exports = router;
