const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const { ZONAS_VALIDAS } = require('../middleware/validate');

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

async function generarQRs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const cards = [];

  for (const { id, label } of ZONAS) {
    const url = `${BASE_URL}/?zona=${id}`;
    const filePath = path.join(OUTPUT_DIR, `qr-${id}.png`);

    const buffer = await QRCode.toBuffer(url, opciones);
    fs.writeFileSync(filePath, buffer);

    cards.push(generarCardHTML({ label, url, base64: buffer.toString('base64') }));

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
}

generarQRs().catch((error) => {
  console.error('✗ Error generando QRs:', error.message);
  process.exit(1);
});
