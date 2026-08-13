const Subject = require('../models/Subject');
const { getCache, setCache } = require('../config/redis');

exports.getSyllabusCatalog = async (req, res, next) => {
  try {
    const cacheKey = 'syllabus_catalog_tree_all';
    
    // 1. Try fetching from Redis cache (<20ms response)
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cachedData,
      });
    }

    // 2. Fallback gracefully to database read
    const catalog = await Subject.findAll({
      include: [{ model: Syllabus, as: 'syllabi' }],
    });

    // 3. Store result in Redis with 24-hour TTL (86400 seconds)
    await setCache(cacheKey, catalog, 86400);

    res.status(200).json({
      success: true,
      source: 'database',
      data: catalog,
    });
  } catch (error) {
    next(error);
  }
};
