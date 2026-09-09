require('dotenv').config();
const crypto = require('crypto');

const ZONAS = [
  'centro','banco','padel','tero',
  'san-ceferino','polideportivo','boulevard','clubes'
];

console.log('\nTokens HMAC:\n');
ZONAS.forEach(zona => {
  const token = crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(zona)
    .digest('hex');
  console.log(`${zona}:`);
  console.log(`https://elisa-lezama.vercel.app/?zona=${zona}&t=${token}\n`);
});
