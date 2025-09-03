import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 3000;

function sendFile(res, filePath, contentType) {
	try {
		const data = fs.readFileSync(filePath);
		res.writeHead(200, { "Content-Type": contentType });
		res.end(data);
	} catch (err) {
		if (err.code === "ENOENT") {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not found");
		} else {
			res.writeHead(500, { "Content-Type": "text/plain" });
			res.end("Server error");
		}
	}
}

http
	.createServer((req, res) => {
		if (req.url === "/view") {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
<html>
<body style="margin:0;background:#fff;display:flex;justify-content:center;align-items:center;height:100vh">
	<img id="frame" src="/frame.png" style="image-rendering:pixelated;max-width:100%;max-height:100%">
	<script>
		function updateFrame(time){
			document.getElementById('frame').src = '/frame.png?t=' + time;
			requestAnimationFrame(updateFrame);
		}
		requestAnimationFrame(updateFrame);
	</script>
</body>
</html>
`);
		} else if (req.url && req.url.startsWith("/frame.png")) {
			sendFile(res, path.resolve("./output/frame.png"), "image/png");
		} else if (req.url === "/upload-frame" && req.method === "POST") {
			const chunks = [];
			req.on("data", (c) => chunks.push(c));
			req.on("end", () => {
				try {
					const buffer = Buffer.concat(chunks);
					fs.writeFileSync(path.resolve("./output/frame.png"), buffer);
					res.writeHead(200, { "Content-Type": "text/plain" });
					res.end("OK");
				} catch (err) {
					res.writeHead(500, { "Content-Type": "text/plain" });
					res.end("Server error");
				}
			});
		} else if (req.url === "/doom.html") {
			sendFile(res, path.resolve("./doom.html"), "text/html; charset=utf-8");
		} else if (req.url === "/DOOM.zip") {
			sendFile(res, path.resolve("./DOOM.zip"), "application/zip");
		} else {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
<html>
<body style="font-family:Arial, sans-serif; padding:16px">
	<h3>Flipdots Preview Server</h3>
	<ul>
		<li><a href="/view">/view</a> — flipboard preview (auto-refreshing)</li>
		<li><a href="/doom.html">/doom.html</a> — run DOOM in the browser (js-dos)</li>
	</ul>
</body>
</html>
`);
		}
	})
	.listen(PORT, () => {
		// eslint-disable-next-line no-console
		console.log(`Preview server listening on http://localhost:${PORT}`);
	});


