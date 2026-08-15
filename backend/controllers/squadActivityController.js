const squadActivityService = require('../services/squadActivityService');
const { SquadMember } = require('../models');

async function getFeed(req, res, next) {
  try {
    const { squadId } = req.params;
    const member = await SquadMember.findOne({ where: { squadId, userId: req.user.id } });
    if (!member) {
      return res.status(403).json({ error: 'Not authorized to view this squad activity feed' });
    }

    const feed = await squadActivityService.getActivityFeed(squadId, req.user.id);
    res.status(200).json(feed);
  } catch (err) {
    next(err);
  }
}

async function react(req, res, next) {
  try {
    const { squadId, activityId } = req.params;
    const { emoji } = req.body;

    const member = await SquadMember.findOne({ where: { squadId, userId: req.user.id } });
    if (!member) {
      return res.status(403).json({ error: 'Not authorized to react in this squad' });
    }
    if (!emoji) {
      return res.status(400).json({ error: 'emoji is required' });
    }

    const result = await squadActivityService.reactToActivity(activityId, req.user.id, emoji);
    res.status(200).json(result);
  } catch (err) {
    if (err.message === 'Unsupported reaction emoji' || err.message === 'Activity not found') {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { getFeed, react };