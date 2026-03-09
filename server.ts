import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { expressjwt, GetVerificationKey } from "express-jwt";
import jwksRsa from "jwks-rsa";
import axios from "axios";
import db from "./src/db.ts";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const authConfig = {
    domain: process.env.AUTH0_DOMAIN || "meechain.au.auth0.com",
    audience: process.env.AUTH0_AUDIENCE || "https://meechain.au.auth0.com/api/v2/",
  };

  // Middleware to validate JWT
  const checkJwt = expressjwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
    }) as GetVerificationKey,
    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithms: ["RS256"],
    credentialsRequired: false, // Allow requests without tokens for demo purposes
  });

  // Fallback middleware to inject mock user if no real token is provided
  const injectMockUser = (req: any, res: any, next: any) => {
    if (!req.auth) {
      req.auth = {
        sub: "auth0|mock_user_123",
        email: "contributor@meechain.io",
        name: "MeeChain Contributor"
      };
    }
    next();
  };

  const authMiddleware = [checkJwt, injectMockUser];

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/auth-config", (req, res) => {
    res.json({
      domain: authConfig.domain,
      clientId: "6hyf98TCLxD8IV7Cf2mlaRZDjrD3qUHB",
      audience: authConfig.audience
    });
  });

  app.get("/api/feature-flags", authMiddleware, (req, res) => {
    const flags = db.prepare('SELECT * FROM feature_flags').all();
    const flagMap = flags.reduce((acc: any, flag: any) => {
      acc[flag.name] = flag.enabled === 1;
      return acc;
    }, {});
    res.json(flagMap);
  });

  app.post("/api/feature-flags/toggle", authMiddleware, (req, res) => {
    const { name, enabled } = req.body;
    db.prepare('UPDATE feature_flags SET enabled = ? WHERE name = ?').run(enabled ? 1 : 0, name);
    res.json({ success: true });
  });

  // Protected Routes
  app.get("/api/me", authMiddleware, (req: any, res) => {
    const userId = req.auth.sub;
    
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(userId, req.auth.email || 'unknown');
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    res.json({
      identity: req.auth,
      profile: user
    });
  });

  app.post("/api/rpc", authMiddleware, async (req: any, res) => {
    const userId = req.auth.sub;
    const { method, params } = req.body;

    const rpcFlag = db.prepare('SELECT enabled FROM feature_flags WHERE name = ?').get('rpc_access_enabled') as any;
    if (!rpcFlag || rpcFlag.enabled === 0) {
      return res.status(403).json({ error: "RPC access is currently disabled" });
    }

    const user = db.prepare('SELECT quota_used, quota_limit FROM users WHERE id = ?').get(userId) as any;
    if (user && user.quota_used >= user.quota_limit) {
      return res.status(429).json({ error: "Quota exceeded. Please contact admin for more calls." });
    }

    const rpcUrl = process.env.MEECHAIN_RPC_URL || "https://rpc.meechain.run.place";

    try {
      const response = await axios.post(
        rpcUrl,
        {
          jsonrpc: "2.0",
          id: 1,
          method,
          params
        }
      );

      // Log activity and update quota
      db.prepare('UPDATE users SET quota_used = quota_used + 1, last_active = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
      db.prepare('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)').run(
        userId, 
        'RPC_CALL', 
        JSON.stringify({ method })
      );

      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/badges", authMiddleware, (req: any, res) => {
    const userId = req.auth.sub;
    const user = db.prepare('SELECT badges FROM users WHERE id = ?').get(userId) as any;
    res.json(JSON.parse(user?.badges || '[]'));
  });

  app.post("/api/badges/check", authMiddleware, (req: any, res) => {
    const userId = req.auth.sub;

    const badgeFlag = db.prepare('SELECT enabled FROM feature_flags WHERE name = ?').get('badge_awards_enabled') as any;
    if (!badgeFlag || badgeFlag.enabled === 0) {
      return res.status(403).json({ error: "Badge awards are currently disabled" });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) return res.status(404).json({ error: "User not found" });

    const currentBadges = JSON.parse(user.badges || '[]');
    const newBadges = [...currentBadges];
    let awarded = false;

    // Logic for awarding badges
    if (user.quota_used >= 1 && !currentBadges.includes('MeeChain Explorer')) {
      newBadges.push('MeeChain Explorer');
      awarded = true;
    }
    if (user.quota_used >= 50 && !currentBadges.includes('RPC Ranger')) {
      newBadges.push('RPC Ranger');
      awarded = true;
    }

    if (awarded) {
      db.prepare('UPDATE users SET badges = ? WHERE id = ?').run(JSON.stringify(newBadges), userId);
      db.prepare('INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)').run(
        userId, 
        'BADGE_AWARDED', 
        JSON.stringify({ badges: newBadges.filter(b => !currentBadges.includes(b)) })
      );
    }

    res.json({ badges: newBadges, awarded });
  });

  app.get("/api/dashboard/stats", authMiddleware, (req: any, res) => {
    const userId = req.auth.sub;
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT SUM(quota_used) FROM users) as total_rpc_calls,
        (SELECT quota_used FROM users WHERE id = ?) as my_calls,
        (SELECT quota_limit FROM users WHERE id = ?) as quota_limit
    `).get(userId, userId);
    
    res.json(stats);
  });

  app.get("/api/logs/my", authMiddleware, (req: any, res) => {
    const userId = req.auth.sub;
    const logs = db.prepare('SELECT * FROM logs WHERE user_id = ? AND action = ? ORDER BY timestamp DESC LIMIT 10').all(userId, 'RPC_CALL');
    res.json(logs.map((log: any) => ({
      ...log,
      details: JSON.parse(log.details)
    })));
  });

  app.get("/api/market-insights", authMiddleware, async (req, res) => {
    const flag = db.prepare('SELECT enabled FROM feature_flags WHERE name = ?').get('market_insights_enabled') as any;
    if (!flag || flag.enabled === 0) {
      return res.status(403).json({ error: "Market Insights feature is currently disabled" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Provide a brief summary of the latest trends in the BSC (BNB Smart Chain) ecosystem and MeeChain related news if any.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      res.json({ 
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
