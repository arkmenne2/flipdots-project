import { captureConfig, boardConfig, transportConfig } from './config.js';
import { captureRoomFrames } from './captureRoom.js';
import { encodeForFlipdot } from './flipdotEncoder.js';
import { dispatchFrame } from './flipdotTransport.js';

async function run() {
  const captured = await captureRoomFrames({
    ...captureConfig,
    outputDir: 'frames'
  });

  for (const frame of captured) {
    const payload = await encodeForFlipdot(frame.buffer, boardConfig);
    await dispatchFrame(payload, { transport: boardConfig.transport, transportConfig });
    console.log(`Sent frame ${frame.index} (${payload.length} bytes)`);
  }

  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

