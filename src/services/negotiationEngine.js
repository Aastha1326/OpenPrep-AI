/**
 * Offer Negotiation Engine
 * Total compensation formulas, market percentile benchmark algorithms, and AI counter-offer email builders.
 */

export interface CompensationPackage {
    baseSalary: number;
    annualBonus: number;
    equityValueFourYear: number;
    signingBonus: number;
}

export interface NegotiationBenchmarkResult {
    totalFirstYearComp: number;
    marketPercentile: number;
    recommendedCounterBase: number;
    recommendedCounterEquity: number;
    counterOfferEmailScript: string;
}

export const calculateNegotiationBenchmark = (pkg: CompensationPackage, companyTier: string): NegotiationBenchmarkResult => {
    const annualEquity = pkg.equityValueFourYear / 4;
    const totalFirstYearComp = pkg.baseSalary + pkg.annualBonus + annualEquity + pkg.signingBonus;

    const marketPercentile = Math.min(99, Math.round((totalFirstYearComp / 220000) * 75));
    const recommendedCounterBase = Math.round(pkg.baseSalary * 1.12);
    const recommendedCounterEquity = Math.round(pkg.equityValueFourYear * 1.20);

    const counterOfferEmailScript = `Dear Hiring Manager,

Thank you so much for extending the offer for the Senior Software Engineer role. I am extremely excited about the team's mission and the technical challenges ahead.

Based on my current market benchmark data and specialized expertise in distributed systems architecture, I would like to explore whether we can adjust the base salary to $${recommendedCounterBase.toLocaleString()} and the 4-year equity grant to $${recommendedCounterEquity.toLocaleString()}.

I am confident this alignment will allow me to deliver immediate impact to the team. Looking forward to your thoughts!

Best regards,
[Candidate Name]`;

    return {
        totalFirstYearComp,
        marketPercentile,
        recommendedCounterBase,
        recommendedCounterEquity,
        counterOfferEmailScript
    };
};
