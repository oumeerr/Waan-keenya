export const COLORS = {
  primary: '#2563EB',
  action: '#F97316',
  bg: '#FDFCFB',
  text: '#0F172A',
  muted: '#64748B',
};

export const ETHIOPIAN_BANKS = [
  "Telebirr",
  "CBE Birr",
  "E-Birr",
  "M-Pesa",
  "Kacha",
  "Commercial Bank of Ethiopia (CBE)",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Wegagen Bank",
  "United Bank",
  "Nib International Bank",
  "Cooperative Bank of Oromia",
  "Zemen Bank",
  "Oromia International Bank",
  "Bunna Bank",
  "Berhan Bank",
  "Abay Bank",
  "Addis International Bank",
  "Debub Global Bank",
  "Enat Bank",
  "Hijra Bank",
  "Zad Bank",
  "Amana Bank"
];

export const BET_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];
export const MINI_BET_AMOUNTS = [5, 10, 15, 20, 25, 50, 100];

export const TRANSLATIONS: Record<string, any> = {
  en: {
    home: 'Home',
    wallet: 'Wallet',
    leaderboard: 'Hall of Fame',
    howToPlay: 'Guide',
    history: 'History',
    play: 'Play Now',
    stake: 'Stake',
    exit: 'Back',
    balance: 'Balance',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    transfer: 'Transfer',
    settings: 'Settings',
  },
  am: {
    home: 'ዋና ገጽ',
    wallet: 'ኪሴ',
    leaderboard: 'ደረጃዎች',
    howToPlay: 'እንዴት ይጫወታል',
    history: 'ታሪኬ',
    play: 'ተጫወት',
    stake: 'እወራረዳለሁ',
    exit: 'ተመለስ',
    balance: 'ያለኝ ብር',
    deposit: 'ብር አስገባ',
    withdraw: 'ብር አውጣ',
    transfer: 'ብር ላክ',
    settings: 'መቼቶች',
  }
};

/**
 * Seeded PRNG (Mulberry32) to ensure hard, unique combinations.
 */
const createRNG = (seed: number) => {
  return () => {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const generateCard = (id: number): number[][] => {
  // Use a unique salt for classic cards
  const rng = createRNG(id + 13371337);
  const card: number[][] = Array(5).fill(0).map(() => Array(5).fill(0));

  for (let col = 0; col < 5; col++) {
    const min = col * 15 + 1;
    const max = (col + 1) * 15;
    // Create pool for this column
    const pool = Array.from({ length: 15 }, (_, i) => min + i);
    
    // Shuffle pool using the seeded RNG
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Pick 5 numbers from shuffled pool
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        card[row][col] = 0; // Free space
        continue;
      }
      card[row][col] = pool[row];
    }
  }
  return card;
};

export const generateMiniCard = (id: number): number[][] => {
  // Use a unique salt for mini cards
  const rng = createRNG(id + 777777);
  const pool = Array.from({ length: 30 }, (_, i) => i + 1);

  // Robust seeded shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const card: number[][] = Array(3).fill(0).map(() => Array(3).fill(0));
  let idx = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (row === 1 && col === 1) {
        card[row][col] = 0; // Free space
        continue;
      }
      card[row][col] = pool[idx++];
    }
  }
  return card;
};