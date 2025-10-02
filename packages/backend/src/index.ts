// src/index.ts (o el entry que uses)
import { app } from './server';
const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API escuchando en http://pruebas:${PORT}`);
});
