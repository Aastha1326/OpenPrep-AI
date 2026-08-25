const communityResourceService = require('../services/communityResourceService');

exports.discoverResources = async (req, res) => {
  try {
    const { type, subject, search, sort, page, limit } = req.query;
    const data = await communityResourceService.discoverResources(req.user.id, { type, subject, search, sort, page: parseInt(page || 1), limit: parseInt(limit || 20) });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to discover resources' });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || 10);
    const data = await communityResourceService.getTrendingResources(req.user.id, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get trending resources' });
  }
};

exports.rateResource = async (req, res) => {
  try {
    const { resourceId, resourceType, stars, comment } = req.body;
    if (!resourceId || !resourceType || !stars) {
      return res.status(400).json({ success: false, message: 'resourceId, resourceType, and stars are required' });
    }
    const data = await communityResourceService.rateResource(req.user.id, resourceId, resourceType, stars, comment);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to rate resource' });
  }
};

exports.getResourceRatings = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.params;
    const data = await communityResourceService.getResourceRatings(resourceId, resourceType);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get ratings' });
  }
};

exports.getResourceDetail = async (req, res) => {
  try {
    const { resourceId, resourceType } = req.params;
    const data = await communityResourceService.getResourceDetail(resourceId, resourceType);
    if (!data) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get resource detail' });
  }
};

exports.getCommunityStats = async (req, res) => {
  try {
    const data = await communityResourceService.getCommunityStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to get community stats' });
  }
};
