export interface Certification {
    id: string;
    name: string;
    description: string;
    testedSkill: string;
    frameworks: string[];
    price: number;
}

export const certifications: Certification[] = [
    {
        id: 'cphrx',
        name: 'CPHRx',
        description: 'Expertise in identifying High Potentials (HiPos) and building robust succession pipelines.',
        testedSkill: 'Strategic HR Leadership',
        frameworks: ['LAMP Model (Logic, Analytics, Measures, Process)', 'Nine-Box Grid', 'Competency Framework'],
        price: 1999
    },
    {
        id: 'pmpx',
        name: 'PMPx',
        description: 'Advanced project management certification focusing on agile methodologies and strategic execution.',
        testedSkill: 'Project Management Excellence',
        frameworks: ['PMBOK Guide', 'Agile Framework', 'Scrum Methodology', 'PRINCE2'],
        price: 1999
    },
    {
        id: 'shrm-cp',
        name: 'SHRM-CP',
        description: 'Comprehensive HR competency certification covering behavioral competencies and HR knowledge.',
        testedSkill: 'HR Business Partnership',
        frameworks: ['SHRM Competency Model', 'People Analytics', 'Change Management'],
        price: 1999
    },
    {
        id: 'cipd',
        name: 'CIPD Level 7',
        description: 'Strategic people development certification with focus on organizational psychology and culture.',
        testedSkill: 'Organizational Development',
        frameworks: ['CIPD Profession Map', 'Culture Transformation', 'Learning & Development'],
        price: 1999
    },
    {
        id: 'phri',
        name: 'PHRi',
        description: 'International HR certification covering global HR practices and cross-cultural management.',
        testedSkill: 'Global HR Management',
        frameworks: ['Global Mobility Framework', 'Cultural Intelligence Model', 'International Labor Standards'],
        price: 1999
    },
    {
        id: 'sphr',
        name: 'SPHR',
        description: 'Senior-level HR certification emphasizing strategy formulation and policy development.',
        testedSkill: 'HR Strategy & Policy',
        frameworks: ['Strategic HR Framework', 'Workforce Planning Model', 'Risk Management'],
        price: 1999
    }
];

// Base pricing
export const ORIGINAL_PRICE_PER_CERT = 3999;
export const BASE_DISCOUNTED_PRICE = 1999; // 50% off original

// Progressive Pricing Model (applied on top of base discount)
export const PRICING_TIERS = [
    { minQty: 1, maxQty: 1, pricePerCert: 1999, discount: 0, label: "Launch Price" },
    { minQty: 2, maxQty: 2, pricePerCert: 1799, discount: 10, label: "Pair Discount" },
    { minQty: 3, maxQty: 4, pricePerCert: 1599, discount: 20, label: "Multi-Cert Discount" },
    { minQty: 5, maxQty: 6, pricePerCert: 1199, discount: 40, label: "Full Bundle" }
];

export const getPricingForQuantity = (quantity: number) => {
    return PRICING_TIERS.find(tier => quantity >= tier.minQty && quantity <= tier.maxQty) 
        || PRICING_TIERS[PRICING_TIERS.length - 1]; // Default to highest tier if more than max
};

export const calculateTotalPrice = (quantity: number) => {
    const tier = getPricingForQuantity(quantity);
    return tier.pricePerCert * quantity;
};
