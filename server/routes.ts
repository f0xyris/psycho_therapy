import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import passport from "passport";
import { insertUserSchema, insertAppointmentSchema, insertReviewSchema } from "../shared/schema";
import { generateToken, verifyToken, extractTokenFromRequest } from "../shared/jwt";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { sendAppointmentSubmittedEmail, sendAppointmentConfirmedEmail, sendCoursePurchasedEmail, sendAdminAppointmentNotification } from "./emailService";
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stripe removed

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${safeExt}`;
    cb(null, name);
  }
});
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const SUPPORTED_LANGS = ["ua", "en", "ru"];
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || null;
const YANDEX_TRANSLATE_API_KEY = process.env.YANDEX_TRANSLATE_API_KEY || null;

const demoState = {
  reviewsStatus: new Map<number, "approved" | "rejected" | "pending">(),
  deletedReviews: new Set<number>(),
  appointmentsStatus: new Map<number, string>(),
  deletedAppointments: new Set<number>(),
  createdAppointments: [] as any[],
  createdReviews: [] as any[],
};

function mergeAppointmentsWithDemo(baseAppointments: any[], includeDemo: boolean) {
  let combined = Array.isArray(baseAppointments) ? [...baseAppointments] : [];
  if (includeDemo) {
    combined = [...demoState.createdAppointments, ...combined];
  }

  combined = combined
    .filter(appt => !demoState.deletedAppointments.has(appt.id))
    .map(appt => ({
      ...appt,
      status: demoState.appointmentsStatus.get(appt.id) || appt.status,
    }));
  return combined;
}

function isDemoRequest(req: any): boolean {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) return false;
    const payload: any = verifyToken(token);
    return !!(payload && payload.isDemo);
  } catch {
    return false;
  }
}

function getAuthFlags(req: any): { isDemo: boolean; isAdmin: boolean } {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) return { isDemo: false, isAdmin: false };
    const payload: any = verifyToken(token);
    return { isDemo: !!payload?.isDemo, isAdmin: !!payload?.isAdmin };
  } catch {
    return { isDemo: false, isAdmin: false };
  }
}

function mergeReviewsWithDemo(baseReviews: any[], includeDemo: boolean) {
  let combined = Array.isArray(baseReviews) ? [...baseReviews] : [];
  if (includeDemo) {
    combined = [...demoState.createdReviews, ...combined];
  }
  combined = combined
    .filter(rv => !demoState.deletedReviews.has(rv.id))
    .map(rv => ({
      ...rv,
      status: demoState.reviewsStatus.get(rv.id) || rv.status,
    }));
  return combined;
}

function maskEmail(email?: string | null) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  const maskedName = name.length <= 2 ? "**" : name[0] + "***" + name[name.length - 1];
  const domainParts = domain.split(".");
  const maskedDomain = domainParts[0][0] + "***" + "." + domainParts.slice(1).join(".");
  return `${maskedName}@${maskedDomain}`;
}

function maskPhone(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `+** **** ${digits.slice(-4)}`;
}

function maskName(firstName?: string | null, lastName?: string | null) {
  const f = firstName ? firstName[0] + "." : "";
  const l = lastName ? lastName[0] + "." : "";
  return `${f} ${l}`.trim();
}

function maskUserData(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName ? user.firstName[0] + "." : null,
    lastName: user.lastName ? user.lastName[0] + "." : null,
    email: maskEmail(user.email),
    phone: maskPhone(user.phone),
  };
}

function maskAppointmentData(appt: any) {
  return {
    ...appt,
    notes: null,
    clientName: appt.clientName ? "Client" : null,
    clientPhone: appt.clientPhone ? maskPhone(appt.clientPhone) : null,
    clientEmail: appt.clientEmail ? maskEmail(appt.clientEmail) : null,
    user: maskUserData(appt.user),
  };
}

const isAuthenticatedJWT = async (req: any, res: any, next: any) => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if ((payload as any).isDemo) {
      req.user = {
        id: 0,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        profileImageUrl: null,
        googleId: null,
        phone: null,
        isAdmin: true,
        isDemo: true,
      };
      (req as any).isDemo = true;
      return next();
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email, first_name, last_name, profile_image_url, google_id, phone, is_admin FROM users WHERE id = $1',
        [payload.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        googleId: user.google_id,
        phone: user.phone,
        isAdmin: user.is_admin,
        isDemo: payload.isDemo === true,
      };

      (req as any).isDemo = payload.isDemo === true;

      next();
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('JWT authentication error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

const isAdminJWT = async (req: any, res: any, next: any) => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if ((payload as any).isDemo) {
      req.user = {
        id: 0,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        profileImageUrl: null,
        googleId: null,
        phone: null,
        isAdmin: true,
        isDemo: true,
      };
      (req as any).isDemo = true;
      return next();
    }

    if (!payload.isAdmin) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
      const userResult = await client.query(
        'SELECT id, email, first_name, last_name, profile_image_url, google_id, phone, is_admin FROM users WHERE id = $1',
        [payload.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImageUrl: user.profile_image_url,
        googleId: user.google_id,
        phone: user.phone,
        isAdmin: user.is_admin,
        isDemo: payload.isDemo === true,
      };
      (req as any).isDemo = payload.isDemo === true;

      next();
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('JWT admin authentication error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!GOOGLE_TRANSLATE_API_KEY) return text;
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" })
  });
  const data = await res.json() as any;
  return data?.data?.translations?.[0]?.translatedText || text;
}

async function translateTextYandex(text: string, from: string, to: string): Promise<string> {
  if (!YANDEX_TRANSLATE_API_KEY) return text;
  const url = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Api-Key ${YANDEX_TRANSLATE_API_KEY}`
    },
    body: JSON.stringify({
      sourceLanguageCode: from,
      targetLanguageCode: to,
      texts: [text]
    })
  });
  const data = await res.json() as any;
  return data?.translations?.[0]?.text || text;
}

async function ensureAllLangs(obj: Record<string, string>, fromLang: string): Promise<Record<string, string>> {
  const result: Record<string, string> = { ...obj };
  for (const lang of SUPPORTED_LANGS) {
    if (!result[lang] && result[fromLang]) {
      // If no translation API configured, fall back to original text
      if (!YANDEX_TRANSLATE_API_KEY) {
        result[lang] = result[fromLang];
        continue;
      }
      let yandexFrom = fromLang === 'ua' ? 'uk' : fromLang;
      let yandexTo = lang === 'ua' ? 'uk' : lang;
      try {
        result[lang] = await translateTextYandex(result[fromLang], yandexFrom, yandexTo);
      } catch {
        result[lang] = result[fromLang];
      }
    }
  }
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req: any, res) => {
      try {
        const user = req.user;
        
        if (!user) {
          return res.redirect("/login?error=authentication_failed");
        }

        const token = generateToken({
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        });

        const userData = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          googleId: user.googleId,
          phone: user.phone,
          isAdmin: user.isAdmin
        };

        const encodedData = encodeURIComponent(JSON.stringify({
          token,
          user: userData
        }));

        res.redirect(`/?auth=${encodedData}`);
        
      } catch (error) {
        res.redirect("/login?error=authentication_failed");
      }
    }
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'Database configuration missing' });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT configuration missing' });
      }

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      
      try {
        const userResult = await client.query(
          'SELECT id, email, first_name, last_name, password, is_admin FROM users WHERE email = $1',
          [email]
        );

        if (userResult.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userResult.rows[0];

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        
        const token = generateToken({
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: user.is_admin
        });

        const responseData = {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            isAdmin: user.is_admin
          }
        };

        res.status(200).json(responseData);

      } finally {
        client.release();
        await pool.end();
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/auth/demo-login", async (_req, res) => {
    try {
      const demoUser = {
        id: 0,
        email: "demo@lasertouch.example",
        firstName: "Demo",
        lastName: "Admin",
        isAdmin: true,
      };
      const token = generateToken({
        userId: demoUser.id,
        email: demoUser.email,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        isAdmin: true,
        isDemo: true,
      });
      res.status(200).json({ token, user: { ...demoUser, isDemo: true } });
    } catch (e) {
      res.status(500).json({ error: "Failed to create demo session" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const token = extractTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Verify token (same as Vercel)
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      if ((payload as any).isDemo) {
        return res.status(200).json({
          id: 0,
          email: maskEmail(payload.email),
          firstName: payload.firstName,
          lastName: payload.lastName,
          profileImageUrl: null,
          googleId: null,
          phone: null,
          isAdmin: true,
          isDemo: true,
        });
      }

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      
      try {
        const userResult = await client.query(
          'SELECT id, email, first_name, last_name, profile_image_url, google_id, phone, is_admin FROM users WHERE id = $1',
          [payload.userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(401).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];
        
        const responseData = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImageUrl: user.profile_image_url,
          googleId: user.google_id,
          phone: user.phone,
          isAdmin: user.is_admin
        };
        
        res.status(200).json(responseData);

      } finally {
        client.release();
        await pool.end();
      }

    } catch (error) {
      console.error('❌ User info error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found');
        return res.status(500).json({ error: 'Database configuration missing' });
      }

      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET not found');
        return res.status(500).json({ error: 'JWT configuration missing' });
      }


      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      
      try {
        const existingUserResult = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUserResult.rows.length > 0) {
          return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const userResult = await client.query(
          'INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, is_admin',
          [email, hashedPassword, firstName || null, lastName || null, email === "antip4uck.ia@gmail.com"]
        );

        const user = userResult.rows[0];

        const token = generateToken({
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isAdmin: user.is_admin
        });

        const responseData = {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            isAdmin: user.is_admin
          }
        };

        res.status(201).json(responseData);

      } finally {
        client.release();
        await pool.end();
      }

    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.redirect("/");
    });
  });

  app.get("/api/appointments/user", isAuthenticatedJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      if (req.isDemo) {
        const demoUserAppointments = mergeAppointmentsWithDemo([], true)
          .filter((a: any) => a.userId === 0);
        return res.json(demoUserAppointments.map(maskAppointmentData));
      }
      const appointments = await storage.getAppointmentsByUserId(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments", isAdminJWT, async (req: any, res) => {
    try {
      const appointmentsDb = await storage.getAllAppointments();
      const merged = mergeAppointmentsWithDemo(appointmentsDb, req.isDemo);
      if (req.isDemo) {
        return res.json(merged.map(maskAppointmentData));
      }
      res.json(merged);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });
  app.get("/api/appointments/recent", isAdminJWT, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentDb = await storage.getRecentAppointments(limit * 2); // fetch extra to allow demo merges & slicing
      const merged = mergeAppointmentsWithDemo(recentDb, req.isDemo)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      if (req.isDemo) {
        return res.json(merged.map(maskAppointmentData));
      }
      res.json(merged);
    } catch (error) {
      console.error("Error fetching recent appointments:", error);
      res.status(500).json({ error: "Failed to fetch recent appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticatedJWT, async (req: any, res) => {
    try {
      if (req.isDemo) {
        const { serviceId, appointmentDate, notes } = req.body;
        const fake = {
          id: Math.floor(Math.random() * 1000000) + 1000,
          appointmentDate,
          status: "pending",
          notes: notes || null,
          createdAt: new Date().toISOString(),
          clientName: null,
          clientPhone: null,
          clientEmail: null,
          userId: 0,
          user: maskUserData(req.user),
          service: await storage.getService(parseInt(serviceId)),
          demo: true,
        } as any;
        demoState.createdAppointments.push(fake);
        return res.status(201).json(maskAppointmentData(fake));
      }
      const { serviceId, appointmentDate, notes, status, isOnline } = req.body;

      // Enforce working hours if present for the day
      try {
        const dateOnly = new Date(appointmentDate);
        const yyyy = dateOnly.getFullYear();
        const mm = String(dateOnly.getMonth() + 1).padStart(2, '0');
        const dd = String(dateOnly.getDate()).padStart(2, '0');
        const dayKey = `${yyyy}-${mm}-${dd}`;
        const wh = await storage.getWorkingHoursByDate(dayKey);
        if (wh) {
          const toHM = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          const hm = toHM(new Date(appointmentDate));
          const toMin = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
          const val = toMin(hm);
          if (!(val >= toMin(wh.startTime) && val <= toMin(wh.endTime))) {
            return res.status(400).json({ error: "Selected time is outside of working hours" });
          }
        }
      } catch {}

      const appointmentData = {
        userId: req.user.id,
        serviceId: parseInt(serviceId),
        appointmentDate: new Date(appointmentDate),
        isOnline: Boolean(isOnline) || false,
        notes: notes || null,
        status: status || "pending"
      };
      
      const appointment = await storage.createAppointment(appointmentData);

      try {
        const service = await storage.getService(parseInt(serviceId));
        const serviceName = service ? (typeof service.name === 'string' ? service.name : (service.name as any)?.ua || 'Unknown Service') : 'Unknown Service';

        const userLanguage = 'ua';
        
        await sendAppointmentSubmittedEmail(
          req.user.email,
          serviceName,
          new Date(appointmentDate),
          Boolean(isOnline) || false,
          userLanguage
        );
        
        try {
          const adminEmail = process.env.ADMIN_EMAIL || 'antip4uck.ia@gmail.com';
          const clientName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Unknown Client';
          const clientPhone = req.user.phone || 'No phone provided';
          
          await sendAdminAppointmentNotification(
            adminEmail,
            clientName,
            req.user.email,
            clientPhone,
            serviceName,
            new Date(appointmentDate),
            Boolean(isOnline) || false,
            userLanguage
          );
          

        } catch (adminEmailError) {
          console.error("Error sending admin notification email:", adminEmailError);
        }
      } catch (emailError) {
        console.error("Error sending appointment submission email:", emailError);
      }
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.post("/api/appointments/admin", isAdminJWT, async (req: any, res) => {
    try {
      if (req.isDemo) {
        const { appointmentDate, clientInfo, serviceId, status } = req.body;
        const fake = {
          id: Math.floor(Math.random() * 1000000) + 1000,
          appointmentDate,
          status: status || "confirmed",
          notes: null,
          createdAt: new Date().toISOString(),
          clientName: clientInfo?.name || "Client",
          clientPhone: clientInfo?.phone || null,
          clientEmail: clientInfo?.email || null,
          user: null,
          service: await storage.getService(parseInt(serviceId)),
          demo: true,
        } as any;
        demoState.createdAppointments.push(fake);
        return res.status(201).json(maskAppointmentData(fake));
      }
      const { serviceId, appointmentDate, notes, status, clientInfo, isOnline } = req.body;

      let parsedDate;
      if (appointmentDate) {
        parsedDate = new Date(appointmentDate);

        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid date received:", appointmentDate);
          return res.status(400).json({ error: "Invalid date format" });
        }
      } else {
        parsedDate = new Date();
      }
      
      // Enforce working hours for admin-created appointments too
      try {
        const yyyy = parsedDate.getFullYear();
        const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(parsedDate.getDate()).padStart(2, '0');
        const dayKey = `${yyyy}-${mm}-${dd}`;
        const wh = await storage.getWorkingHoursByDate(dayKey);
        if (wh) {
          const toHM = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          const hm = toHM(parsedDate);
          const toMin = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
          const val = toMin(hm);
          if (!(val >= toMin(wh.startTime) && val <= toMin(wh.endTime))) {
            return res.status(400).json({ error: "Selected time is outside of working hours" });
          }
        }
      } catch {}

      const appointmentData = {
        serviceId: parseInt(serviceId),
        appointmentDate: parsedDate,
        isOnline: Boolean(isOnline) || false,
        notes: notes || null,
        status: status || "confirmed",
        clientInfo: {
          name: clientInfo?.name || "Client without name",
          phone: clientInfo?.phone || null,
          email: clientInfo?.email || null
        }
      };
      
      const appointment = await storage.createAppointmentForClient(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating admin appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

    app.put("/api/appointments/:id/status", isAdminJWT, async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;

      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      if ((req as any).isDemo) {
        demoState.appointmentsStatus.set(appointmentId, status);
        return res.json({ id: appointmentId, status });
      }
      const appointment = await storage.updateAppointmentStatus(appointmentId, status);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      if (status === "confirmed" && appointment.userId) {
        try {
          const user = await storage.getUser(appointment.userId);
          if (user && user.email) {
            const service = await storage.getService(appointment.serviceId);
            const serviceName = service ? (typeof service.name === 'string' ? service.name : (service.name as any)?.ua || 'Unknown Service') : 'Unknown Service';

            const userLanguage = 'ua';
            
            await sendAppointmentConfirmedEmail(
              user.email,
              serviceName,
              new Date(appointment.appointmentDate),
              Boolean((appointment as any).isOnline) || false,
              userLanguage
            );
            
    
          }
        } catch (emailError) {
          console.error("Error sending appointment confirmation email:", emailError);
        }
      }

      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  app.delete("/api/appointments/:id", isAdminJWT, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      if (req.isDemo) {
        demoState.deletedAppointments.add(appointmentId);
        return res.status(204).send();
      }
      await storage.deleteAppointment(appointmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.post("/api/appointments/check-availability", async (req, res) => {
    try {
      const { serviceId, appointmentDate } = req.body;
      
      if (!serviceId || !appointmentDate) {
        return res.status(400).json({ error: "Service ID and appointment date are required" });
      }

      const service = await storage.getService(parseInt(serviceId));
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      
      const startDate = new Date(appointmentDate);
      const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);

      const conflicts = await storage.getConflictingAppointments(startDate, endDate);
      
      res.json({
        available: conflicts.length === 0,
        conflicts: conflicts
      });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ error: "Failed to check availability" });
    }
  });

  app.get("/api/users", isAdminJWT, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => ({ ...user, password: undefined }));
      if (req.isDemo) {
        return res.json(usersWithoutPasswords.map(u => ({
          ...u,
          email: maskEmail(u.email),
          phone: maskPhone(u.phone as any),
          firstName: u.firstName ? u.firstName[0] + "." : null,
          lastName: u.lastName ? u.lastName[0] + "." : null,
        })));
      }
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAdminJWT, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });
  app.put("/api/users/profile", isAuthenticatedJWT, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, profileImageUrl } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      
      const user = await storage.updateUser(userId, updateData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/admin", isAdminJWT, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ error: "isAdmin must be a boolean" });
      }
      if (req.isDemo) {
        return res.json({ id: userId, isAdmin });
      }
      const user = await storage.updateUserAdminStatus(userId, isAdmin);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user admin status" });
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
          const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
          const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create appointment" });
      }
    }
  });

  // Update appointment status (local dev Express)
  app.put("/api/appointments", async (req: any, res) => {
    try {
      const idRaw = (req.query.id as string) ?? (req.body?.id as string);
      const id = idRaw ? parseInt(idRaw) : NaN;
      const { status, notes } = req.body || {};
      if (!id || Number.isNaN(id)) {
        return res.status(400).json({ error: "Appointment ID is required" });
      }
      // Validate status
      if (status !== undefined) {
        const allowed = new Set(["pending", "confirmed", "cancelled", "completed"]);
        if (!allowed.has(String(status))) {
          return res.status(400).json({ error: "Invalid status value" });
        }
      }
      if (status !== undefined) {
        await storage.updateAppointmentStatus(id, status);
      }
      // Optionally store notes if needed in future
      const updated = await storage.getAppointmentById(id);
      return res.status(200).json({ success: true, updated });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete appointment (local dev Express)
  app.delete("/api/appointments", async (req: any, res) => {
    try {
      const idRaw = req.query.id as string;
      const id = idRaw ? parseInt(idRaw) : NaN;
      if (!id || Number.isNaN(id)) {
        return res.status(400).json({ error: "Appointment ID is required" });
      }
      await storage.deleteAppointment(id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.get("/api/appointments/by-date", async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "Date parameter is required" });
      }

      const includeDemo = isDemoRequest(req);
      const allAppointmentsDb = await storage.getAllAppointments();
      const allAppointments = mergeAppointmentsWithDemo(allAppointmentsDb, includeDemo);

      const dateAppointments = allAppointments.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        const queryDate = new Date(date);

        return appointmentDate.getFullYear() === queryDate.getFullYear() &&
               appointmentDate.getMonth() === queryDate.getMonth() &&
               appointmentDate.getDate() === queryDate.getDate();
      });
      res.json(dateAppointments);
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      res.status(500).json({ error: "Failed to fetch appointments by date" });
    }
  });

  // Working hours endpoints
  app.get("/api/working-hours", async (req, res) => {
    try {
      const date = String(req.query.date || "");
      if (!date) {
        return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
      }
      const row = await storage.getWorkingHoursByDate(date);
      return res.json(row || {});
    } catch (error) {
      console.error("Error fetching working hours:", error);
      return res.status(500).json({ error: "Failed to fetch working hours" });
    }
  });

  app.post("/api/working-hours", isAdminJWT, async (req: any, res) => {
    try {
      const { date, startTime, endTime } = req.body || {};
      if (!date || !startTime || !endTime) {
        return res.status(400).json({ error: "date, startTime and endTime are required" });
      }
      // Basic validation HH:mm
      const hhmm = /^\d{2}:\d{2}$/;
      if (!hhmm.test(startTime) || !hhmm.test(endTime)) {
        return res.status(400).json({ error: "Invalid time format, expected HH:mm" });
      }
      const saved = await storage.upsertWorkingHours(String(date), String(startTime), String(endTime));
      return res.status(200).json(saved);
    } catch (error) {
      console.error("Error saving working hours:", error);
      return res.status(500).json({ error: "Failed to save working hours" });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const { isDemo, isAdmin } = getAuthFlags(req);
      const base = isAdmin || isDemo
        ? await storage.getAllReviews()
        : await storage.getReviewsByStatus("approved");
      const merged = mergeReviewsWithDemo(base, isDemo);
      if (isDemo) {
        return res.json(merged.map(r => ({
          ...r,
          name: r.name ? (r.name[0] + ".") : "Anonymous",
        })));
      }
      res.json(merged);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/all", isAdminJWT, async (req: any, res) => {
    try {
      const base = await storage.getAllReviews();
      const merged = mergeReviewsWithDemo(base, req.isDemo);
      if (req.isDemo) {
        return res.json(merged.map(r => ({
          ...r,
          name: r.name ? r.name[0] + "." : "Anonymous",
        })));
      }
      res.json(merged);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all reviews" });
    }
  });

  app.post("/api/reviews/:id/approve", isAdminJWT, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (req.isDemo) {
        demoState.reviewsStatus.set(reviewId, "approved");
        return res.json({ id: reviewId, status: "approved" });
      }
      const review = await storage.approveReview(reviewId);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve review" });
    }
  });

  app.post("/api/reviews/:id/reject", isAdminJWT, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (req.isDemo) {
        demoState.reviewsStatus.set(reviewId, "rejected");
        return res.json({ id: reviewId, status: "rejected" });
      }
      const review = await storage.rejectReview(reviewId);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject review" });
    }
  });

  app.delete("/api/reviews/:id", isAdminJWT, async (req: any, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (req.isDemo) {
        demoState.deletedReviews.add(reviewId);
        return res.json({ success: true });
      }
      await storage.deleteReview(reviewId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  app.post("/api/reviews", async (req: any, res) => {
    try {
      const { name, rating, comment, userId } = req.body;
      if (isDemoRequest(req)) {
        const fake = {
          id: Math.floor(Math.random() * 1000000) + 1000,
          name: name || null,
          rating: Number(rating) || 5,
          comment: comment || "",
          status: "pending",
          userId: 0,
          serviceId: null,
          createdAt: new Date().toISOString(),
        } as any;
        demoState.createdReviews.push(fake);
        return res.status(201).json(fake);
      }
      const reviewData = insertReviewSchema.parse({
        name,
        rating,
        comment,
        userId: userId || null,
        serviceId: null,
        status: "pending",
      } as any);
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create review" });
      }
    }
  });

  app.put("/api/reviews", isAdminJWT, async (req: any, res) => {
    try {
      const id = parseInt(req.query.id as string);
      const { status } = req.body as { status: string };
      if (!id || !status) return res.status(400).json({ error: "id and status required" });
      if (req.isDemo) {
        if (["approved", "rejected", "pending"].includes(status)) {
          demoState.reviewsStatus.set(id, status as any);
          return res.json({ id, status });
        }
        return res.status(400).json({ error: "Invalid status" });
      }
      if (status === "approved") {
        const rv = await storage.approveReview(id);
        return res.json(rv);
      }
      if (status === "rejected") {
        const rv = await storage.rejectReview(id);
        return res.json(rv);
      }
      return res.status(400).json({ error: "Unsupported status" });
    } catch (error) {
      console.error("Error updating review status:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.delete("/api/reviews", isAdminJWT, async (req: any, res) => {
    try {
      const id = parseInt(req.query.id as string);
      if (!id) return res.status(400).json({ error: "id required" });
      if (req.isDemo) {
        demoState.deletedReviews.add(id);
        return res.status(204).send();
      }
      await storage.deleteReview(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  app.get("/api/courses", async (req, res) => {
    try {
          const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourseById(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.put("/api/courses/:id", isAdminJWT, async (req: any, res) => {
    try {
      if (req.isDemo) {
        const { price, duration, name, description } = req.body;
        return res.json({ id: Number(req.params.id), price, duration, name, description, demo: true });
      }
      const id = Number(req.params.id);
      const { price, duration, name, description, imageUrl, docUrl } = req.body;
      const updateData: any = { price, duration };
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (docUrl) updateData.docUrl = docUrl;
      const updated = await storage.updateCourse(id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.put("/api/services/:id", isAdminJWT, async (req: any, res) => {
    try {
      if (req.isDemo) {
        const { price, duration, name, description } = req.body;
        return res.json({ id: Number(req.params.id), price, duration, name, description, demo: true });
      }
      const id = Number(req.params.id);
      const { price, duration, name, description } = req.body;
      const updateData: any = { price, duration };
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      const updated = await storage.updateService(id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.post("/api/services", isAdminJWT, async (req, res) => {
    try {
      if ((req as any).isDemo) {
        const { name, price, duration, description, category } = req.body;
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000000) + 1000,
          name,
          price,
          duration,
          description: description || {},
          category: category || "custom",
          demo: true,
        });
      }
      let { name, price, duration, description, category, imageUrl, docUrl } = req.body;
      if (!name || !price || !duration) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (typeof name === "string") name = { ua: name };
      if (typeof description === "string") description = { ua: description };
      name = await ensureAllLangs(name, Object.keys(name)[0]);
      description = await ensureAllLangs(description, Object.keys(description)[0]);
      const created = await storage.createService({ name, price, duration, description, category: category || "custom" });
      res.status(201).json(created);
    } catch (error: any) {
      console.error("CREATE SERVICE ERROR", error);
      res.status(500).json({ error: "Failed to create service", details: typeof error?.message === 'string' ? error.message : String(error) });
    }
  });

  app.delete("/api/services/:id", isAdminJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if ((req as any).isDemo) {
        return res.json({ success: true });
      }
      await storage.deleteService(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("DELETE SERVICE ERROR", error);
      res.status(500).json({ 
        error: "Failed to delete service", 
        details: typeof error?.message === 'string' ? error.message : String(error) 
      });
    }
  });

  app.post("/api/courses", isAdminJWT, async (req, res) => {
    try {
      if ((req as any).isDemo) {
        const { name, price, duration, description, category } = req.body;
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000000) + 1000,
          name,
          price,
          duration,
          description,
          category: category || "custom",
          demo: true,
        });
      }
      let { name, price, duration, description, category, imageUrl, docUrl } = req.body;
      if (!name || !price || !duration) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (typeof name === "string") name = { ua: name };
      if (typeof description === "string") description = { ua: description };
      name = await ensureAllLangs(name, Object.keys(name)[0]);
      description = await ensureAllLangs(description, Object.keys(description)[0]);
      const created = await storage.createCourse({ name, price, duration, description, category: category || "custom", imageUrl, docUrl } as any);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("CREATE COURSE ERROR", error);
      res.status(500).json({ error: "Failed to create course", details: typeof error?.message === 'string' ? error.message : String(error), body: req.body });
    }
  });

  app.delete("/api/courses/:id", isAdminJWT, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if ((req as any).isDemo) {
        return res.json({ success: true });
      }
      await storage.deleteCourse(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  // Stripe routes removed

  app.post("/api/upload", isAdminJWT, upload.single("file"), (req: any, res) => {
    if (req.isDemo) {
      return res.json({ url: "/uploads/demo-placeholder.png" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, originalName: req.file.originalname });
  });

  app.post("/api/test-email", isAdminJWT, async (req: any, res) => {
    try {
      if (req.isDemo) {
        return res.json({ success: true, demo: true });
      }
      const { email, type, language = 'ua' } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      switch (type) {
        case 'appointment-submitted':
          await sendAppointmentSubmittedEmail(
            email,
            'Test Service',
            new Date(),
            language
          );
          break;
        case 'appointment-confirmed':
          await sendAppointmentConfirmedEmail(
            email,
            'Test Service',
            new Date(),
            language
          );
          break;
        case 'course-purchased':
          await sendCoursePurchasedEmail(
            email,
            'Test Course',
            '2 hours',
            '5000 ₽',
            language
          );
          break;
        default:
          return res.status(400).json({ error: "Invalid email type" });
      }

      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email", details: error.message });
    }
  });

  app.post("/api/test-email-simple", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const { sendAppointmentSubmittedEmail } = await import("./emailService.js");
      
      await sendAppointmentSubmittedEmail(
        email,
        'Test Service',
        new Date(),
        'ua'
      );

      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ error: "Failed to send test email", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
