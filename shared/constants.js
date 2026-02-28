// User Roles
export const USER_ROLES = {
  PROSUMER: 'prosumer',
  CONSUMER: 'consumer',
  ADMIN: 'admin'
};

// Trade Status
export const TRADE_STATUS = {
  PENDING: 'pending',
  DELIVERING: 'delivering',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISPUTED: 'disputed'
};

// Escrow Status
export const ESCROW_STATUS = {
  LOCKED: 'locked',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  PARTIAL: 'partial'
};

// Listing Status
export const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

// Meter Reading Types
export const METER_READING_TYPE = {
  OUTGOING: 'outgoing',
  INCOMING: 'incoming'
};

// Meter Reading Sources
export const METER_READING_SOURCE = {
  SMART_METER: 'smart_meter',
  MANUAL: 'manual',
  SIMULATED: 'simulated'
};

// Platform Configuration
export const PLATFORM_CONFIG = {
  PLATFORM_FEE_PERCENT: 2.5,
  DELIVERY_TIMEOUT_MINUTES: 60,
  DELIVERY_CONFIRMATION_THRESHOLD: 0.98, // 98% threshold for delivery confirmation
  MIN_PASSWORD_LENGTH: 8,
  PHONE_LENGTH: 10,
  MAX_PRICE_PER_UNIT: 15,
  MAX_ADD_FUNDS: 10000
};
