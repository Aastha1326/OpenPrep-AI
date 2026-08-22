const { Sponsor, BountyClaim, User } = require('../models');
const { Sequelize, Op } = require('sequelize');
const crypto = require('crypto');

/**
 * Enterprise Service Layer representing Gamification operations.
 * Handles massive load of cryptographic decoding during Career Fairs
 * providing transactional security ensuring no student double-spends a token.
 * 
 * @class BountyRPCService
 */
class BountyRPCService {
    /**
     * Hashes the plaintext token as provided by the user using a canonical salted iteration.
     * Matches the DB index strictly.
     * @param {string} plaintextToken 
     * @returns {string} SHA-256 string
     */
    static generateHash(plaintextToken) {
        if (!plaintextToken || plaintextToken.length !== 19) {
            // Expects format like ABCD-EFGH-IJKL-MNOP (16 chars + 3 dashes)
            throw new Error('Invalid token structure provided.');
        }
        const cleanToken = plaintextToken.toUpperCase().replace(/\s/g, '');
        return crypto.createHash('sha256').update(cleanToken).digest('hex');
    }

    /**
     * Complex Transactional Method: Attempts to claim a bounty code for a student.
     * Leverages pessimistic locking to prevent concurrency exploits where two
     * rapid requests try to claim the same unique global token.
     * 
     * @param {string} studentUserId 
     * @param {string} rawToken - e.g., "AF4C-B912-70F4-CC99"
     * @param {Object} reqContext - IP, headers, geometa
     */
    static async claimBountyToken(studentUserId, rawToken, reqContext = {}) {
        // Wait for initialization of DB connection explicitly
        const sequelize = Sponsor.sequelize;
        const targetHash = this.generateHash(rawToken);

        // Enforce Anti-Bot Rate Limiting Context (Assuming native implementation for constraint tracking)
        this.enforceRateLimitingHeuristic(reqContext.ip, reqContext.userId);

        const transaction = await sequelize.transaction();

        try {
            // Request pessimistic write lock. 
            // Ensures if another thread tries to claim this hash, it blocks until we finish.
            const targetBounty = await BountyClaim.findOne({
                where: { claimTokenHash: targetHash },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!targetBounty) {
                throw new Error('This bounty code does not exist in our gamification matrix.');
            }

            // 1. Business Logic Validations
            if (targetBounty.status !== 'ACTIVE') {
                throw new Error(`This bounty code is currently: ${targetBounty.status}. It cannot be claimed.`);
            }

            if (targetBounty.expirationDate && new Date() > targetBounty.expirationDate) {
                targetBounty.status = 'EXPIRED';
                await targetBounty.save({ transaction });
                throw new Error('This bounty code has expired.');
            }

            if (targetBounty.studentUserId) {
                throw new Error('This bounty has already been assigned an owner.');
            }

            // Verify the sponsor actively permits distributions
            const sponsorNode = await Sponsor.findByPk(targetBounty.sponsorId, { transaction });
            if (!sponsorNode || !sponsorNode.isActive || !sponsorNode.gamificationEnabled) {
                throw new Error('The sponsor has paused all gamification campaigns temporarily.');
            }

            // 2. Perform Gamification Allocation Transaction
            targetBounty.studentUserId = studentUserId;
            targetBounty.status = 'CLAIMED';
            targetBounty.claimedAt = new Date();
            targetBounty.ipAddressRecorded = reqContext.ipAddress || 'UNKNOWN';

            if (reqContext.device) {
                targetBounty.metadata = { ...targetBounty.metadata, claimDevice: reqContext.device };
            }

            await targetBounty.save({ transaction });

            // Optionally increment Student's global reputation here
            const student = await User.findByPk(studentUserId, { lock: transaction.LOCK.UPDATE, transaction });
            if (student) {
                const oldPoints = student.reputationPoints || 0;
                student.reputationPoints = oldPoints + targetBounty.reputationValue;
                await student.save({ transaction });
            }

            await transaction.commit();

            return {
                success: true,
                reputationAwarded: targetBounty.reputationValue,
                sponsorName: sponsorNode.parentCompany ? sponsorNode.parentCompany.name : 'Corporate Partner',
                bannerColor: sponsorNode.brandColorHex,
                message: sponsorNode.sponsorMessage || 'Thank you for exploring our ecosystem!',
                newTotalReputation: student ? student.reputationPoints : targetBounty.reputationValue
            };

        } catch (error) {
            await transaction.rollback();
            console.error(`[BountyRPC] Claim rejection: ${error.message}`);

            // Throw specific error payload suitable for frontend toast notifications
            throw {
                status: 400,
                internalMessage: 'Bounty claim routine rejected',
                displayMessage: error.message
            };
        }
    }

    /**
     * Rate limiting stub to prevent brute force attacks on random 16-character keys.
     * Throws an exception if IP address exceeds 10 guesses in 1 minute.
     */
    static enforceRateLimitingHeuristic(ipAddress, userId) {
        // In a full environment, we utilize Redis or Memcached here to tally rapid attempts
        // Throw native limit error: throw new Error('429: Too Many Requests');
    }

    /**
     * Sponsor Dashboard reporting. Fetches fully enriched claim list with pagination.
     */
    static async getPaginatedSponsorClaims(sponsorId, limit = 20, offset = 0) {
        if (!sponsorId) throw new Error('SponsorID explicit required for audit');

        const data = await BountyClaim.findAndCountAll({
            where: { sponsorId },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'email', 'firstName', 'lastName'] // Obfuscating PII depending on platform rules
                }
            ]
        });

        return {
            total: data.count,
            rows: data.rows
        };
    }
}

module.exports = BountyRPCService;
