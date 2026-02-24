/**
 * Mock data generator: 50 solar-prosumers and chargers in Jaipur.
 * Run: npm run mock:seed
 * Output: public/mock-chargers.json (and optionally public/mock-prosumers.json)
 */

import * as fs from "fs";
import * as path from "path";

const JAIPUR_CENTER = { lat: 26.9124, lng: 75.7873 };
const JAIPUR_RADIUS_DEG = 0.08;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const CONNECTOR_TYPES = ["type2", "ccs2", "chademo", "bhārāt_ac"] as const;
const SPEEDS = ["ac_slow", "ac_fast", "dc_fast", "dc_ultra"] as const;
const NAMES = [
  "Sunrise EV Point",
  "Arka Station 1",
  "Jaipur Solar Hub",
  "Pink City Charge",
  "Rajasthan Power",
  "EV Park C-Scheme",
  "Malviya Nagar Charger",
  "Vaishali Station",
  "Sitapura Industrial",
  "Jawahar Circle Point",
  "Mansarovar EV",
  "Ajmer Road Fast",
  "MI Road CCS2",
  "Bani Park Solar",
  "Sodala Charger",
  "Kukas Highway",
  "Tonk Road Station",
  "Vidyadhar Nagar",
  "Pratap Nagar EV",
  "Shyam Nagar Charge",
  "Gopalpura Bypass",
  "Sanganer Airport",
  "B2B Circle Point",
  "Nirman Nagar",
  "Shastri Nagar EV",
  "Civil Lines DC",
  "Arka Fort Area",
  "Narayan Singh Circle",
  "Gandhi Nagar Solar",
  "Hawa Mahal Zone",
  "Chandpole EV",
  "Bapu Nagar Charge",
  "Lal Kothi Station",
  "Sindhi Camp",
  "Raja Park Point",
  "Shanti Path EV",
  "Jhotwara Charger",
  "Murlipura Station",
  "Bassi Solar Hub",
  "Kalwar Road EV",
  "Bagru Charge",
  "Chaksu Road",
  "Bassi Industrial",
  "Vatika EV Point",
  "Mahapura Station",
  "Durgapura Charge",
  "Dholai Sabzi",
  "Jagatpura Solar",
  "Shipra Path EV",
  "Ganesh Nagar Charge",
];

function randomConnector(): (typeof CONNECTOR_TYPES)[number] {
  return CONNECTOR_TYPES[Math.floor(Math.random() * CONNECTOR_TYPES.length)];
}

function randomSpeed(): (typeof SPEEDS)[number] {
  return SPEEDS[Math.floor(Math.random() * SPEEDS.length)];
}

interface ChargerRecord {
  id: string;
  host_id: string;
  name: string;
  connector_type: string;
  speed: string;
  latitude: number;
  longitude: number;
  address: string | null;
  price_per_kwh_cents: number;
  is_available: boolean;
  max_power_kw: number;
  created_at: string;
  updated_at: string;
}

interface ProsumerRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacity_kw: number;
}

function generateChargers(count: number): { chargers: ChargerRecord[]; prosumers: ProsumerRecord[] } {
  const chargers: ChargerRecord[] = [];
  const prosumers: ProsumerRecord[] = [];
  const usedNames = new Set<string>();
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    const hostId = uuid();
    const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${i + 1}` : "");
    const lat = JAIPUR_CENTER.lat + randomInRange(-JAIPUR_RADIUS_DEG, JAIPUR_RADIUS_DEG);
    const lng = JAIPUR_CENTER.lng + randomInRange(-JAIPUR_RADIUS_DEG, JAIPUR_RADIUS_DEG);
    const price = Math.round(randomInRange(450, 750));
    const maxPower = [7.4, 11, 22, 50, 60, 120][Math.floor(Math.random() * 6)];

    chargers.push({
      id: uuid(),
      host_id: hostId,
      name,
      connector_type: randomConnector(),
      speed: randomSpeed(),
      latitude: lat,
      longitude: lng,
      address: `Sector ${i + 1}, Jaipur, Rajasthan`,
      price_per_kwh_cents: price,
      is_available: Math.random() > 0.35,
      max_power_kw: maxPower,
      created_at: now,
      updated_at: now,
    });

    prosumers.push({
      id: hostId,
      name: `Prosumer ${i + 1}`,
      latitude: lat,
      longitude: lng,
      capacity_kw: Math.round(randomInRange(3, 15) * 10) / 10,
    });
  }

  return { chargers, prosumers };
}

function main() {
  const { chargers, prosumers } = generateChargers(50);
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(
    path.join(publicDir, "mock-chargers.json"),
    JSON.stringify(chargers, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(publicDir, "mock-prosumers.json"),
    JSON.stringify(prosumers, null, 2),
    "utf-8"
  );

  console.log("Generated 50 chargers and 50 prosumers in Jaipur.");
  console.log("  - public/mock-chargers.json");
  console.log("  - public/mock-prosumers.json");
  console.log("Load mock data on the Map page via the 'Load mock data' button, or set localStorage key arka-mock-chargers.");
}

main();
