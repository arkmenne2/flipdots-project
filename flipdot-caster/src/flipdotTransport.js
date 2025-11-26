import net from 'node:net';
import fetch from 'node-fetch';

export async function dispatchFrame(payload, { transport, transportConfig }) {
  if (transport === 'tcp') {
    return sendTcp(payload, transportConfig.tcp);
  }
  if (transport === 'http') {
    return sendHttp(payload, transportConfig.http);
  }
  throw new Error(`Unsupported transport: ${transport}`);
}

function sendTcp(payload, { host, port }) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write(payload);
      socket.end();
    });

    socket.on('error', (err) => reject(err));
    socket.on('close', () => resolve());
  });
}

async function sendHttp(payload, { url }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream' },
    body: payload
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP flipdot gateway responded with ${res.status}: ${body}`);
  }
}

