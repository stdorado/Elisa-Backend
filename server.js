require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 8080;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
  });
}

module.exports = app;
