
/**
 * Centralized Application Configuration
 * All business logic constants and game parameters are defined here.
 */

export const APP_CONFIG = {
  GAME: {
    MATCHMAKING_SECONDS: 60, // Match start time set to 1 minute
    CALL_INTERVAL_CLASSIC_MS: 2000,
    CALL_INTERVAL_MINI_MS: 1500,
    HOUSE_FEE_PERCENT: 0.20, // 20% house fee as per promotion guide
    MAX_CARDS_PER_SESSION: 3, // Enforced 3 card limit
    TOTAL_CARDS_AVAILABLE: 150,
  },
  WALLET: {
    WITHDRAWAL_START_HOUR: 3, // 3 AM
    WITHDRAWAL_END_HOUR: 18,  // 6 PM
    MIN_WITHDRAWAL_ETB: 100,
    DEPOSIT_PHONES: {
      STANDARD: ["0939814648", "0909565353"], // Telebirr & CBE
      MERCHANT: ["0928157002"] // Ebirr & Kacha
    },
    TRANSFER_FEE_PERCENT: 0.05, // 5% P2P transfer charge
  },
  AFFILIATE: {
    REFERRAL_COMMISSION_PERCENT: 0.05, // 5% commission
  },
  PRIZE: {
    WEEKLY_POOL_ETB: 10000,
  }
};
