import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Flipboard Slack API</title>
        <meta name="description" content="Slack app for uploading flipboard GitHub links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <h1>🎮 Flipboard Slack API</h1>
        <p className="subtitle">Next.js backend for Slack flipboard integration</p>
        
        <div className="features">
          <div className="feature-card">
            <h3>⚡ Slack Integration</h3>
            <p>Use <code>/upload-flipboard</code> command in Slack to share GitHub repositories</p>
          </div>
          
          <div className="feature-card">
            <h3>📊 Dashboard</h3>
            <p>View all uploaded repositories with user information and timestamps</p>
          </div>
          
          <div className="feature-card">
            <h3>🔗 GitHub Links</h3>
            <p>Automatic validation and parsing of GitHub repository URLs</p>
          </div>
        </div>
        
        <div className="endpoints">
          <h2>Available Endpoints</h2>
          <div className="endpoint-list">
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <Link href="/api" className="endpoint-url">/api</Link>
              <span className="endpoint-desc">API information</span>
            </div>
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <Link href="/api/health" className="endpoint-url">/api/health</Link>
              <span className="endpoint-desc">Health check</span>
            </div>
            <div className="endpoint-item">
              <span className="method post">POST</span>
              <span className="endpoint-url">/api/slack/events</span>
              <span className="endpoint-desc">Slack slash command handler</span>
            </div>
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <Link href="/api/uploads" className="endpoint-url">/api/uploads</Link>
              <span className="endpoint-desc">Upload history (JSON)</span>
            </div>
            <div className="endpoint-item">
              <span className="method get">GET</span>
              <Link href="/dashboard" className="endpoint-url">/dashboard</Link>
              <span className="endpoint-desc">Upload dashboard (UI)</span>
            </div>
          </div>
        </div>
        
        <div className="actions">
          <Link href="/dashboard" className="btn primary">
            📊 View Dashboard
          </Link>
          <Link href="/api/uploads" className="btn secondary">
            📋 API Data
          </Link>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 10px;
          font-size: 3em;
        }

        .subtitle {
          text-align: center;
          color: #7f8c8d;
          font-size: 1.2em;
          margin-bottom: 50px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin: 50px 0;
        }

        .feature-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .feature-card h3 {
          color: #3498db;
          margin-bottom: 15px;
          font-size: 1.3em;
        }

        .feature-card p {
          color: #7f8c8d;
          line-height: 1.6;
        }

        .endpoints {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin: 50px 0;
        }

        .endpoints h2 {
          color: #2c3e50;
          margin-bottom: 25px;
          text-align: center;
        }

        .endpoint-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .endpoint-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .method {
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.8em;
          min-width: 60px;
          text-align: center;
        }

        .method.get {
          background: #27ae60;
          color: white;
        }

        .method.post {
          background: #e74c3c;
          color: white;
        }

        .endpoint-url {
          font-family: 'Monaco', 'Courier New', monospace;
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
          min-width: 200px;
        }

        .endpoint-url:hover {
          text-decoration: underline;
        }

        .endpoint-desc {
          color: #7f8c8d;
          flex: 1;
        }

        .actions {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin: 50px 0;
          flex-wrap: wrap;
        }

        .btn {
          padding: 15px 30px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 1.1em;
          transition: all 0.2s;
        }

        .btn.primary {
          background: #3498db;
          color: white;
        }

        .btn.primary:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .btn.secondary {
          background: #ecf0f1;
          color: #2c3e50;
        }

        .btn.secondary:hover {
          background: #d5dbdb;
          transform: translateY(-2px);
        }

        code {
          background: #ecf0f1;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 15px;
          }

          h1 {
            font-size: 2.5em;
          }

          .features {
            grid-template-columns: 1fr;
          }

          .endpoint-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 200px;
            text-align: center;
          }
        }
      `}</style>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: #f5f5f5;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
}

