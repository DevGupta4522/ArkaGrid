-- P2P Neighbourhood Energy Trading Platform
-- Seed Data (SQL version — use setup.js for proper bcrypt hashes)

-- Truncate all tables first
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE meter_readings CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE trades CASCADE;
TRUNCATE TABLE energy_listings CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================
-- NOTE: The password hashes below are bcrypt hashes generated with salt rounds 12.
-- 
-- Test accounts:
--   prosumer1@test.com  / Test@123
--   prosumer2@test.com  / Test@123
--   consumer1@test.com  / Test@123
--   consumer2@test.com  / Test@123
--   admin@test.com      / Admin@123
--
-- IMPORTANT: For fresh setups, prefer running `npm run db:setup` which 
-- generates proper bcrypt hashes at runtime via setup.js.
-- This SQL file serves as a reference / backup.
-- ============================================

-- Insert Users (hashes generated with bcrypt, salt=12)
-- Hash for 'Test@123':  $2b$12$LJ1xBvOhQPc3v14hPrKMeOmMHVSaIzQn.SsBmiCSZBPAE3qlXVHG.
-- Hash for 'Admin@123': $2b$12$rV0lEf.WGDqvYPpMqfMI0uVKVZHC19XBvdPV.WfJHGkZBpmEYSTNi

INSERT INTO users (name, email, phone, password_hash, role, kyc_verified, wallet_balance) VALUES
('Prosumer One',  'prosumer1@test.com', '9876543210', '$2b$12$LJ1xBvOhQPc3v14hPrKMeOmMHVSaIzQn.SsBmiCSZBPAE3qlXVHG.', 'prosumer', true,  500.00),
('Prosumer Two',  'prosumer2@test.com', '9876543211', '$2b$12$LJ1xBvOhQPc3v14hPrKMeOmMHVSaIzQn.SsBmiCSZBPAE3qlXVHG.', 'prosumer', true, 1000.00),
('Consumer One',  'consumer1@test.com', '9876543212', '$2b$12$LJ1xBvOhQPc3v14hPrKMeOmMHVSaIzQn.SsBmiCSZBPAE3qlXVHG.', 'consumer', false, 5000.00),
('Consumer Two',  'consumer2@test.com', '9876543213', '$2b$12$LJ1xBvOhQPc3v14hPrKMeOmMHVSaIzQn.SsBmiCSZBPAE3qlXVHG.', 'consumer', false, 3000.00),
('Admin User',    'admin@test.com',     '9876543214', '$2b$12$rV0lEf.WGDqvYPpMqfMI0uVKVZHC19XBvdPV.WfJHGkZBpmEYSTNi', 'admin',    true,    0.00);

-- Insert 3 sample energy listings from Prosumer One
-- (Using subquery to get prosumer1's UUID dynamically)
INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
SELECT id, 10.00, 6.50, 10.00, NOW(), NOW() + INTERVAL '1 day', 28.7041000, 77.1025000
FROM users WHERE email = 'prosumer1@test.com';

INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
SELECT id, 5.00, 5.50, 5.00, NOW(), NOW() + INTERVAL '2 days', 28.7041000, 77.1025000
FROM users WHERE email = 'prosumer1@test.com';

INSERT INTO energy_listings (prosumer_id, units_available, price_per_unit, units_remaining, available_from, available_until, latitude, longitude)
SELECT id, 15.00, 7.00, 15.00, NOW(), NOW() + INTERVAL '1 day', 28.7041000, 77.1025000
FROM users WHERE email = 'prosumer1@test.com';
