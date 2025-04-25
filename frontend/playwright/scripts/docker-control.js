const { exec } = require('child_process');

async function startDocker() {
  console.log('Starting Docker containers...');
  try {
    await new Promise((resolve, reject) => {
      exec('docker-compose -f ../../backend/docker-compose.yml up -d', { cwd: process.cwd() }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await waitForBackend();
    console.log('Docker containers started.');
  } catch (err) {
    console.error('Failed to start Docker:', err);
    throw err;
  }
}

async function stopDocker() {
  console.log('Stopping Docker containers...');
  try {
    await new Promise((resolve, reject) => {
      exec('docker-compose -f ../../backend/docker-compose.yml down', { cwd: process.cwd() }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log('Docker containers stopped.');
  } catch (err) {
    console.error('Failed to stop Docker:', err);
    throw err;
  }
}

async function waitForBackend() {
  const maxAttempts = 30;
  const delay = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:8080/api/events');
      if (response.ok) return;
    } catch (err) {
      // Ignore errors during startup
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('Backend did not start in time');
}

module.exports = { startDocker, stopDocker };
