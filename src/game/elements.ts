// Element data for all 92 elements (H through U)
// Based on GDD: atomicNumber, symbol, halfLife (for unstable), isStable, weight

export interface ElementData {
  atomicNumber: number;
  symbol: string;
  name: string;
  weight: number; // Atomic mass (simplified)
  isStable: boolean;
  baseHalfLife: number | null; // In seconds, null for stable elements
  color: string; // Display color
}

// Unstable elements per GDD: Tc (43), Pm (61), elements > Pb (82), and radioactive ones
// For gameplay, we'll mark: Tc (43), Pm (61), Po-Rn (84-86), Fr-U (87-92) as unstable
const UNSTABLE_ELEMENTS = new Set([43, 61, 84, 85, 86, 87, 88, 89, 90, 91, 92]);

// Color palette based on element groups
export const getElementColor = (atomicNumber: number): string => {
  // Hydrogen - special white/light blue
  if (atomicNumber === 1) return '#ffffff';
  // Noble gases - purple tones
  if ([2, 10, 18, 36, 54, 86].includes(atomicNumber)) return '#b388ff';
  // Alkali metals - red/orange
  if ([3, 11, 19, 37, 55, 87].includes(atomicNumber)) return '#ff5252';
  // Alkaline earth metals - orange/yellow
  if ([4, 12, 20, 38, 56, 88].includes(atomicNumber)) return '#ffab40';
  // Transition metals - blue tones
  if (atomicNumber >= 21 && atomicNumber <= 30) return '#448aff';
  if (atomicNumber >= 39 && atomicNumber <= 48) return '#40c4ff';
  if (atomicNumber >= 72 && atomicNumber <= 80) return '#18ffff';
  // Iron group special - gold for Fe
  if (atomicNumber === 26) return '#ffd700';
  // Post-transition metals - gray/silver
  if ([13, 31, 49, 50, 81, 82, 83, 84].includes(atomicNumber)) return '#b0bec5';
  // Metalloids - teal
  if ([5, 14, 32, 33, 51, 52].includes(atomicNumber)) return '#64ffda';
  // Halogens - green
  if ([9, 17, 35, 53, 85].includes(atomicNumber)) return '#69f0ae';
  // Nonmetals - light blue
  if ([6, 7, 8, 15, 16, 34].includes(atomicNumber)) return '#80d8ff';
  // Lanthanides - pink
  if (atomicNumber >= 57 && atomicNumber <= 71) return '#f48fb1';
  // Actinides - deep red (radioactive glow)
  if (atomicNumber >= 89 && atomicNumber <= 92) return '#ff1744';
  // Default
  return '#90a4ae';
};

// Element database for all 92 elements
export const ELEMENTS: Record<number, ElementData> = {
  1: { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', weight: 1, isStable: true, baseHalfLife: null, color: '#ffffff' },
  2: { atomicNumber: 2, symbol: 'He', name: 'Helium', weight: 4, isStable: true, baseHalfLife: null, color: '#b388ff' },
  3: { atomicNumber: 3, symbol: 'Li', name: 'Lithium', weight: 7, isStable: true, baseHalfLife: null, color: '#ff5252' },
  4: { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', weight: 9, isStable: true, baseHalfLife: null, color: '#ffab40' },
  5: { atomicNumber: 5, symbol: 'B', name: 'Boron', weight: 11, isStable: true, baseHalfLife: null, color: '#64ffda' },
  6: { atomicNumber: 6, symbol: 'C', name: 'Carbon', weight: 12, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  7: { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', weight: 14, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  8: { atomicNumber: 8, symbol: 'O', name: 'Oxygen', weight: 16, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  9: { atomicNumber: 9, symbol: 'F', name: 'Fluorine', weight: 19, isStable: true, baseHalfLife: null, color: '#69f0ae' },
  10: { atomicNumber: 10, symbol: 'Ne', name: 'Neon', weight: 20, isStable: true, baseHalfLife: null, color: '#b388ff' },
  11: { atomicNumber: 11, symbol: 'Na', name: 'Sodium', weight: 23, isStable: true, baseHalfLife: null, color: '#ff5252' },
  12: { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', weight: 24, isStable: true, baseHalfLife: null, color: '#ffab40' },
  13: { atomicNumber: 13, symbol: 'Al', name: 'Aluminum', weight: 27, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  14: { atomicNumber: 14, symbol: 'Si', name: 'Silicon', weight: 28, isStable: true, baseHalfLife: null, color: '#64ffda' },
  15: { atomicNumber: 15, symbol: 'P', name: 'Phosphorus', weight: 31, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  16: { atomicNumber: 16, symbol: 'S', name: 'Sulfur', weight: 32, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  17: { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', weight: 35, isStable: true, baseHalfLife: null, color: '#69f0ae' },
  18: { atomicNumber: 18, symbol: 'Ar', name: 'Argon', weight: 40, isStable: true, baseHalfLife: null, color: '#b388ff' },
  19: { atomicNumber: 19, symbol: 'K', name: 'Potassium', weight: 39, isStable: true, baseHalfLife: null, color: '#ff5252' },
  20: { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', weight: 40, isStable: true, baseHalfLife: null, color: '#ffab40' },
  21: { atomicNumber: 21, symbol: 'Sc', name: 'Scandium', weight: 45, isStable: true, baseHalfLife: null, color: '#448aff' },
  22: { atomicNumber: 22, symbol: 'Ti', name: 'Titanium', weight: 48, isStable: true, baseHalfLife: null, color: '#448aff' },
  23: { atomicNumber: 23, symbol: 'V', name: 'Vanadium', weight: 51, isStable: true, baseHalfLife: null, color: '#448aff' },
  24: { atomicNumber: 24, symbol: 'Cr', name: 'Chromium', weight: 52, isStable: true, baseHalfLife: null, color: '#448aff' },
  25: { atomicNumber: 25, symbol: 'Mn', name: 'Manganese', weight: 55, isStable: true, baseHalfLife: null, color: '#448aff' },
  26: { atomicNumber: 26, symbol: 'Fe', name: 'Iron', weight: 56, isStable: true, baseHalfLife: null, color: '#ffd700' },
  27: { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', weight: 59, isStable: true, baseHalfLife: null, color: '#448aff' },
  28: { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', weight: 59, isStable: true, baseHalfLife: null, color: '#448aff' },
  29: { atomicNumber: 29, symbol: 'Cu', name: 'Copper', weight: 64, isStable: true, baseHalfLife: null, color: '#448aff' },
  30: { atomicNumber: 30, symbol: 'Zn', name: 'Zinc', weight: 65, isStable: true, baseHalfLife: null, color: '#448aff' },
  31: { atomicNumber: 31, symbol: 'Ga', name: 'Gallium', weight: 70, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  32: { atomicNumber: 32, symbol: 'Ge', name: 'Germanium', weight: 73, isStable: true, baseHalfLife: null, color: '#64ffda' },
  33: { atomicNumber: 33, symbol: 'As', name: 'Arsenic', weight: 75, isStable: true, baseHalfLife: null, color: '#64ffda' },
  34: { atomicNumber: 34, symbol: 'Se', name: 'Selenium', weight: 79, isStable: true, baseHalfLife: null, color: '#80d8ff' },
  35: { atomicNumber: 35, symbol: 'Br', name: 'Bromine', weight: 80, isStable: true, baseHalfLife: null, color: '#69f0ae' },
  36: { atomicNumber: 36, symbol: 'Kr', name: 'Krypton', weight: 84, isStable: true, baseHalfLife: null, color: '#b388ff' },
  37: { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium', weight: 85, isStable: true, baseHalfLife: null, color: '#ff5252' },
  38: { atomicNumber: 38, symbol: 'Sr', name: 'Strontium', weight: 88, isStable: true, baseHalfLife: null, color: '#ffab40' },
  39: { atomicNumber: 39, symbol: 'Y', name: 'Yttrium', weight: 89, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  40: { atomicNumber: 40, symbol: 'Zr', name: 'Zirconium', weight: 91, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  41: { atomicNumber: 41, symbol: 'Nb', name: 'Niobium', weight: 93, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  42: { atomicNumber: 42, symbol: 'Mo', name: 'Molybdenum', weight: 96, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  43: { atomicNumber: 43, symbol: 'Tc', name: 'Technetium', weight: 98, isStable: false, baseHalfLife: 24, color: '#ff1744' }, // 15 * 1.6 = 24
  44: { atomicNumber: 44, symbol: 'Ru', name: 'Ruthenium', weight: 101, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  45: { atomicNumber: 45, symbol: 'Rh', name: 'Rhodium', weight: 103, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  46: { atomicNumber: 46, symbol: 'Pd', name: 'Palladium', weight: 106, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  47: { atomicNumber: 47, symbol: 'Ag', name: 'Silver', weight: 108, isStable: true, baseHalfLife: null, color: '#e0e0e0' },
  48: { atomicNumber: 48, symbol: 'Cd', name: 'Cadmium', weight: 112, isStable: true, baseHalfLife: null, color: '#40c4ff' },
  49: { atomicNumber: 49, symbol: 'In', name: 'Indium', weight: 115, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  50: { atomicNumber: 50, symbol: 'Sn', name: 'Tin', weight: 119, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  51: { atomicNumber: 51, symbol: 'Sb', name: 'Antimony', weight: 122, isStable: true, baseHalfLife: null, color: '#64ffda' },
  52: { atomicNumber: 52, symbol: 'Te', name: 'Tellurium', weight: 128, isStable: true, baseHalfLife: null, color: '#64ffda' },
  53: { atomicNumber: 53, symbol: 'I', name: 'Iodine', weight: 127, isStable: true, baseHalfLife: null, color: '#69f0ae' },
  54: { atomicNumber: 54, symbol: 'Xe', name: 'Xenon', weight: 131, isStable: true, baseHalfLife: null, color: '#b388ff' },
  55: { atomicNumber: 55, symbol: 'Cs', name: 'Cesium', weight: 133, isStable: true, baseHalfLife: null, color: '#ff5252' },
  56: { atomicNumber: 56, symbol: 'Ba', name: 'Barium', weight: 137, isStable: true, baseHalfLife: null, color: '#ffab40' },
  57: { atomicNumber: 57, symbol: 'La', name: 'Lanthanum', weight: 139, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  58: { atomicNumber: 58, symbol: 'Ce', name: 'Cerium', weight: 140, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  59: { atomicNumber: 59, symbol: 'Pr', name: 'Praseodymium', weight: 141, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  60: { atomicNumber: 60, symbol: 'Nd', name: 'Neodymium', weight: 144, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  61: { atomicNumber: 61, symbol: 'Pm', name: 'Promethium', weight: 145, isStable: false, baseHalfLife: 19, color: '#ff1744' }, // 12 * 1.6 ≈ 19
  62: { atomicNumber: 62, symbol: 'Sm', name: 'Samarium', weight: 150, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  63: { atomicNumber: 63, symbol: 'Eu', name: 'Europium', weight: 152, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  64: { atomicNumber: 64, symbol: 'Gd', name: 'Gadolinium', weight: 157, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  65: { atomicNumber: 65, symbol: 'Tb', name: 'Terbium', weight: 159, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  66: { atomicNumber: 66, symbol: 'Dy', name: 'Dysprosium', weight: 163, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  67: { atomicNumber: 67, symbol: 'Ho', name: 'Holmium', weight: 165, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  68: { atomicNumber: 68, symbol: 'Er', name: 'Erbium', weight: 167, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  69: { atomicNumber: 69, symbol: 'Tm', name: 'Thulium', weight: 169, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  70: { atomicNumber: 70, symbol: 'Yb', name: 'Ytterbium', weight: 173, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  71: { atomicNumber: 71, symbol: 'Lu', name: 'Lutetium', weight: 175, isStable: true, baseHalfLife: null, color: '#f48fb1' },
  72: { atomicNumber: 72, symbol: 'Hf', name: 'Hafnium', weight: 178, isStable: true, baseHalfLife: null, color: '#18ffff' },
  73: { atomicNumber: 73, symbol: 'Ta', name: 'Tantalum', weight: 181, isStable: true, baseHalfLife: null, color: '#18ffff' },
  74: { atomicNumber: 74, symbol: 'W', name: 'Tungsten', weight: 184, isStable: true, baseHalfLife: null, color: '#18ffff' },
  75: { atomicNumber: 75, symbol: 'Re', name: 'Rhenium', weight: 186, isStable: true, baseHalfLife: null, color: '#18ffff' },
  76: { atomicNumber: 76, symbol: 'Os', name: 'Osmium', weight: 190, isStable: true, baseHalfLife: null, color: '#18ffff' },
  77: { atomicNumber: 77, symbol: 'Ir', name: 'Iridium', weight: 192, isStable: true, baseHalfLife: null, color: '#18ffff' },
  78: { atomicNumber: 78, symbol: 'Pt', name: 'Platinum', weight: 195, isStable: true, baseHalfLife: null, color: '#18ffff' },
  79: { atomicNumber: 79, symbol: 'Au', name: 'Gold', weight: 197, isStable: true, baseHalfLife: null, color: '#ffc107' },
  80: { atomicNumber: 80, symbol: 'Hg', name: 'Mercury', weight: 201, isStable: true, baseHalfLife: null, color: '#18ffff' },
  81: { atomicNumber: 81, symbol: 'Tl', name: 'Thallium', weight: 204, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  82: { atomicNumber: 82, symbol: 'Pb', name: 'Lead', weight: 207, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  83: { atomicNumber: 83, symbol: 'Bi', name: 'Bismuth', weight: 209, isStable: true, baseHalfLife: null, color: '#b0bec5' },
  84: { atomicNumber: 84, symbol: 'Po', name: 'Polonium', weight: 209, isStable: false, baseHalfLife: 16, color: '#ff1744' }, // 10 * 1.6 = 16
  85: { atomicNumber: 85, symbol: 'At', name: 'Astatine', weight: 210, isStable: false, baseHalfLife: 13, color: '#ff1744' }, // 8 * 1.6 ≈ 13
  86: { atomicNumber: 86, symbol: 'Rn', name: 'Radon', weight: 222, isStable: false, baseHalfLife: 13, color: '#ff1744' }, // 8 * 1.6 ≈ 13
  87: { atomicNumber: 87, symbol: 'Fr', name: 'Francium', weight: 223, isStable: false, baseHalfLife: 10, color: '#ff1744' }, // 6 * 1.6 ≈ 10
  88: { atomicNumber: 88, symbol: 'Ra', name: 'Radium', weight: 226, isStable: false, baseHalfLife: 10, color: '#ff1744' }, // 6 * 1.6 ≈ 10
  89: { atomicNumber: 89, symbol: 'Ac', name: 'Actinium', weight: 227, isStable: false, baseHalfLife: 8, color: '#ff1744' }, // 5 * 1.6 = 8
  90: { atomicNumber: 90, symbol: 'Th', name: 'Thorium', weight: 232, isStable: false, baseHalfLife: 8, color: '#ff1744' }, // 5 * 1.6 = 8
  91: { atomicNumber: 91, symbol: 'Pa', name: 'Protactinium', weight: 231, isStable: false, baseHalfLife: 6, color: '#ff1744' }, // 4 * 1.6 ≈ 6
  92: { atomicNumber: 92, symbol: 'U', name: 'Uranium', weight: 238, isStable: false, baseHalfLife: 6, color: '#76ff03' }, // 4 * 1.6 ≈ 6, Uranium is green for win!
};

// Special "waste" block that cannot fuse
export const WASTE_ELEMENT: ElementData = {
  atomicNumber: 0,
  symbol: '☢',
  name: 'Isotope Waste',
  weight: 50,
  isStable: true,
  baseHalfLife: null,
  color: '#424242',
};

// Cell type for the game board
export interface Cell {
  element: ElementData;
  halfLife: number | null; // Current remaining half-life in seconds
  id: string; // Unique ID for tracking
}

// Create a new cell from atomic number
export function createCell(atomicNumber: number): Cell {
  const element = ELEMENTS[atomicNumber] || WASTE_ELEMENT;
  return {
    element,
    halfLife: element.baseHalfLife,
    id: `${atomicNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Create a waste cell
export function createWasteCell(): Cell {
  return {
    element: WASTE_ELEMENT,
    halfLife: null,
    id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Check if element is unstable
export function isUnstable(atomicNumber: number): boolean {
  return UNSTABLE_ELEMENTS.has(atomicNumber) || atomicNumber > 82;
}

// Get element by atomic number
export function getElement(atomicNumber: number): ElementData | null {
  return ELEMENTS[atomicNumber] || null;
}

// Get maximum atomic number (Uranium)
export const MAX_ATOMIC_NUMBER = 92;

// Stage configuration per GDD
export interface StageConfig {
  name: string;
  targetElement: number;
  spawnPool: number[]; // Atomic numbers that can spawn
  description: string;
}

export const STAGES: StageConfig[] = [
  {
    name: 'Hydrogen Age',
    targetElement: 2, // He
    spawnPool: [1], // Only H spawns
    description: 'Fuse Hydrogen to create Helium',
  },
  {
    name: 'Stellar Age',
    targetElement: 6, // C
    spawnPool: [1, 1, 2], // H and He (weighted towards H)
    description: 'Use Alpha Process to reach Carbon',
  },
  {
    name: 'Supernova',
    targetElement: 26, // Fe
    spawnPool: [1, 2, 4], // H, He, Be
    description: 'Forge Iron',
  },
  {
    name: 'Radioactive',
    targetElement: 92, // U
    spawnPool: [2, 4, 6, 12, 26], // He, Be, C, Mg, Fe - elements up to Iron
    description: 'Synthesize Uranium to win!',
  },
];

// Get current stage based on highest element synthesized
export function getCurrentStage(highestElement: number): StageConfig {
  if (highestElement >= 26) return STAGES[3]; // Radioactive
  if (highestElement >= 6) return STAGES[2]; // Supernova
  if (highestElement >= 2) return STAGES[1]; // Stellar Age
  return STAGES[0]; // Hydrogen Age
}

// Get spawn element based on current stage
export function getSpawnElement(stage: StageConfig): number {
  const pool = stage.spawnPool;
  return pool[Math.floor(Math.random() * pool.length)];
}
