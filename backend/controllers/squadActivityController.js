const squadActivityService = require('../services/squadActivityService');
const { SquadMember } = require('../models');

async function getFeed(req, res, next) {
  try {
    const { squadId } = req.params;
    const member = await SquadMember.findOne({ where: { squadId, userId: req.user.id } });
    if (!member) {
      return res.status(403).json({ error: 'Not authorized to view this squad activity feed' });
    }

    const { limit, offset, activityType, userId, dateFrom, dateTo } = req.query;
    const feed = await squadActivityService.getActivityFeed(
      squadId,
      req.user.id,
      limit,
      offset,
      { activityType, userId, dateFrom, dateTo }
    );
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

    // squadId is passed through so the service can confirm the activity really
    // belongs to the squad the caller was authorized against.
    const result = await squadActivityService.reactToActivity(
      activityId,
      req.user.id,
      emoji,
      squadId
    );
    res.status(200).json(result);
  } catch (err) {
    if (
      err.message === 'Unsupported reaction emoji' ||
      err.message === 'Activity not found' ||
      err.message === 'Activity does not belong to this squad'
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

module.exports = { getFeed, react };
