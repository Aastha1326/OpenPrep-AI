const { Badge } = require('../models');
const { BADGES, BADGE_LIST } = require('../config/badges');

async function seedBadges() {
  try {
    console.log('Starting badge seeding...');

    for (const badgeConfig of BADGE_LIST) {
      const [badge] = await Badge.findOrCreate({
        where: { id: badgeConfig.id },
        defaults: {
          id: badgeConfig.id,
          name: badgeConfig.name,
          description: badgeConfig.description,
          icon: badgeConfig.icon,
          svgIcon: badgeConfig.svgIcon || null,
          category: getCategoryForBadge(badgeConfig.id),
          isActive: true,
        },
      });

      if (badge.isNewRecord) {
        console.log(`Created badge: ${badgeConfig.name}`);
      } else {
        console.log(`Badge already exists: ${badgeConfig.name}`);
      }
    }

    console.log('Badge seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding badges:', error);
    process.exit(1);
  }
}

function getCategoryForBadge(badgeId) {
  if (badgeId.includes('streak') || badgeId.includes('warrior')) return 'streak';
  if (badgeId.includes('quiz') || badgeId.includes('sharpshooter') || badgeId.includes('perfect')) return 'quiz';
  if (badgeId.includes('card') || badgeId.includes('century')) return 'flashcard';
  if (badgeId.includes('study') || badgeId.includes('early') || badgeId.includes('night') || badgeId.includes('marathon')) return 'study';
  return 'achievement';
}

if (require.main === module) {
  seedBadges();
}

module.exports = { seedBadges };
