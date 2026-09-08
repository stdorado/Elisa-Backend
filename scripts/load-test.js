const http = require('http');
const https = require('https');

const BASE_URL = process.argv[2] ||
  'https://elisa-backend-82w840tsu-stdorados-projects.vercel.app';

const ZONAS = [
  'centro', 'banco', 'padel', 'tero',
  'san-ceferino', 'polideportivo', 'boulevard', 'clubes'
];

function randomZona() {
  return ZONAS[Math.floor(Math.random() * ZONAS.length)];
}

function hacerRequest() {
  return new Promise((resolve) => {
    const body = JSON.stringify({ zona: randomZona() });
    const url = new URL('/api/scan', BASE_URL);
    const client = url.protocol === 'http:' ? http : https;

    const options = {
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = client.request(options, (res) => {
      resolve({ status: res.statusCode });
    });

    req.on('error', () => resolve({ status: 'error' }));
    req.write(body);
    req.end();
  });
}

async function correrEscenario(nombre, total, concurrencia) {
  console.log(`\n━━━ ${nombre}: ${total} peticiones (${concurrencia} simultáneas) ━━━`);

  const inicio = Date.now();
  let completadas = 0;
  const resultados = { 200: 0, 429: 0, error: 0 };

  for (let i = 0; i < total; i += concurrencia) {
    const batch = Math.min(concurrencia, total - i);
    const promises = Array.from({ length: batch }, () => hacerRequest());
    const res = await Promise.all(promises);

    res.forEach(r => {
      resultados[r.status] = (resultados[r.status] || 0) + 1;
      completadas++;
    });

    if (completadas % 500 === 0 || completadas === total) {
      process.stdout.write(`\r  Progreso: ${completadas}/${total}`);
    }
  }

  const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
  const rps = (total / duracion).toFixed(0);

  console.log(`\n\n  Resultados:`);
  console.log(`  Exitosas (200):     ${resultados[200] || 0}`);
  console.log(`  Rate limited (429): ${resultados[429] || 0}`);
  console.log(`  Errores:            ${resultados.error || 0}`);
  console.log(`  Duración:           ${duracion}s`);
  console.log(`  Requests/segundo:   ${rps} rps`);

  return resultados;
}

async function main() {
  const escenarios = (process.env.LOAD_TEST_SCENARIOS || '1000:50')
    .split(',')
    .map(s => {
      const [total, concurrencia] = s.split(':').map(Number);
      return { total, concurrencia };
    });

  console.log('ELISA — Load Test');
  console.log(`Servidor: ${BASE_URL}`);
  console.log('━'.repeat(50));

  for (const [idx, { total, concurrencia }] of escenarios.entries()) {
    await correrEscenario(`Escenario ${idx + 1}`, total, concurrencia);
    if (idx < escenarios.length - 1) {
      console.log('\nPausa 10s entre escenarios...');
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  console.log('\n\nLoad test completo');
  console.log('━'.repeat(50));
  console.log('Revisá Supabase para ver los registros generados.');
  console.log('Acordate de limpiar la DB después si corresponde.');
}

main().catch(console.error);
