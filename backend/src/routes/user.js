const express = require('express');
const router = express.Router();
const { VPS } = require('../models');
const { authenticate } = require('../middleware/auth');
const { powerOn, powerOff, reboot } = require('../services/do');

router.get('/vps', authenticate, async (req, res) => {
  const userId = req.user.id;
  const vpsList = await VPS.findAll({ where: { userId } });
  res.json(vpsList);
});

router.get('/vps/:id', authenticate, async (req, res) => {
  const vps = await VPS.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!vps) return res.status(404).json({ error: 'VPS not found' });
  res.json(vps);
});

router.post('/vps/:id/action', authenticate, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  const vps = await VPS.findOne({ where: { id, userId: req.user.id } });
  if (!vps) return res.status(404).json({ error: 'VPS not found' });
  if (!vps.providerId) return res.status(400).json({ error: 'VPS not provisioned' });

  try {
    switch (action) {
      case 'start':
        await powerOn(vps.providerId);
        vps.status = 'active';
        break;
      case 'stop':
        await powerOff(vps.providerId);
        vps.status = 'stopped';
        break;
      case 'reboot':
        await reboot(vps.providerId);
        vps.status = 'active';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    await vps.save();
    res.json({ message: `Action ${action} sent`, status: vps.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to perform action' });
  }
});

module.exports = router;
