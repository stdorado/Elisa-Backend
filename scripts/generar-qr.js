require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

const { ZONAS_VALIDAS } = require('../middleware/validate');

if (!process.env.HMAC_SECRET) {
  console.error('✗ Falta HMAC_SECRET en el .env — no se pueden firmar los QRs');
  process.exit(1);
}

function generarToken(zona) {
  return crypto
    .createHmac('sha256', process.env.HMAC_SECRET)
    .update(zona)
    .digest('hex');
}

const ZONAS = [
  { id: 'centro', label: 'El Centro' },
  { id: 'banco', label: 'Banco / Municipio' },
  { id: 'padel', label: 'Canchas de Pádel' },
  { id: 'tero', label: 'Barrio El Tero' },
  { id: 'san-ceferino', label: 'Barrio San Ceferino' },
  { id: 'polideportivo', label: 'Polideportivo' },
  { id: 'boulevard', label: 'El Boulevard' },
  { id: 'clubes', label: 'Los Clubes' },
];

const idsDesincronizados = ZONAS.map((z) => z.id).filter(
  (id) => !ZONAS_VALIDAS.includes(id)
);
if (idsDesincronizados.length > 0) {
  console.error(
    `✗ Zonas fuera de la lista blanca (middleware/validate.js): ${idsDesincronizados.join(', ')}`
  );
  process.exit(1);
}

const opciones = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
};

const BASE_URL = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const OUTPUT_DIR = path.join(__dirname, '..', 'qr-codes');

function generarCardHTML({ label, url, base64 }) {
  return `    <div class="card">
      <img src="data:image/png;base64,${base64}" alt="QR ${label}">
      <div class="zona">${label}</div>
      <div class="url">${url}</div>
    </div>`;
}

const SELLO_SVG = `<svg viewBox="0 0 160 50" class="sello" role="img" aria-label="Sello Proyecto ELISA, Lezama 2026">
        <rect x="1" y="1" width="158" height="48" rx="3" fill="none" stroke="#000" stroke-width="1"/>
        <rect x="3.5" y="3.5" width="153" height="43" rx="2" fill="none" stroke="#000" stroke-width="0.4"/>
        <rect x="8" y="6" width="36" height="38" rx="2" fill="#000"/>
        <text x="26" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="500" fill="#fff">E</text>
        <text x="100" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" letter-spacing="2" fill="#555">PROYECTO</text>
        <text x="100" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="#000">ELISA</text>
        <line x1="52" y1="36" x2="148" y2="36" stroke="#000" stroke-width="0.4"/>
        <text x="100" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="7" letter-spacing="2" fill="#555">Lezama · 2026</text>
      </svg>`;

function generarCardImprimirHTML({ label, base64 }) {
  return `    <div class="card">
      <img src="data:image/png;base64,${base64}" alt="QR ${label}" class="qr">
      ${SELLO_SVG}
      <div class="zona">${label}</div>
    </div>`;
}

async function generarQRs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const cards = [];
  const cardsImprimir = [];

  for (const { id, label } of ZONAS) {
    const token = generarToken(id);
    const url = `${BASE_URL}/?zona=${id}&t=${token}`;
    const filePath = path.join(OUTPUT_DIR, `qr-${id}.png`);

    const buffer = await QRCode.toBuffer(url, opciones);
    fs.writeFileSync(filePath, buffer);

    const base64 = buffer.toString('base64');
    cards.push(generarCardHTML({ label, url, base64 }));
    cardsImprimir.push(generarCardImprimirHTML({ label, base64 }));

    console.log(`✓ qr-${id}.png → ${url}`);
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>QRs ELISA — Prueba</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #FAFAFA;
      padding: 32px;
    }
    h1 {
      font-size: 18px;
      color: #09090B;
      margin-bottom: 6px;
    }
    p {
      font-size: 13px;
      color: #71717A;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .card {
      background: white;
      border: 1px solid #E4E4E7;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .card img {
      width: 100%;
      max-width: 180px;
      height: auto;
    }
    .card .zona {
      font-size: 13px;
      font-weight: 600;
      color: #09090B;
      margin-top: 12px;
    }
    .card .url {
      font-size: 10px;
      color: #A1A1AA;
      font-family: monospace;
      margin-top: 4px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <h1>ELISA — Códigos QR de prueba</h1>
  <p>Escaneá cada QR con el celular para probar el flujo completo.</p>
  <div class="grid">
${cards.join('\n')}
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
  console.log('✓ index.html generado');

  const htmlImprimir = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>ELISA — QRs para imprimir</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #FFFFFF;
      padding: 24px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .toolbar h1 {
      font-size: 16px;
      color: #09090B;
    }
    .toolbar button {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #09090B;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
    }
    .toolbar button:hover {
      background: #27272A;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 9cm);
      grid-auto-rows: 9cm;
      gap: 0.5cm;
      justify-content: center;
    }
    .card {
      width: 9cm;
      height: 9cm;
      border: 1px solid #000;
      padding: 0.4cm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }
    .card .qr {
      width: 5.5cm;
      height: 5.5cm;
    }
    .card .sello {
      width: 5.5cm;
      height: auto;
    }
    .card .zona {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #000;
    }

    @media print {
      @page {
        size: A4;
        margin: 1cm;
      }
      body {
        padding: 0;
      }
      .toolbar {
        display: none;
      }
      .grid {
        gap: 0;
        justify-content: start;
      }
      .card {
        border: 1px solid #000;
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>ELISA — Códigos QR listos para imprimir (recortar en 9cm × 9cm)</h1>
    <button onclick="window.print()">Imprimir</button>
  </div>
  <div class="grid">
${cardsImprimir.join('\n')}
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'imprimir-qr.html'), htmlImprimir);
  console.log('✓ imprimir-qr.html generado');
}

generarQRs().catch((error) => {
  console.error('✗ Error generando QRs:', error.message);
  process.exit(1);
});
