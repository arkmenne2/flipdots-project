# Flipdot Room Streamer

This service captures the Three.js `room.html` scene hosted at [`flipdots-project.vercel.app`](https://flipdots-project.vercel.app/) and keeps a 15 FPS pipeline running that:

1. Screenshots the scene with Puppeteer
2. Stores every PNG into `./frames/live`
3. Streams the downsampled data to your flipdot controller
4. Mirrors the live feed on `http://localhost:4000`

## How it works

1. **`captureRoom.js`** opens the published `room.html` in a headless Chromium session via Puppeteer and records a burst of screenshots.
2. **`flipdotEncoder.js`** downsamples each PNG with `sharp`, applies a brightness threshold, and packs the binary pixels into bytes sized for your board.
3. **`flipdotTransport.js`** sends those bytes to a TCP- or HTTP-based flipdot gateway.
4. **`server.js`** exposes `/api/push-room` so you can trigger a fresh capture remotely. Everything runs server-side—no browser or client JavaScript is required on the trigger side.

## Getting started

```bash
npm install
FLIPDOT_TCP_HOST=10.0.0.42 \
FLIPDOT_WIDTH=84 \
FLIPDOT_HEIGHT=28 \
npm start
```

Navigate to `http://localhost:4000` for the live preview. PNGs are saved inside `frames/live`, and the latest frame is available at `http://localhost:4000/frames/latest.png`.

POST to `http://localhost:4000/api/push-room` to force a manual burst capture (outside of the live loop):

```bash
curl -X POST http://localhost:4000/api/push-room \
  -H 'content-type: application/json' \
  -d '{"frames":6,"frameDelayMs":200,"saveFramesTo":"frames/latest"}'
```

Use `npm run capture:manual` for an offline test run; frames land in `./frames`.

## Configuration

Environment variables override the defaults defined in `src/config.js`:

| Variable | Default | Description |
| --- | --- | --- |
| `ROOM_URL` | Vercel `room.html` | Hosted scene to capture |
| `CAPTURE_SELECTOR` | `#v` | CSS selector for the canvas to screenshot |
| `FRAME_RATE` | 15 | Live capture frame rate (FPS) |
| `FRAME_DELAY_MS` | `1000 / FRAME_RATE` | Used by manual captures |
| `FRAME_OUTPUT_DIR` | `frames/live` | Where live PNGs are stored |
| `FRAME_RETAIN_COUNT` | 450 | How many live PNGs to keep on disk |
| `FRAMES` | 8 | Number of screenshots to take (manual) |
| `FLIPDOT_WIDTH`/`HEIGHT` | 28×28 | Board resolution |
| `FLIPDOT_THRESHOLD` | 128 | Brightness cut-off (0–255) |
| `FLIPDOT_TRANSPORT` | `tcp` | Transport (`tcp` or `http`) |
| `FLIPDOT_TCP_HOST`/`PORT` | `192.168.1.50:9999` | TCP controller |
| `FLIPDOT_HTTP_URL` | `http://localhost:8080/frame` | HTTP gateway endpoint |

## Notes

- The default `ROOM_URL` mirrors the live Flipdots Vercel preview so you see the exact motion path that's showcased online, and `CAPTURE_SELECTOR` zooms in on the canvas only.
- The live loop defaults to 15 FPS to match the flipboard preview; raise `FRAME_RATE` carefully to avoid starving Puppeteer or your transport.
- Save raw PNGs (`saveFramesTo` or `FRAME_OUTPUT_DIR`) to inspect dithering quality before sending them to real hardware.

