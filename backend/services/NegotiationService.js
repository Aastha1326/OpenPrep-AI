const SalaryNegotiation = require('../models/SalaryNegotiation');

class NegotiationService {
    /**
     * Initializes a new salary negotiation simulation
     */
    static async initiateSimulation(userId, configuration) {
        const { targetCompany, roleTitle, targetSalaryGoal, yoe } = configuration;

        // Generate pseudo-random market bounds based on role
        const baseMultiplier = roleTitle.toLowerCase().includes('senior') ? 1.5 : 1.0;
        const marketAverage = Math.floor((110000 + (Math.random() * 20000)) * baseMultiplier);

        // Give an initial low-ball offer (90% of market avg)
        const initialOffer = Math.floor(marketAverage * 0.9);

        const session = await SalaryNegotiation.create({
            userId,
            targetCompany,
            roleTitle,
            marketAverage,
            initialOffer,
            targetSalaryGoal,
            status: 'NotStarted',
            transcript: []
        });

        return session;
    }

    /**
     * Start the simulator
     */
    static async startSimulation(sessionId, userId) {
        const session = await SalaryNegotiation.findOne({ where: { id: sessionId, userId } });
        if (!session) throw new Error('Negotiation not found');

        session.status = 'InProgress';
        session.startedAt = new Date();

        const recruiterPrompt = `Hi! We're thrilled to extend you an offer for the ${session.roleTitle} position at ${session.targetCompany}. Based on our internal bands, we can offer a base salary of $${session.initialOffer.toLocaleString()}. How does that sound?`;

        session.transcript = [{ role: 'recruiter', text: recruiterPrompt, type: 'initial_offer' }];
        await session.save();

        return { session, message: recruiterPrompt };
    }

    /**
     * Parse message, adjust leverage, calculate counter, return recruiter response
     */
    static async submitCounterOffer(sessionId, userId, userMessage, extractedAsk) {
        const session = await SalaryNegotiation.findOne({ where: { id: sessionId, userId } });
        if (!session || session.status !== 'InProgress') throw new Error('Invalid or inactive session');

        let transcript = session.transcript || [];
        transcript.push({ role: 'candidate', text: userMessage, ask: extractedAsk });
        session.turnCount += 1;

        // Determine AI response strategy
        let recruiterResponse = "";
        let newStatus = 'InProgress';
        let newLeverage = session.leverageScore;

        // Dummy NLP evaluation based on text length and keyword magic for leverage
        if (userMessage.length > 100 && (userMessage.includes("market") || userMessage.includes("competing"))) {
            newLeverage = Math.min(100, newLeverage + 15);
        } else if (extractedAsk > session.marketAverage * 1.3) {
            newLeverage = Math.max(0, newLeverage - 20); // Asking too much
        }

        const currentOffer = transcript.slice().reverse().find(m => m.role === 'recruiter' && m.proposedOffer)?.proposedOffer || session.initialOffer;

        if (extractedAsk) {
            if (extractedAsk <= currentOffer) {
                recruiterResponse = `Great, I'm glad we could agree on $${extractedAsk.toLocaleString()}. We will send over the updated paperwork!`;
                newStatus = 'Accepted';
                session.finalOffer = extractedAsk;
            } else if (newLeverage < 20 || session.turnCount > 4) {
                // Hard wall
                recruiterResponse = `I completely understand where you're coming from, but $${currentOffer.toLocaleString()} is our absolute maximum for this equity band. We really can't go any higher.`;
            } else {
                // Meet in the middle approach
                const bump = Math.floor((extractedAsk - currentOffer) * (newLeverage / 100));
                const nextOffer = currentOffer + bump;

                if (nextOffer === currentOffer) {
                    recruiterResponse = `I've discussed with the hiring manager, but unfortunately, we are capped at $${currentOffer.toLocaleString()} based on our internal equity guidelines.`;
                } else {
                    recruiterResponse = `I appreciate your flexibility. I campaigned for you internally, and we can come up to $${nextOffer.toLocaleString()}. That is our best and final offer.`;
                    transcript.push({ role: 'recruiter', text: recruiterResponse, proposedOffer: nextOffer });
                    session.leverageScore = newLeverage;
                    session.transcript = transcript;
                    await session.save();
                    return { reply: recruiterResponse, leverage: newLeverage, latestOffer: nextOffer, status: newStatus };
                }
            }
        } else {
            // General conversational pushback
            recruiterResponse = "I totally understand. However, we feel this is a very competitive offer for this level. Is there a specific base salary figure you were targeting?";
        }

        transcript.push({ role: 'recruiter', text: recruiterResponse });
        session.transcript = transcript;
        session.status = newStatus;
        session.leverageScore = newLeverage;
        if (newStatus !== 'InProgress') session.completedAt = new Date();

        await session.save();

        return {
            reply: recruiterResponse,
            leverage: newLeverage,
            status: newStatus
        };
    }
}

module.exports = NegotiationService;
