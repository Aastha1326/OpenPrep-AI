const JobApplication = require('../models/JobApplication');
const { Op } = require('sequelize');

class JobTrackerService {
    /**
     * Initialize a new job application on the Kanban board
     */
    static async addJob(userId, jobData) {
        // Find the current max order for the given status to place at the end
        const status = jobData.status || 'Wishlist';

        let maxItem = await JobApplication.findOne({
            where: { userId, status },
            order: [['kanbanOrder', 'DESC']]
        });

        const kanbanOrder = maxItem ? maxItem.kanbanOrder + 1 : 0;

        const newJob = await JobApplication.create({
            ...jobData,
            userId,
            kanbanOrder,
            dateAddedToWishlist: status === 'Wishlist' ? new Date() : undefined
        });

        return newJob;
    }

    /**
     * Move job application to a different column or reorder in the same column
     */
    static async moveJob(userId, jobId, newStatus, newOrder) {
        const job = await JobApplication.findOne({ where: { id: jobId, userId } });
        if (!job) throw new Error('Job application not found');

        const oldStatus = job.status;

        if (oldStatus !== newStatus) {
            // Shifting items out of the old column
            await JobApplication.increment('kanbanOrder', {
                by: -1,
                where: {
                    userId,
                    status: oldStatus,
                    kanbanOrder: { [Op.gt]: job.kanbanOrder }
                }
            });

            // Shifting items into the new column to make space
            await JobApplication.increment('kanbanOrder', {
                by: 1,
                where: {
                    userId,
                    status: newStatus,
                    kanbanOrder: { [Op.gte]: newOrder }
                }
            });

            job.status = newStatus;
            job.kanbanOrder = newOrder;
            await job.save();
        } else {
            // Reordering within the SAME column
            const oldOrder = job.kanbanOrder;

            if (oldOrder < newOrder) {
                // Moving down: shift items between oldOrder+1 and newOrder UP
                await JobApplication.increment('kanbanOrder', {
                    by: -1,
                    where: {
                        userId,
                        status: newStatus,
                        kanbanOrder: { [Op.between]: [oldOrder + 1, newOrder] }
                    }
                });
            } else if (oldOrder > newOrder) {
                // Moving up: shift items between newOrder and oldOrder-1 DOWN
                await JobApplication.increment('kanbanOrder', {
                    by: 1,
                    where: {
                        userId,
                        status: newStatus,
                        kanbanOrder: { [Op.between]: [newOrder, oldOrder - 1] }
                    }
                });
            }

            job.kanbanOrder = newOrder;
            await job.save();
        }

        return job;
    }

    /**
     * Retrieve all jobs structured for Kanban rendering
     */
    static async fetchBoardState(userId) {
        const jobs = await JobApplication.findAll({
            where: { userId },
            order: [
                ['status', 'ASC'],
                ['kanbanOrder', 'ASC']
            ]
        });

        // Group by status for the frontend
        const boardState = {
            'Wishlist': [],
            'Applied': [],
            'Interviewing': [],
            'Offered': [],
            'Accepted': [],
            'Rejected': []
        };

        jobs.forEach(job => {
            if (boardState[job.status]) {
                boardState[job.status].push(job);
            }
        });

        return boardState;
    }

    /**
     * Analytics engine to calculate conversion rates and velocity
     */
    static async getAnalytics(userId) {
        const jobs = await JobApplication.findAll({ where: { userId } });

        const countTotal = jobs.length;
        let countApplied = 0;
        let countInterviews = 0;
        let countOffers = 0;
        let timeToOfferBuffer = [];

        for (const job of jobs) {
            if (job.dateApplied || ['Applied', 'Interviewing', 'Offered', 'Accepted', 'Rejected'].includes(job.status)) countApplied++;
            if (job.dateFirstInterview || ['Interviewing', 'Offered', 'Accepted'].includes(job.status)) countInterviews++;
            if (['Offered', 'Accepted'].includes(job.status)) countOffers++;

            if (job.dateApplied && job.dateOffered) {
                const diffInMs = new Date(job.dateOffered) - new Date(job.dateApplied);
                timeToOfferBuffer.push(diffInMs / (1000 * 60 * 60 * 24)); // Days
            }
        }

        const avgTimeToOffer = timeToOfferBuffer.length > 0
            ? timeToOfferBuffer.reduce((a, b) => a + b, 0) / timeToOfferBuffer.length
            : null;

        return {
            totalPipelines: countTotal,
            conversionRateToInterview: countApplied ? ((countInterviews / countApplied) * 100).toFixed(1) + '%' : '0%',
            conversionRateToOffer: countInterviews ? ((countOffers / countInterviews) * 100).toFixed(1) + '%' : '0%',
            averageDaysToOffer: avgTimeToOffer ? Math.round(avgTimeToOffer) : null,
            activeApplications: countApplied - (jobs.filter(j => ['Rejected', 'Accepted'].includes(j.status)).length)
        };
    }
}

module.exports = JobTrackerService;
