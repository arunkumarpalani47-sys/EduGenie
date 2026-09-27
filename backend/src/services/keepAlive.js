/**
 * Render 24/7 Keep-Alive Service
 *
 * Render Free Tier web services spin down (sleep) after 15 minutes of inactivity.
 * This service automatically pings the server's public URL every 14 minutes
 * to ensure Render stays warm, active, and responsive 24/7 with ZERO cold starts.
 */

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes (Render sleeps at 15 mins)

export const initKeepAlive = () => {
  // Render automatically sets RENDER_EXTERNAL_URL (e.g., https://edugenie-backend.onrender.com)
  const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BACKEND_URL;

  if (!targetUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.log('ℹ️  Keep-Alive: No public URL set. Set RENDER_EXTERNAL_URL or PUBLIC_BACKEND_URL to enable self-ping.');
    }
    return;
  }

  const pingEndpoint = `${targetUrl.replace(/\/+$/, '')}/api/health`;
  console.log(`⏱️  Keep-Alive initialized: Pinging ${pingEndpoint} every 14 minutes to prevent sleep.`);

  // Periodic heartbeat
  setInterval(async () => {
    try {
      const response = await fetch(pingEndpoint, {
        headers: { 'User-Agent': 'EduGenie-KeepAlive-Heartbeat/1.0' },
      });
      if (response.ok) {
        console.log(`💓 [Keep-Alive] 24/7 Heartbeat successful at ${new Date().toLocaleTimeString()} (Status: ${response.status})`);
      } else {
        console.warn(`⚠️ [Keep-Alive] Heartbeat responded with status ${response.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ [Keep-Alive] Heartbeat ping failed: ${err.message}`);
    }
  }, PING_INTERVAL_MS);
};
