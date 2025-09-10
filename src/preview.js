import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// Store reference to button handler (will be set by main app)
let buttonHandler = null;

export function setButtonHandler(handler) {
	buttonHandler = handler;
}

http
	.createServer((req, res) => {
		// Handle button actions
		if (req.url.startsWith("/api/button/")) {
			const action = req.url.split("/api/button/")[1];
			if (buttonHandler && ['back', 'playpause', 'forward'].includes(action)) {
				buttonHandler(action);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ success: true, action }));
			} else {
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ success: false, error: "Invalid action" }));
			}
			return;
		}
		
		if (req.url === "/" || req.url === "/index.html") {
			// Serve the main interface with both controls and flipdot display
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flipdot Display</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            gap: 30px;
        }
        .controls {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        button {
            width: 50px;
            height: 50px;
            background-color: #333;
            color: #fff;
            border: 2px solid #555;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s ease;
        }
        button:hover {
            background-color: #555;
            transform: scale(1.1);
        }
        button:active {
            transform: scale(0.95);
        }
        .live-preview {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
            transform: scale(3);
            transform-origin: center;
        }
    </style>
</head>
<body>
    <div class="controls">
        <button onclick="sendButtonAction('back')">⏮</button>
        <button onclick="sendButtonAction('playpause')">⏯</button>
        <button onclick="sendButtonAction('forward')">⏭</button>
    </div>
    <img id="liveFrame" class="live-preview" src="/frame.png">
    
    <script>
        // Send button action to server
        async function sendButtonAction(action) {
            try {
                const response = await fetch('/api/button/' + action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log('Button action "' + action + '" sent successfully');
                } else {
                    console.error('Button action failed:', result.error);
                }
            } catch (error) {
                console.error('Error sending button action:', error);
            }
        }

        // Live preview update
        function updateLiveFrame() {
            document.getElementById('liveFrame').src = '/frame.png?t=' + Date.now();
            requestAnimationFrame(updateLiveFrame);
        }

        // Initialize
        updateLiveFrame();
    </script>
</body>
</html>
    `);
		} else if (req.url.startsWith("/frame.png")) {
			res.writeHead(200, { "Content-Type": "image/png" });
			res.end(fs.readFileSync("./output/frame.png"));
		} else {
			// 404 for other routes
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not Found");
		}
	})
	.listen(3000);
