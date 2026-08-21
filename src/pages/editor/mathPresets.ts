/**
 * Mathematical Symbol Presets & Chemical Equation Toolbar Config
 * Standard LaTeX expression templates for Calculus, Linear Algebra, Chemical Kinetics, and Physics.
 */

export interface MathSymbolSnippet {
    label: string;
    snippet: string;
    category: 'calculus' | 'algebra' | 'chemistry' | 'physics' | 'symbols';
    description: string;
}

export const MATH_TOOLBAR_SNIPPETS: MathSymbolSnippet[] = [
    // Calculus & Analysis
    { label: "Fraction", snippet: "\\frac{a}{b}", category: "calculus", description: "Numerator / Denominator Fraction" },
    { label: "Integral", snippet: "\\int_{0}^{\\infty} f(x) dx", category: "calculus", description: "Definite Integral with limits" },
    { label: "Summation", snippet: "\\sum_{i=1}^{n} i^2", category: "calculus", description: "Sigma Summation Series" },
    { label: "Limit", snippet: "\\lim_{x \\to 0} \\frac{\\sin x}{x}", category: "calculus", description: "Limit expression" },
    { label: "Partial Derivative", snippet: "\\frac{\\partial y}{\\partial x}", category: "calculus", description: "Partial Differential derivative" },

    // Linear Algebra & Matrices
    { label: "2x2 Matrix", snippet: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", category: "algebra", description: "2x2 Parentheses Matrix" },
    { label: "Determinant", snippet: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}", category: "algebra", description: "Determinant Matrix" },
    { label: "Vector Arrow", snippet: "\\vec{v} = \\langle x, y, z \\rangle", category: "algebra", description: "3D Spatial Vector notation" },

    // Chemistry & Kinetics (mhchem style)
    { label: "Water Reaction", snippet: "\\text{2H}_2 + \\text{O}_2 \\rightarrow \\text{2H}_2\\text{O}", category: "chemistry", description: "Stoichiometric reaction formula" },
    { label: "Sulfuric Acid", snippet: "\\text{H}_2\\text{SO}_4", category: "chemistry", description: "Chemical compound subscript" },
    { label: "Equilibrium Arrow", snippet: "\\text{A} \\rightleftharpoons \\text{B}", category: "chemistry", description: "Reversible equilibrium chemical reaction" },

    // Physics & Quantum
    { label: "Einstein Energy", snippet: "E = m c^2", category: "physics", description: "Mass-Energy equivalence" },
    { label: "Schrödinger Equation", snippet: "i \\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi", category: "physics", description: "Quantum wave function equation" },
    { label: "Maxwell Field", snippet: "\\nabla \\times \\vec{B} = \\mu_0 \\vec{J}", category: "physics", description: "Magnetic field curl equation" },

    // Greek Symbols & Relations
    { label: "Alpha / Beta", snippet: "\\alpha, \\beta, \\gamma, \\theta, \\lambda", category: "symbols", description: "Common Greek letters" },
    { label: "Square Root", snippet: "\\sqrt{x^2 + y^2}", category: "symbols", description: "Radical square root" },
    { label: "Infinity / Delta", snippet: "\\infty, \\Delta, \\nabla", category: "symbols", description: "Mathematical operators" }
];

// Helper formula text templates
export const SAMPLE_MATH_DOCUMENTS = {
    calculus: `### Calculus & Differential Equations\n\nInline formula: $E = mc^2$\n\nBlock integral derivation:\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\nPartial differential equation:\n$$\\frac{\\partial u}{\\partial t} = \\alpha \\frac{\\partial^2 u}{\\partial x^2}$$`,
    chemistry: `### Chemical Thermodynamics & Stoichiometry\n\nSynthesis of water:\n$$\\text{2H}_2\\text{(g)} + \\text{O}_2\\text{(g)} \\rightarrow \\text{2H}_2\\text{O(l)}$$\n\nGibbs Free Energy equation:\n$$\\Delta G = \\Delta H - T\\Delta S$$`,
    quantum: `### Quantum Mechanics & Linear Algebra\n\nSchrödinger Time-Dependent Equation:\n$$i \\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)$$\n\nState Vector Matrix:\n$$\\begin{pmatrix} \\psi_1 \\\\ \\psi_2 \\end{pmatrix} = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 \\\\ i \\end{pmatrix}$$`
};
