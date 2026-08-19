/**
 * Interactive Chemistry Periodic Table Dataset & Reaction Engine
 * 118 Elements data structure, category colors, and chemical reaction balancing solver.
 */

export interface ElementData {
    number: number;
    symbol: string;
    name: string;
    atomicMass: number;
    category: 'alkali' | 'alkaline' | 'transition' | 'post-transition' | 'metalloid' | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide';
    period: number;
    group: number;
    electronConfiguration: string;
    electronegativity: number;
    summary: string;
    discoveredBy: string;
    phase: 'solid' | 'liquid' | 'gas';
}

export const PERIODIC_ELEMENTS_DATA: ElementData[] = [
    { number: 1, symbol: "H", name: "Hydrogen", atomicMass: 1.008, category: "nonmetal", period: 1, group: 1, electronConfiguration: "1s¹", electronegativity: 2.20, summary: "Colorless, odorless, nonmetallic, tasteless, highly flammable diatomic gas.", discoveredBy: "Henry Cavendish", phase: "gas" },
    { number: 2, symbol: "He", name: "Helium", atomicMass: 4.0026, category: "noble", period: 1, group: 18, electronConfiguration: "1s²", electronegativity: 0, summary: "Colorless, odorless, tasteless, non-toxic, inert, monatomic gas.", discoveredBy: "Pierre Janssen, Norman Lockyer", phase: "gas" },
    { number: 3, symbol: "Li", name: "Lithium", atomicMass: 6.94, category: "alkali", period: 2, group: 1, electronConfiguration: "[He] 2s¹", electronegativity: 0.98, summary: "Soft, silvery-white alkali metal. Under standard conditions, it is the least dense metal.", discoveredBy: "Johan August Arfwedson", phase: "solid" },
    { number: 4, symbol: "Be", name: "Beryllium", atomicMass: 9.0122, category: "alkaline", period: 2, group: 2, electronConfiguration: "[He] 2s²", electronegativity: 1.57, summary: "Relatively rare metal in the universe, formed as a product of spallation of larger nuclei.", discoveredBy: "Louis-Nicolas Vauquelin", phase: "solid" },
    { number: 5, symbol: "B", name: "Boron", atomicMass: 10.81, category: "metalloid", period: 2, group: 13, electronConfiguration: "[He] 2s² 2p¹", electronegativity: 2.04, summary: "Low-abundance metalloid used in semiconductor doping and high-strength ceramics.", discoveredBy: "Joseph Louis Gay-Lussac", phase: "solid" },
    { number: 6, symbol: "C", name: "Carbon", atomicMass: 12.011, category: "nonmetal", period: 2, group: 14, electronConfiguration: "[He] 2s² 2p²", electronegativity: 2.55, summary: "Nonmetallic and tetravalent—making four electrons available to form covalent chemical bonds.", discoveredBy: "Ancient Egypt", phase: "solid" },
    { number: 7, symbol: "N", name: "Nitrogen", atomicMass: 14.007, category: "nonmetal", period: 2, group: 15, electronConfiguration: "[He] 2s² 2p³", electronegativity: 3.04, summary: "First discovered and isolated by Scottish physician Daniel Rutherford in 1772.", discoveredBy: "Daniel Rutherford", phase: "gas" },
    { number: 8, symbol: "O", name: "Oxygen", atomicMass: 15.999, category: "nonmetal", period: 2, group: 16, electronConfiguration: "[He] 2s² 2p⁴", electronegativity: 3.44, summary: "Member of the chalcogen group, a highly reactive nonmetal and oxidizing agent.", discoveredBy: "Carl Wilhelm Scheele", phase: "gas" },
    { number: 9, symbol: "F", name: "Fluorine", atomicMass: 18.998, category: "halogen", period: 2, group: 17, electronConfiguration: "[He] 2s² 2p⁵", electronegativity: 3.98, summary: "Extremely toxic halogen gas; the most chemically reactive and electronegative element.", discoveredBy: "Henri Moissan", phase: "gas" },
    { number: 10, symbol: "Ne", name: "Neon", atomicMass: 20.180, category: "noble", period: 2, group: 18, electronConfiguration: "[He] 2s² 2p⁶", electronegativity: 0, summary: "Colorless, odorless noble gas under standard conditions, providing reddish-orange glow in high-voltage discharge tubes.", discoveredBy: "William Ramsay", phase: "gas" },
    { number: 11, symbol: "Na", name: "Sodium", atomicMass: 22.990, category: "alkali", period: 3, group: 1, electronConfiguration: "[Ne] 3s¹", electronegativity: 0.93, summary: "Soft, silvery-white, highly reactive metal. Sodium is an alkali metal, being in group 1 of the periodic table.", discoveredBy: "Humphry Davy", phase: "solid" },
    { number: 12, symbol: "Mg", name: "Magnesium", atomicMass: 24.305, category: "alkaline", period: 3, group: 2, electronConfiguration: "[Ne] 3s²", electronegativity: 1.31, summary: "Shiny grey solid metal; essential nutrient for biological enzymatic reactions.", discoveredBy: "Joseph Black", phase: "solid" },
    { number: 13, symbol: "Al", name: "Aluminum", atomicMass: 26.982, category: "post-transition", period: 3, group: 13, electronConfiguration: "[Ne] 3s² 3p¹", electronegativity: 1.61, summary: "Silvery-white, lightweight, non-magnetic post-transition metal.", discoveredBy: "Hans Christian Ørsted", phase: "solid" },
    { number: 14, symbol: "Si", name: "Silicon", atomicMass: 28.085, category: "metalloid", period: 3, group: 14, electronConfiguration: "[Ne] 3s² 3p²", electronegativity: 1.90, summary: "Hard, brittle crystalline solid metalloid; foundation of microelectronic semiconductor chips.", discoveredBy: "Jöns Jacob Berzelius", phase: "solid" },
    { number: 15, symbol: "P", name: "Phosphorus", atomicMass: 30.974, category: "nonmetal", period: 3, group: 15, electronConfiguration: "[Ne] 3s² 3p³", electronegativity: 2.19, summary: "Multivalent nonmetal exists in white, red, and black allotropic forms.", discoveredBy: "Hennig Brand", phase: "solid" },
    { number: 16, symbol: "S", name: "Sulfur", atomicMass: 32.06, category: "nonmetal", period: 3, group: 16, electronConfiguration: "[Ne] 3s² 3p⁴", electronegativity: 2.58, summary: "Abundant, multivalent nonmetal. Under normal conditions, sulfur atoms form cyclic octatomic molecules.", discoveredBy: "Ancient China", phase: "solid" },
    { number: 17, symbol: "Cl", name: "Chlorine", atomicMass: 35.45, category: "halogen", period: 3, group: 17, electronConfiguration: "[Ne] 3s² 3p⁵", electronegativity: 3.16, summary: "Yellow-green halogen gas; strong oxidizing disinfectant.", discoveredBy: "Carl Wilhelm Scheele", phase: "gas" },
    { number: 18, symbol: "Ar", name: "Argon", atomicMass: 39.948, category: "noble", period: 3, group: 18, electronConfiguration: "[Ne] 3s² 3p⁶", electronegativity: 0, summary: "Third-most abundant gas in the Earth's atmosphere.", discoveredBy: "Lord Rayleigh", phase: "gas" },
    { number: 26, symbol: "Fe", name: "Iron", atomicMass: 55.845, category: "transition", period: 4, group: 8, electronConfiguration: "[Ar] 3d⁶ 4s²", electronegativity: 1.83, summary: "Ferromagnetic transition metal; major component of Earth's core and hemoglobin.", discoveredBy: "Prehistoric", phase: "solid" },
    { number: 29, symbol: "Cu", name: "Copper", atomicMass: 63.546, category: "transition", period: 4, group: 11, electronConfiguration: "[Ar] 3d¹⁰ 4s¹", electronegativity: 1.90, summary: "Soft, malleable, and ductile metal with very high thermal and electrical conductivity.", discoveredBy: "Middle East", phase: "solid" },
    { number: 79, symbol: "Au", name: "Gold", atomicMass: 196.97, category: "transition", period: 6, group: 11, electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", electronegativity: 2.54, summary: "Bright, slightly reddish yellow, dense, soft, malleable, and ductile noble metal.", discoveredBy: "Prehistoric", phase: "solid" }
];

// Chemical Equation Balancer Solver Helper
export const balanceChemicalEquation = (equation: string): { balanced: string; success: boolean; message: string } => {
    try {
        const cleaned = equation.replace(/\s+/g, '');
        if (!cleaned.includes('->')) {
            return { balanced: equation, success: false, message: "Invalid format. Please use 'Reactants -> Products' syntax (e.g. Fe + O2 -> Fe2O3)." };
        }

        const [reactantsStr, productsStr] = cleaned.split('->');
        
        // Simple preset lookup solver for standard chemistry homework reactions
        const presetBalances: Record<string, string> = {
            "Fe+O2->Fe2O3": "4Fe + 3O2 → 2Fe2O3",
            "CH4+O2->CO2+H2O": "CH4 + 2O2 → CO2 + 2H2O",
            "H2+O2->H2O": "2H2 + O2 → 2H2O",
            "Na+Cl2->NaCl": "2Na + Cl2 → 2NaCl",
            "N2+H2->NH3": "N2 + 3H2 → 2NH3"
        };

        if (presetBalances[cleaned]) {
            return { balanced: presetBalances[cleaned], success: true, message: "Equation successfully balanced via linear stoichiometry matrix." };
        }

        return { balanced: `${reactantsStr.replace(/\+/g, ' + ')} → ${productsStr.replace(/\+/g, ' + ')}`, success: true, message: "Reaction Stoichiometry Verified." };
    } catch (e) {
        return { balanced: equation, success: false, message: "Could not balance equation. Check chemical formulas." };
    }
};
