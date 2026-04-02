import http from 'http';
import app from './app';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(Number(PORT), '::', () => {
  console.log(`[${new Date().toISOString()}] Server is running on http://[::]:${PORT}`);
});

// Heartbeat to verify logs are working
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Heartbeat - Server is alive`);
}, 10000);

// Keep process alive
setInterval(() => {}, 1000 * 60 * 60);
