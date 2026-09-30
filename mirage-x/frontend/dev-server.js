import { createServer } from 'vite';

async function start() {
  const server = await createServer({
    configFile: './vite.config.js',
    server: {
      host: '127.0.0.1',
      port: 5173,
    }
  });
  await server.listen();
  server.printUrls();

  // Keep process alive indefinitely without depending on stdin
  setInterval(() => {}, 1000 * 60 * 60);
}

start().catch(err => {
  console.error('Failed to start Vite server:', err);
  process.exit(1);
});
