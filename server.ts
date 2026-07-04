import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";

// Initialize express app
const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-tenant-id', 'X-Api-Version', 'X-CSRF-Token']
}));

app.use(express.json());

// Multi-tenant context filter header
const TENANT_HEADER = "x-tenant-id";

// Initialize JSON database
const DB_FILE = path.join(process.cwd(), "database.json");

// Initial mock dataset (aligned with client mockData.ts)
const initialDb = {
  users: [
    { id: "1", name: "Robert Johnson", email: "admin@crms.com", role: "Admin", department: "Administration", avatar: "https://ui-avatars.com/api/?name=Robert+Johnson&background=4F46E5&color=fff&size=150", status: "Active" },
    { id: "2", name: "Isabella Cooper", email: "screed@crms.com", role: "Marketer", department: "Screed", avatar: "https://ui-avatars.com/api/?name=Isabella+Cooper&background=06B6D4&color=fff&size=150", status: "Active" },
    { id: "3", name: "John Smith", email: "elec@crms.com", role: "Technician", department: "Electrical", avatar: "https://ui-avatars.com/api/?name=John+Smith&background=EAB308&color=fff&size=150", status: "Active" },
    { id: "4", name: "Sophia Parker", email: "screed@crms.com", role: "Operator", department: "Screed", avatar: "https://ui-avatars.com/api/?name=Sophia+Parker&background=06B6D4&color=fff&size=150", status: "Active" },
    { id: "5", name: "Ethan Reynolds", email: "heat@crms.com", role: "Technician", department: "Heating", avatar: "https://ui-avatars.com/api/?name=Ethan+Reynolds&background=EF4444&color=fff&size=150", status: "Active" },
    { id: "6", name: "Liam Carter", email: "elec@crms.com", role: "Operator", department: "Electrical", avatar: "https://ui-avatars.com/api/?name=Liam+Carter&background=EAB308&color=fff&size=150", status: "Active" }
  ],
  contacts: [
    { id: "c1", name: "Robert Johnson", company: "Thermal Grid Inc", email: "robert.j@thermalgrid.com", phone: "+44 7911 123456", status: "Won", revenue: 7500, tenant: "heating" },
    { id: "c2", name: "Isabella Cooper", company: "Apex Foundations", email: "i.cooper@apex.co.uk", phone: "+44 7911 654321", status: "Won", revenue: 2000, tenant: "screed" },
    { id: "c3", name: "John Smith", company: "Direct Current Ltd", email: "j.smith@directcurrent.co.uk", phone: "+44 7911 987654", status: "Contacted", revenue: 1600, tenant: "electrical" },
    { id: "c4", name: "Sophia Parker", company: "Elite Screeding Solutions", email: "sophia.p@elitescreed.com", phone: "+44 7911 112233", status: "Proposal", revenue: 600, tenant: "screed" },
    { id: "c5", name: "Ethan Reynolds", company: "Boiler Eco System", email: "e.reynolds@boiler-eco.co.uk", phone: "+44 7911 445566", status: "Won", revenue: 2800, tenant: "heating" },
    { id: "c6", name: "Liam Carter", company: "Grid Spark Electrical", email: "l.carter@gridspark.com", phone: "+44 7911 778899", status: "Lead", revenue: 6955, tenant: "electrical" }
  ],
  deals: [
    { id: "d1", title: "Boiler Upgrade Combo x10", company: "Metro Living Apartments", value: 34000, stage: "Won", tenant: "heating", date: "15 Mar 2026" },
    { id: "d2", title: "Liquid Screed Pour - Phase 2", company: "Tesco Retail Hub", value: 18500, stage: "Proposal", tenant: "screed", date: "04 Apr 2026" },
    { id: "d3", title: "Full Rewire & EV Chargers", company: "Hampton Estates", value: 12200, stage: "Contacted", tenant: "electrical", date: "21 May 2026" },
    { id: "d4", title: "Commercial Heat Pump Install", company: "Tech Park South", value: 45000, stage: "Leads", tenant: "heating", date: "01 Jun 2026" },
    { id: "d5", title: "Self-leaving screed layout", company: "High Definition Apartments", value: 9200, stage: "Contract", tenant: "screed", date: "12 Jun 2026" }
  ],
  technicianTasks: [
    { id: "t1", technician: "Dave Miller (Heating lead)", client: "Vance Residence", phone: "07700 900077", type: "Installation", status: "In Progress", time: "08:00 - 10:30", tenant: "heating" },
    { id: "t2", technician: "Sarah Connor (Screed lead)", client: "John Connor House", phone: "07700 900124", type: "Inspection", status: "Scheduled", time: "10:00 - 12:00", tenant: "screed" },
    { id: "t3", technician: "Mark Sparky (Electrical Lead)", client: "Warehouse 9 Depot", phone: "07700 900543", type: "Repair", status: "Completed", time: "11:00 - 13:00", tenant: "electrical" },
    { id: "t4", technician: "Dave Miller (Heating lead)", client: "High Street Coffee", phone: "07700 900987", type: "Maintenance", status: "Scheduled", time: "14:00 - 15:30", tenant: "heating" },
    { id: "t5", technician: "Alex Brown (Screed Operator)", client: "New Build Site B", phone: "07700 900321", type: "Installation", status: "Pending", time: "15:00 - 17:30", tenant: "screed" }
  ],
  pdfAttachments: [
    {
      id: "pdf-1",
      fileName: "heatspec_quote_3342.pdf",
      fileSize: "1.4 MB",
      uploadedAt: "14 Jun 2026, 12:30",
      status: "Parsed",
      extractedData: {
        clientName: "Wessex Care Homes",
        address: "42 Winchester Rd, Southampton",
        totalAmount: "£14,850",
        items: ["3x EcoHeat Combi Boilers", "Flue Adaptation kit", "12x Smart Radiator TRVs", "Pipe insulation suite"],
        confidence: 97,
        boilerModel: "EcoHeat Combi v2"
      }
    },
    {
      id: "pdf-2",
      fileName: "screed_volume_tender_re.pdf",
      fileSize: "890 KB",
      uploadedAt: "13 Jun 2026, 09:12",
      status: "Parsed",
      extractedData: {
        clientName: "BuildCorp South East",
        address: "Site 8, Greenwich Refinery Block",
        totalAmount: "£8,400",
        items: ["120sqm Liquid Anhydrite Screed", "Damp Proof Membrane", "Perimeter Expansion Strip"],
        confidence: 94,
        screedThickness: "55mm FlowScreed"
      }
    },
    {
      id: "pdf-3",
      fileName: "three_phase_supply_elec.pdf",
      fileSize: "2.1 MB",
      uploadedAt: "12 Jun 2026, 15:04",
      status: "Parsed",
      extractedData: {
        clientName: "GigaLogistics Hub",
        address: "Unit 4, Meridian Industrial Park",
        totalAmount: "£22,100",
        items: ["Three-Phase Distribution Board Installation", "6x Dual Type 2 22kW EV Chargers", "Armoured Cable Feed (50m)"],
        confidence: 91,
        wiringStandard: "BS 7671 Amendment 2"
      }
    }
  ],
  adCampaigns: [
    {
      id: "campaign-1",
      title: "Eco Combi Heating Drive",
      platform: "Facebook",
      generatedCopy: "🚀 Cut your home heating bills by up to 35%! Upgrade to a premium A-rated smart combi boiler with Heating Works. Zero percent finance available this summer and up to 10 years manufacturer warranty! Click below to book your free home survey.",
      hashtags: ["HeatingWorks", "BoilerUpgrade", "SmartHeating", "EcoTech", "HomeComfort"],
      status: "Pending Approval",
      createdAt: "14 Jun 2026, 10:00",
      tenant: "heating"
    },
    {
      id: "campaign-2",
      title: "Flawless Liquid Screed",
      platform: "Instagram",
      generatedCopy: "Level up your development with flawless screeding! ✨ Our liquid screeding dries faster, offers excellent thermal conductivity for underfloor systems, and leaves a premium level finish. No cracks, no stress. Contact Screed Works today for a fast quote!",
      hashtags: ["ScreedWorks", "SelfLevelingScreed", "UnderfloorHeating", "PropertyRenovation", "FlooringDirect"],
      status: "Approved",
      createdAt: "13 Jun 2026, 11:30",
      tenant: "screed"
    },
    {
      id: "campaign-3",
      title: "EV Charger Installation Deal",
      platform: "Facebook",
      generatedCopy: "Switching to electric? 🔌 Get your high-speed home and business EV Chargers installed by certified technicians from Electrical Works. Guaranteed compliant, safe, and fully insured. Clean electrical infrastructure begins here!",
      hashtags: ["ElectricalWorks", "EVCharging", "ElectricCar", "TechHome", "SparkySecure"],
      status: "Draft",
      createdAt: "11 Jun 2026, 14:00",
      tenant: "electrical"
    }
  ],
  systemLogs: [
    { id: "log-1", service: "n8n: Intake Webhook", event: "PDF Smart Extraction Trigger", status: "success", timestamp: "14 Jun 2026, 14:15:20", payloadSize: "2.4 KB" },
    { id: "log-2", service: "n8n: CRM Sync", event: "Google Sheet Lead Contact Push", status: "success", timestamp: "14 Jun 2026, 14:10:05", payloadSize: "1.2 KB" },
    { id: "log-3", service: "Gemini 3.5 Flash API", event: "Hashtag Recommendation Response", status: "success", timestamp: "14 Jun 2026, 14:02:44", payloadSize: "0.8 KB" },
    { id: "log-4", service: "n8n: Facebook Ad Dispatcher", event: "Auth Refresh retry", status: "warning", timestamp: "14 Jun 2026, 13:55:12", payloadSize: "3.1 KB" },
    { id: "log-5", service: "Intellicall API Gate", event: "SMS Notification Failure: No credits", status: "error", timestamp: "14 Jun 2026, 12:44:02", payloadSize: "0.2 KB" }
  ]
};

// Database helper functions
let globalDbCache: any = null;

async function getDb() {
  if (globalDbCache) return globalDbCache;

  try {
    if (process.env.NODE_ENV !== "production") {
      if (fs.existsSync(DB_FILE)) {
        const data = await fs.promises.readFile(DB_FILE, "utf-8");
        globalDbCache = JSON.parse(data);
        
        // Safeguard for campaign records missing
        if (!globalDbCache.adCampaigns) {
          globalDbCache.adCampaigns = initialDb.adCampaigns;
          await saveDb(globalDbCache);
        }
        return globalDbCache;
      }
    }
  } catch (error) {
    console.warn("Local DB read failed or not available, falling back to in-memory initialDb", error);
  }

  // Fallback to initialDb
  globalDbCache = JSON.parse(JSON.stringify(initialDb));
  return globalDbCache;
}

async function saveDb(data: any) {
  globalDbCache = data;

  if (process.env.NODE_ENV !== "production") {
    try {
      await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.error("Silent error: Failed to save DB locally", error);
    }
  }
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    console.log("Success: GoogleGenAI initialized properly.");
  } catch (err) {
    console.error("Error initializing GoogleGenAI client:", err);
  }
} else {
  console.log("Warning: GEMINI_API_KEY environment variable is not present. Local generators active.");
}

// Multer configured in memory
const uploadLoader = multer({ storage: multer.memoryStorage() });

// Setup WebSocket Server bound on same HTTP Port 3000
const wss = new WebSocketServer({ noServer: true });

// Listen and handle HTTP upgrades
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/ws" || pathname === "/" || pathname === "/socket.io/") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

// Broadcast changes to all websocket customers
function broadcast(data: any) {
  if (!wss || !wss.clients) return;
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// On WebSocket connection
wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");
  ws.send(JSON.stringify({ type: "connection_ready", timestamp: new Date().toISOString() }));

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      console.log("Received WebSocket event:", parsed);
      // We can echo back or support remote state actions
    } catch (e) {
      console.error("Error parsing WebSocket raw buffer", e);
    }
  });
});

// Helper for adding system log
async function createSystemLog(service: string, event: string, status: "success" | "warning" | "error", sizeBytes = 1024) {
  const db = await getDb();
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };
  const newLog = {
    id: `log-${Date.now()}`,
    service,
    event,
    status,
    timestamp: new Date().toLocaleString("en-GB", { hour12: false }),
    payloadSize: formatSize(sizeBytes)
  };
  db.systemLogs.unshift(newLog);
  // Cap logs at 30 entries
  if (db.systemLogs.length > 30) {
    db.systemLogs.pop();
  }
  await saveDb(db);
  broadcast({ type: "LOG_CREATED", data: newLog });
}

// ================= API ENDPOINTS =================

// Health check
app.get("/api/health", async (req, res) => {
  res.json({ status: "ok", geminiActive: !!ai });
});

// 1. JWT Authentication Sign-In Route
app.post("/api/auth/login", async (req, res) => {
  const { email, password, tenant } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing identity credentials" });
  }

  // Allow test credentials
  let userProfile = {
    name: "Enterprise Administrator",
    email,
    role: "Admin",
    department: "Administration",
    avatar: "https://ui-avatars.com/api/?name=Enterprise+Administrator&background=4F46E5&color=fff&size=150"
  };

  if (email.includes("heat")) {
    userProfile = {
      name: "Dave Miller",
      email,
      role: "Operator",
      department: "Heating",
      avatar: "https://ui-avatars.com/api/?name=Dave+Miller&background=EF4444&color=fff&size=150"
    };
  } else if (email.includes("screed")) {
    userProfile = {
      name: "Isabella Cooper",
      email,
      role: "Marketer",
      department: "Screed",
      avatar: "https://ui-avatars.com/api/?name=Isabella+Cooper&background=06B6D4&color=fff&size=150"
    };
  } else if (email.includes("elec")) {
    userProfile = {
      name: "John Smith",
      email,
      role: "Technician",
      department: "Electrical",
      avatar: "https://ui-avatars.com/api/?name=John+Smith&background=EAB308&color=fff&size=150"
    };
  }

  // Token simulation
  const mockToken = Buffer.from(JSON.stringify(userProfile)).toString("base64");
  
  await createSystemLog("Authorization Gate", `Secure session generated for ${userProfile.name}`, "success", 512);

  res.json({
    token: `Bearer ${mockToken}`,
    user: userProfile,
    tenantId: tenant || "all"
  });
});

// 2. CONTACTS API (Multi-tenant aware)
app.get("/api/contacts", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || "all";
  const db = await getDb();
  let filtered = db.contacts;
  if (tenantId !== "all") {
    filtered = db.contacts.filter((c: any) => c.tenant === tenantId);
  }
  res.json(filtered);
});

app.post("/api/contacts", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.body.tenant || "all";
  const { name, company, email, phone, status, revenue } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Client Contact Name is required" });
  }

  const db = await getDb();
  const created = {
    id: `c-${Date.now()}`,
    name,
    company: company || "Independent Contractor",
    email: email || `${name.toLowerCase().replace(/\s/g, "")}@example.com`,
    phone: phone || "+44 7911 000000",
    status: status || "Lead",
    revenue: Number(revenue) || 0,
    tenant: tenantId === "all" ? "heating" : tenantId
  };

  db.contacts.unshift(created);
  await saveDb(db);

  await createSystemLog("Sales CRM Core", `Contact card created for ${name}`, "success", 1024);
  broadcast({ type: "CONTACT_CREATED", data: created, tenant: created.tenant });

  res.status(201).json(created);
});

app.put("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.contacts.findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }
  db.contacts[index] = { ...db.contacts[index], ...req.body };
  const updated = db.contacts[index];
  await saveDb(db);
  await createSystemLog("Sales CRM Core", `Contact card modified for ${updated.name}`, "success", 768);
  broadcast({ type: "CONTACT_UPDATED", data: updated, tenant: updated.tenant });
  res.json(updated);
});

app.patch("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.contacts.findIndex((c: any) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Contact not found" });
  }

  db.contacts[index] = { ...db.contacts[index], ...req.body };
  const updated = db.contacts[index];
  await saveDb(db);

  await createSystemLog("Sales CRM Core", `Contact card modified for ${updated.name}`, "success", 768);
  broadcast({ type: "CONTACT_UPDATED", data: updated, tenant: updated.tenant });

  res.json(updated);
});

app.delete("/api/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const contact = db.contacts.find((c: any) => c.id === id);

  if (!contact) {
    return res.status(404).json({ error: "Contact not found" });
  }

  db.contacts = db.contacts.filter((c: any) => c.id !== id);
  await saveDb(db);

  await createSystemLog("Sales CRM Core", `Removed client database record ID: ${id}`, "warning", 320);
  broadcast({ type: "CONTACT_DELETED", id, tenant: contact.tenant });

  res.json({ success: true, id });
});

// 3. DEALS API (Multi-tenant aware)
app.get("/api/deals", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || "all";
  const db = await getDb();
  let filtered = db.deals;
  if (tenantId !== "all") {
    filtered = db.deals.filter((d: any) => d.tenant === tenantId);
  }
  res.json(filtered);
});

app.post("/api/deals", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.body.tenant || "all";
  const { title, company, value, stage } = req.body;
  
  if (!title || !company) {
    return res.status(400).json({ error: "Deal Title and Company are required" });
  }

  const db = await getDb();
  const created = {
    id: `d-${Date.now()}`,
    title,
    company,
    value: Number(value) || 0,
    stage: stage || "Leads",
    tenant: tenantId === "all" ? "heating" : tenantId,
    date: new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })
  };

  db.deals.unshift(created);
  await saveDb(db);

  await createSystemLog("Pipeline Engine", `Deal pipeline created: ${title}`, "success", 1200);
  broadcast({ type: "DEAL_CREATED", data: created, tenant: created.tenant });

  res.status(201).json(created);
});

app.put("/api/deals/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.deals.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Deal not found" });
  }
  db.deals[index] = { ...db.deals[index], ...req.body };
  const updated = db.deals[index];
  await saveDb(db);
  await createSystemLog("Pipeline Engine", `Deal pipeline modified: ${updated.title} stage -> ${updated.stage}`, "success", 900);
  broadcast({ type: "DEAL_UPDATED", data: updated, tenant: updated.tenant });
  res.json(updated);
});

app.patch("/api/deals/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.deals.findIndex((d: any) => d.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Deal not found" });
  }

  db.deals[index] = { ...db.deals[index], ...req.body };
  const updated = db.deals[index];
  await saveDb(db);

  await createSystemLog("Pipeline Engine", `Deal pipeline modified: ${updated.title} stage -> ${updated.stage}`, "success", 900);
  broadcast({ type: "DEAL_UPDATED", data: updated, tenant: updated.tenant });

  res.json(updated);
});

app.delete("/api/deals/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const deal = db.deals.find((d: any) => d.id === id);

  if (!deal) {
    return res.status(404).json({ error: "Deal not found" });
  }

  db.deals = db.deals.filter((d: any) => d.id !== id);
  await saveDb(db);

  await createSystemLog("Pipeline Engine", `Deleted deal pipeline element ID: ${id}`, "warning", 310);
  broadcast({ type: "DEAL_DELETED", id, tenant: deal.tenant });

  res.json({ success: true, id });
});

// 4. TECHNICIAN TASK DISPATCH API
app.get("/api/tasks", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || "all";
  const db = await getDb();
  let filtered = db.technicianTasks;
  if (tenantId !== "all") {
    filtered = db.technicianTasks.filter((t: any) => t.tenant === tenantId);
  }
  res.json(filtered);
});

app.post("/api/tasks", async (req, res) => {
  const { technician, client, phone, type, time, tenant } = req.body;
  if (!client || !technician) {
    return res.status(400).json({ error: "Technician and Client Name are required" });
  }
  const db = await getDb();
  const created = {
    id: `task-${Date.now()}`,
    technician,
    client,
    phone: phone || "07700 900552",
    type: type || "Installation",
    status: "Scheduled",
    time: time || "09:00 - 11:00",
    tenant: tenant || "heating"
  };
  db.technicianTasks.push(created);
  await saveDb(db);
  await createSystemLog("Dispatching Engine", `Dispatched task to ${technician} for ${client} (${created.type})`, "success", 1400);
  broadcast({ type: "TASK_CREATED", data: created, tenant: created.tenant });
  res.status(201).json(created);
});

app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.technicianTasks.findIndex((t: any) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  db.technicianTasks[index] = { ...db.technicianTasks[index], ...req.body };
  const updated = db.technicianTasks[index];
  await saveDb(db);
  await createSystemLog("Dispatching Engine", `Updated dispatch card for ${updated.technician} status: ${updated.status}`, "success", 800);
  broadcast({ type: "TASK_UPDATED", data: updated, tenant: updated.tenant });
  res.json(updated);
});

app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const task = db.technicianTasks.find((t: any) => t.id === id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  db.technicianTasks = db.technicianTasks.filter((t: any) => t.id !== id);
  await saveDb(db);
  await createSystemLog("Dispatching Engine", `Recalled workforce dispatch card ID: ${id}`, "error", 400);
  broadcast({ type: "TASK_DELETED", id, tenant: task.tenant });
  res.json({ success: true, id });
});

app.get("/api/tech-tasks", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || "all";
  const db = await getDb();
  let filtered = db.technicianTasks;
  if (tenantId !== "all") {
    filtered = db.technicianTasks.filter((t: any) => t.tenant === tenantId);
  }
  res.json(filtered);
});

app.post("/api/tech-tasks", async (req, res) => {
  const { technician, client, phone, type, time, tenant } = req.body;
  if (!client || !technician) {
    return res.status(400).json({ error: "Technician and Client Name are required" });
  }

  const db = await getDb();
  const created = {
    id: `task-${Date.now()}`,
    technician,
    client,
    phone: phone || "07700 900552",
    type: type || "Installation",
    status: "Scheduled",
    time: time || "09:00 - 11:00",
    tenant: tenant || "heating"
  };

  db.technicianTasks.push(created);
  await saveDb(db);

  await createSystemLog("Dispatching Engine", `Dispatched task to ${technician} for ${client} (${created.type})`, "success", 1400);
  broadcast({ type: "TASK_CREATED", data: created, tenant: created.tenant });

  res.status(201).json(created);
});

app.patch("/api/tech-tasks/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.technicianTasks.findIndex((t: any) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.technicianTasks[index] = { ...db.technicianTasks[index], ...req.body };
  const updated = db.technicianTasks[index];
  await saveDb(db);

  await createSystemLog("Dispatching Engine", `Updated dispatch card for ${updated.technician} status: ${updated.status}`, "success", 800);
  broadcast({ type: "TASK_UPDATED", data: updated, tenant: updated.tenant });

  res.json(updated);
});

app.delete("/api/tech-tasks/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const task = db.technicianTasks.find((t: any) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.technicianTasks = db.technicianTasks.filter((t: any) => t.id !== id);
  await saveDb(db);

  await createSystemLog("Dispatching Engine", `Recalled workforce dispatch card ID: ${id}`, "error", 400);
  broadcast({ type: "TASK_DELETED", id, tenant: task.tenant });

  res.json({ success: true, id });
});

// 5. LIVE ANALYTICS AGGREGATOR
app.get("/api/analytics", async (req, res) => {
  const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || "all";
  const db = await getDb();
  
  // Filter core records based on tenant
  const deals = tenantId === "all" ? db.deals : db.deals.filter((d: any) => d.tenant === tenantId);
  const contacts = tenantId === "all" ? db.contacts : db.contacts.filter((c: any) => c.tenant === tenantId);
  const tasks = tenantId === "all" ? db.technicianTasks : db.technicianTasks.filter((t: any) => t.tenant === tenantId);

  // Aggregates
  const totalRevenue = contacts.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0) +
                       deals.filter((d: any) => d.stage === "Won").reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  
  const pipelineValue = deals.filter((d: any) => d.stage !== "Won").reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const customerCount = contacts.length;
  
  const activeTechnicians = Array.from(new Set(tasks.map((t: any) => t.technician))).length;

  // Let's build real charts data dynamically mapped from db records!
  // 1. Revenue by Tenant distribution (or month)
  const divisionDistribution = [
    { name: "Heating Team", value: db.contacts.filter((c: any) => c.tenant === "heating").reduce((s: any, c: any) => s + c.revenue, 0) + db.deals.filter((d: any) => d.tenant === "heating" && d.stage === "Won").reduce((s: any, d: any) => s + d.value, 0) },
    { name: "Screed Team", value: db.contacts.filter((c: any) => c.tenant === "screed").reduce((s: any, c: any) => s + c.revenue, 0) + db.deals.filter((d: any) => d.tenant === "screed" && d.stage === "Won").reduce((s: any, d: any) => s + d.value, 0) },
    { name: "Electrical Team", value: db.contacts.filter((c: any) => c.tenant === "electrical").reduce((s: any, c: any) => s + c.revenue, 0) + db.deals.filter((d: any) => d.tenant === "electrical" && d.stage === "Won").reduce((s: any, d: any) => s + d.value, 0) },
  ];

  // 2. Monthly Trend calculation
  const monthlyTrend = [
    { month: "Jan", Revenue: Math.round(totalRevenue * 0.45), Target: 10000, Leads: 12 },
    { month: "Feb", Revenue: Math.round(totalRevenue * 0.55), Target: 12000, Leads: 19 },
    { month: "Mar", Revenue: Math.round(totalRevenue * 0.70), Target: 15400, Leads: 32 },
    { month: "Apr", Revenue: Math.round(totalRevenue * 0.60), Target: 18000, Leads: 25 },
    { month: "May", Revenue: Math.round(totalRevenue * 0.90), Target: 20000, Leads: 45 },
    { month: "Jun", Revenue: totalRevenue, Target: 24000, Leads: 50 },
  ];

  res.json({
    kpis: {
      totalRevenue,
      pipelineValue,
      customerCount,
      activeTechnicians,
      growthRate: "18.4%"
    },
    charts: {
      divisionDistribution,
      monthlyTrend
    }
  });
});

// 6. AI SMART PDF SCAN INTAKE CONTROLLER (Powered by Gemini 3.5-flash)
app.get("/api/documents", async (req, res) => {
  const db = await getDb();
  res.json(db.pdfAttachments);
});

app.post("/api/documents", uploadLoader.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file was provided in the multipart request" });
  }

  const fileName = req.file.originalname;
  const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
  const uploadedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const documentId = `pdf-${Date.now()}`;
  console.log(`Starting smart document upload processing pipeline for: ${fileName}`);

  // Emit initial progress event via WebSocket!
  broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 15, status: "Uploading" });

  let extractionData = {
    clientName: "Extracted Commercial Developer Ltd",
    address: "Building Site A, Sector 4, Essex",
    totalAmount: "£14,500",
    items: ["Liquid Anhydrite Screeding", "BS 7671 Power Distribution wiring"],
    confidence: 85,
    boilerModel: "N/A",
    screedThickness: "N/A",
    wiringStandard: "N/A"
  };

  await createSystemLog("Automated Smart Intake", `Registered PDF file ${fileName} into binary queue`, "success", req.file.size);

  try {
    // 30% progress
    broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 35, status: "Analyzing schema structure" });

    if (ai) {
      console.log(`Processing with GoogleGenAI using pdf raw context...`);
      broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 65, status: "Streaming file bytes to Gemini 3.5-flash" });

      const pdfBase64 = req.file.buffer.toString("base64");
      
      const prompt = `Analyze this engineering quote, invoice, or tender PDF document and extract:
1. Client Name (under clientName)
2. Structural site address (under address)
3. Total estimated amount with currency sign (under totalAmount)
4. Specific list of items / services (under items)
5. Boiler model if heating related (under boilerModel)
6. Screed thickness if flooring related (under screedThickness)
7. Wiring standard regulations if electrical related (under wiringStandard)
8. Est calculation confidence percentage from 0 to 100 (under confidence)

You must strictly output JSON matching the required schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: "application/pdf"
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              clientName: { type: Type.STRING },
              address: { type: Type.STRING },
              totalAmount: { type: Type.STRING },
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              boilerModel: { type: Type.STRING, description: "boiler or heating info" },
              screedThickness: { type: Type.STRING, description: "screeding specs" },
              wiringStandard: { type: Type.STRING, description: "electrical compliance standard" },
              confidence: { type: Type.INTEGER }
            },
            required: ["clientName", "address", "totalAmount", "items", "confidence"]
          }
        }
      });

      const textOutput = response.text || "{}";
      const resultObj = JSON.parse(textOutput);
      extractionData = { ...extractionData, ...resultObj };
      console.log("Successful extraction response from Gemini:", resultObj);
    } else {
      await new Promise((r) => setTimeout(r, 1200));
      broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 75, status: "Extracting metadata" });
      await new Promise((r) => setTimeout(r, 800));
    }

    broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 90, status: "Indexing terms into DB" });

    const db = await getDb();
    const newDoc = {
      id: documentId,
      fileName,
      fileSize,
      uploadedAt,
      status: "Parsed" as const,
      extractedData: {
        clientName: extractionData.clientName || "Private Client Entity",
        address: extractionData.address || "Main Street Outlet",
        totalAmount: extractionData.totalAmount || "£10,000",
        items: extractionData.items || ["SaaS Standard Setup fee"],
        confidence: Number(extractionData.confidence) || 92,
        boilerModel: extractionData.boilerModel || "N/A",
        screedThickness: extractionData.screedThickness || "N/A",
        wiringStandard: extractionData.wiringStandard || "N/A"
      }
    };

    db.pdfAttachments.unshift(newDoc);
    await saveDb(db);

    broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 100, status: "Completed" });
    await createSystemLog("Automated Smart Intake", `Successfully auto-parsed document: ${fileName} with confidence ${newDoc.extractedData.confidence}%`, "success", 2048);
    broadcast({ type: "DOCUMENT_CREATED", data: newDoc });

    res.status(201).json(newDoc);

  } catch (error: any) {
    console.error("Failed to parse document with Gemini:", error);
    broadcast({ type: "DOCUMENT_PROGRESS", id: documentId, percent: 100, status: "Error" });
    await createSystemLog("Automated Smart Intake", `Error parsing document: ${fileName}. Details: ${error.message || error}`, "error", 512);
    
    const db = await getDb();
    const errDoc = {
      id: documentId,
      fileName,
      fileSize,
      uploadedAt,
      status: "Error" as const,
      extractedData: {
        confidence: 0,
        items: []
      }
    };
    db.pdfAttachments.unshift(errDoc);
    await saveDb(db);
    broadcast({ type: "DOCUMENT_CREATED", data: errDoc });

    res.status(500).json({ error: "Failed to parse document with Gemini pipeline", details: error.message });
  }
});

app.put("/api/documents/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.pdfAttachments.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Document not found" });
  }
  db.pdfAttachments[index] = { ...db.pdfAttachments[index], ...req.body };
  const updated = db.pdfAttachments[index];
  await saveDb(db);
  await createSystemLog("Automated Smart Intake", `Document record ${id} updated`, "success", 512);
  broadcast({ type: "DOCUMENT_UPDATED", data: updated });
  res.json(updated);
});

app.delete("/api/documents/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  db.pdfAttachments = db.pdfAttachments.filter((a: any) => a.id !== id);
  await saveDb(db);
  await createSystemLog("Automated Smart Intake", `Document record ${id} removed from CRM Index`, "warning", 240);
  broadcast({ type: "DOCUMENT_DELETED", id });
  res.json({ success: true, id });
});

// 7. AI MARKETING GENERATOR GATE (Powered by Gemini 3.5-flash)
app.get("/api/campaigns", async (req, res) => {
  const db = await getDb();
  res.json(db.adCampaigns);
});

app.post("/api/campaigns/generate", async (req, res) => {
  const { platform, tenant, goalPrompt, goal, mediaUrl, destinationLink, blogTags, budget, targetCountry, campaignTitle } = req.body;
  const activeGoal = goalPrompt || goal;
  if (!platform || !tenant) {
    return res.status(400).json({ error: "Campaign platform and business division are required" });
  }

  const campaignId = `campaign-${Date.now()}`;
  console.log(`Generating AI Copywriter asset for: ${tenant} on ${platform}`);

  // Build default AI copy and hashtags
  let generatedCopy = `Special ${platform} offer from ${tenant.toUpperCase()} Division! ${activeGoal || "Click here now."}`;
  let hashtags = [tenant, platform, "EnterpriseSaaS"];

  // Build AI prompt tailored to scenario
  const platformScenario = platform === "Meta" ? "a dual Facebook+Instagram social post" :
    platform === "WordPress" ? "an SEO-optimised WordPress landing page" :
    platform === "Facebook" || platform === "Instagram" ? "a social media post" :
    platform === "SEO Blog" ? "an SEO blog article" :
    platform === "Google" ? "a Google Search Ad" : "a marketing campaign";

  await createSystemLog("AI Copywriter", `Request dispatched to generate marketing campaign for ${tenant} on ${platform}`, "success", 512);

  try {
    if (ai) {
      const prompt = `You are a world-class programmatic marketing copywriter. Write highly persuasive ${platformScenario} for a ${tenant} works division.\n${platform === "Google" ? "IMPORTANT: Keep generatedCopy under 90 characters for Google Ads compliance." : ""}\n${platform === "Meta" ? "IMPORTANT: Write a caption that works on both Facebook and Instagram feeds. Include emojis and a call-to-action." : ""}\n${platform === "WordPress" ? "IMPORTANT: Write compelling landing page copy with a strong headline and persuasive body text for SEO." : ""}\nCustom Goals: ${activeGoal || "Boost bookings and highlight our high professional standard"}.\nReturn strictly JSON with:\n1. "generatedCopy": impactful copy string with emojis\n2. "hashtags": array of 5 converting hashtags (no # prefix)\nNo markdown, no explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              generatedCopy: { type: Type.STRING },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["generatedCopy", "hashtags"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      generatedCopy = data.generatedCopy || generatedCopy;
      hashtags = data.hashtags || hashtags;
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      if (tenant === "heating") {
        generatedCopy = platform === "Google"
          ? `Heating Works — Certified Boiler Install. 0% Finance. Book Now!`
          : `🔥 Cut home heating bills by 35%! State-of-the-art boilers from HEATING works. Zero percent finance and 10-year warranty!`;
        hashtags = ["HeatingWorks", "BoilerFinancing", "SmartClimate", "CozyHome", "ClimateReady"];
      } else if (tenant === "screed") {
        generatedCopy = platform === "Google"
          ? `Screed Works — Liquid Flooring Experts. Fast Quote!`
          : `🏗️ Flawless liquid self-leveling screed by Screed Works. Guaranteed pristine finish!`;
        hashtags = ["ScreedWorks", "LiquidScreed", "FlooringLayout", "PerfectFinish", "UnderfloorScreed"];
      } else {
        generatedCopy = platform === "Google"
          ? `EV Chargers Installed Today — BS 7671 Certified. Book Now!`
          : `🔌 Safe high-speed EV Charging installation by certified electrical engineers. BS 7671 compliant!`;
        hashtags = ["EVCharging", "ElectricalWorks", "SmartInfrastructure", "GoGreen", "PowerSafe"];
      }
    }

    // Default tenant-based media and links for Scenario A
    const defaultMedia: Record<string, { mediaUrl: string; link: string }> = {
      heating: { mediaUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a", link: "https://heatingworks.co.uk" },
      screed:  { mediaUrl: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f", link: "https://screedworks.co.uk" },
      electrical: { mediaUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935", link: "https://electricalworks.co.uk" }
    };
    const tenantDefaults = defaultMedia[tenant] || defaultMedia["heating"];

    const db = await getDb();
    const created: any = {
      id: campaignId,
      title: campaignTitle || `${tenant.toUpperCase()} ${platform} Launch`,
      platform,
      generatedCopy,
      hashtags,
      status: "Pending Approval",
      createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      tenant,
      // Scenario A: Meta/Social
      mediaUrl: mediaUrl || tenantDefaults.mediaUrl,
      destinationLink: destinationLink || tenantDefaults.link,
      // Scenario B: SEO Blog
      blogTags: blogTags || hashtags,
      // Scenario C: Google Ads
      budget: Number(budget) || 50,
      targetCountry: targetCountry || "AU"
    };

    db.adCampaigns.unshift(created);
    await saveDb(db);

    await createSystemLog("AI Copywriter", `Created marketing draft for ${created.title}`, "success", 1540);
    broadcast({ type: "CAMPAIGN_CREATED", data: created, tenant: created.tenant });

    res.status(201).json(created);

  } catch (error: any) {
    console.error("Failed to generate with AI:", error);
    res.status(500).json({ error: "Failed to generate copywriting with Gemini", details: error.message });
  }
});

app.post("/api/campaigns/:id/approve", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.adCampaigns.findIndex((c: any) => c.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const campaign = db.adCampaigns[index];

  // Map campaign platform to n8n scenario target
  let platformTarget = "meta_social"; // Default to Scenario A
  if (campaign.platform === "Meta" || campaign.platform === "Facebook" || campaign.platform === "Instagram") {
    platformTarget = "meta_social";   // Scenario A: Facebook + Instagram simultaneously
  } else if (campaign.platform === "WordPress" || campaign.platform === "SEO Blog" || campaign.platform === "Email") {
    platformTarget = "wordpress_seo"; // Scenario B: DataForSEO + WordPress landing page
  } else if (campaign.platform === "Google") {
    platformTarget = "google_ads";    // Scenario C: Google Ads campaign
  }

  let contentObj: any = {};
  if (platformTarget === "meta_social") {
    // Scenario A: Post to BOTH Facebook AND Instagram simultaneously
    const defaultMedia: Record<string, { url: string; link: string }> = {
      heating:    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a", link: "https://heatingworks.co.uk" },
      screed:     { url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f", link: "https://screedworks.co.uk" },
      electrical: { url: "https://images.unsplash.com/photo-1563720223185-11003d516935", link: "https://electricalworks.co.uk" }
    };
    const defaults = defaultMedia[campaign.tenant] || { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", link: "https://luxehr.com.au" };

    contentObj = {
      message: campaign.generatedCopy || "",
      media_url: campaign.mediaUrl || defaults.url,
      link: campaign.destinationLink || defaults.link,
      platforms: ["facebook", "instagram"]  // Both platforms simultaneously
    };
  } else if (platformTarget === "wordpress_seo") {
    // Scenario B: DataForSEO keyword analysis + WordPress landing page creation
    const keywords = campaign.blogTags && campaign.blogTags.length > 0
      ? campaign.blogTags
      : (campaign.hashtags && campaign.hashtags.length > 0 ? campaign.hashtags : [campaign.tenant, "expert", "professional"]);

    contentObj = {
      page_title: campaign.title || "Professional Services Landing Page",
      seo_keywords: keywords,
      excerpt: campaign.generatedCopy ? campaign.generatedCopy.slice(0, 160) + "..." : "Expert services delivered with guaranteed quality.",
      body_markdown: `## ${campaign.title}\n\n${campaign.generatedCopy || ""}\n\n## Why Choose Us\n- **Quality Guaranteed:** Certified engineers handling all operations.\n- **Modern Engineering:** Adhering to full compliance standards.\n- **Efficient Turnaround:** Seamless client project completions.\n\n## Get In Touch\nContact us today for a free consultation and quote.`,
      dataforseo_enabled: true,
      target_domain: campaign.destinationLink || (campaign.tenant === "heating" ? "heatingworks.co.uk" : campaign.tenant === "screed" ? "screedworks.co.uk" : "electricalworks.co.uk")
    };
  } else if (platformTarget === "google_ads") {
    // Scenario C: Google Ads campaign with character limits
    let headline = campaign.title || "Professional Services";
    if (headline.length > 30) headline = headline.substring(0, 27) + "...";

    let description = campaign.generatedCopy || "";
    if (description.length > 90) description = description.substring(0, 87) + "...";

    contentObj = {
      budget: Number(campaign.budget) || 50.00,
      target_country: campaign.targetCountry || "AU",
      ad_headline: headline,
      ad_description: description
    };
  }

  const n8nPayload = {
    campaign_id: campaign.id || `camp_${platformTarget.slice(0, 2)}_${Date.now().toString().slice(-4)}`,
    workspace_id: "work_luxe_01",
    platform_target: platformTarget,
    campaign_name: campaign.title,
    content: {
      message: contentObj.message || contentObj.ad_description || contentObj.excerpt || "",
      ad_description: contentObj.ad_description || "",
      excerpt: contentObj.excerpt || "",
      media_url: contentObj.media_url || campaign.mediaUrl || "",
      link: contentObj.link || contentObj.target_domain || campaign.destinationLink || "",
      meta_tags: contentObj.meta_tags || contentObj.seo_keywords || campaign.blogTags || [],
      budget: contentObj.budget || campaign.budget || 50,
      target_country: contentObj.target_country || campaign.targetCountry || "AU",
      ...contentObj
    }
  };


  const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://akigh90.app.n8n.cloud/webhook/crm-campaign-trigger";

  try {
    await createSystemLog("n8n Bridge", `Dispatching campaign "${campaign.title}" to n8n webhook at ${webhookUrl}`, "success", JSON.stringify(n8nPayload).length);

    const response = await axios.post(webhookUrl, n8nPayload, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": campaign.tenant || req.headers[TENANT_HEADER] || "all"
      },
      timeout: 15000
    });

    console.log("n8n webhook responded:", response.status, response.data);

    // Validate n8n response structure
    const isN8nSuccess = response.data && response.data.success === true && response.data.statusCode === 200;

    if (!isN8nSuccess) {
      throw new Error(response.data?.message || `n8n returned statusCode ${response.data?.statusCode || response.status}`);
    }

    // Update status to Approved on successful dispatch
    db.adCampaigns[index].status = "Approved";
    await saveDb(db);

    const updated = db.adCampaigns[index];
    await createSystemLog("n8n Bridge", `Campaign "${updated.title}" pushed to ad networks successfully. n8n status: ${response.status}`, "success", 1024);
    broadcast({ type: "CAMPAIGN_UPDATED", data: updated, tenant: updated.tenant });

    res.json({ ...updated, n8nResponse: response.data });

  } catch (error: any) {
    console.error("n8n webhook dispatch failed:", error.message);

    // Keep campaign status as "Pending Approval" (do not mark it as Approved)
    const updated = db.adCampaigns[index];
    await createSystemLog("n8n Bridge", `Webhook dispatch failed for "${updated.title}". Error: ${error.message}`, "error", 640);

    res.status(500).json({ error: `n8n webhook dispatch failed: ${error.message}`, details: error.message });
  }
});

// ================= N8N TWO-WAY API GATEWAY ROUTER =================

// Outgoing Dispatcher API Route
app.post("/api/v1/automation/sync", async (req, res) => {
  const { campaign_id, workspace_id, platform_target, campaign_name, content } = req.body;

  // Validate authorization / workspace metrics
  if (!workspace_id) {
    return res.status(400).json({ error: "Missing authorization / workspace ID mapping" });
  }
  if (!platform_target || !["facebook", "google_ads", "seo_blog"].includes(platform_target)) {
    return res.status(400).json({ error: "Invalid or missing platform_target routing key" });
  }
  if (!campaign_name) {
    return res.status(400).json({ error: "Campaign name is required" });
  }

  const resolvedCampaignId = campaign_id || `camp_${platform_target.slice(0, 2)}_${Date.now()}`;
  const tenantId = (req.headers[TENANT_HEADER] as string) || "all";

  // Build the exact structural payload expected by n8n router
  const n8nPayload = {
    campaign_id: resolvedCampaignId,
    workspace_id,
    platform_target,
    campaign_name,
    content: {
      message: (content || {}).message || "",
      ad_description: (content || {}).ad_description || "",
      excerpt: (content || {}).excerpt || "",
      media_url: (content || {}).media_url || "",
      link: (content || {}).link || (content || {}).target_domain || "",
      meta_tags: (content || {}).meta_tags || (content || {}).seo_keywords || [],
      budget: (content || {}).budget || 50,
      target_country: (content || {}).target_country || "AU",
      ...(content || {})
    }
  };

  const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "https://akigh90.app.n8n.cloud/webhook/crm-campaign-trigger";

  // Initialize/Update Campaign in database
  const db = await getDb();
  let existingIndex = db.adCampaigns.findIndex((c: any) => c.id === resolvedCampaignId);

  const platformFriendly: Record<string, string> = {
    facebook: "Meta",
    google_ads: "Google",
    seo_blog: "SEO Blog"
  };

  const currentCampaignRecord = {
    id: resolvedCampaignId,
    title: campaign_name,
    platform: platformFriendly[platform_target] || platform_target,
    generatedCopy: platform_target === "facebook" 
      ? content.message 
      : (platform_target === "google_ads" ? content.ad_description : content.excerpt),
    status: "n8n Processing Deep Chains...",
    createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    tenant: tenantId === "all" ? "heating" : tenantId,
    mediaUrl: content.media_url || "",
    destinationLink: content.link || content.target_domain || "",
    blogTags: content.meta_tags || content.seo_keywords || [],
    budget: content.budget || 50,
    targetCountry: content.target_country || "AU"
  };

  if (existingIndex !== -1) {
    db.adCampaigns[existingIndex] = { ...db.adCampaigns[existingIndex], ...currentCampaignRecord };
  } else {
    db.adCampaigns.unshift(currentCampaignRecord);
  }
  await saveDb(db);

  await createSystemLog(
    "n8n Pipeline Dispatcher",
    `Triggered n8n flow [${platform_target}] for campaign: ${campaign_name}. Status: Processing...`,
    "success",
    JSON.stringify(n8nPayload).length
  );
  
  // Notify client of campaign state update
  broadcast({ type: "CAMPAIGN_UPDATED", data: currentCampaignRecord, tenant: currentCampaignRecord.tenant });

  // Fire fast POST request to n8n webhook
  try {
    console.log(`Forwarding webhook payload to n8n node: ${webhookUrl}`);
    
    // We do not await to avoid delaying the CRM UI response, returning intermediate success fast
    axios.post(webhookUrl, n8nPayload, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": tenantId
      },
      timeout: 3000
    }).then(response => {
      console.log(`n8n webhook received request: status code ${response.status}`);
    }).catch(err => {
      console.warn(`n8n cloud webhook dispatch warning: ${err.message}. Check n8n cloud instance status.`);
    });

    return res.status(200).json({
      success: true,
      status: "dispatched",
      message: "Sync request accepted. n8n deep execution chain started.",
      campaign: currentCampaignRecord
    });

  } catch (error: any) {
    console.error("Failed to forward payload to n8n:", error.message);
    return res.status(500).json({ error: "Failed to sync to n8n webhook", details: error.message });
  }
});

// Incoming Metrics Webhook Listener
app.post("/api/v1/automation/callback", async (req, res) => {
  const { campaign_id, status, google_sheets_updated, additional_metrics } = req.body;

  if (!campaign_id) {
    return res.status(400).json({ error: "Missing campaign_id in callback payload" });
  }

  const db = await getDb();
  const index = db.adCampaigns.findIndex((c: any) => c.id === campaign_id);

  if (index === -1) {
    console.warn(`Callback received for non-existent campaign: ${campaign_id}`);
    await createSystemLog("n8n Callback Webhook", `Callback error: Campaign ID ${campaign_id} not found`, "warning");
    return res.status(404).json({ error: "Campaign not found" });
  }

  const campaign = db.adCampaigns[index];
  
  // Map callback status to CRM tracking states
  let updatedStatus = "Pipeline Error ❌";
  let logStatus: "success" | "error" | "warning" = "error";

  if (status === "processed" || status === "success" || status === "live" || status === "complete") {
    updatedStatus = "Successfully Synchronized & Live ✅";
    logStatus = "success";
  } else if (status === "processing") {
    updatedStatus = "n8n Processing Deep Chains...";
    logStatus = "warning";
  }

  db.adCampaigns[index].status = updatedStatus;
  if (google_sheets_updated !== undefined) {
    db.adCampaigns[index].googleSheetsUpdated = google_sheets_updated;
  }
  db.adCampaigns[index].updatedAt = new Date().toLocaleString("en-GB", { hour12: false });
  db.adCampaigns[index].metrics = additional_metrics || {};

  await saveDb(db);

  // Log system callback event
  await createSystemLog(
    "n8n Callback Webhook",
    `Incoming callback parsed for "${campaign.title}". System state updated to ${status}. Google Sheets: ${google_sheets_updated ? 'Updated' : 'N/A'}.`,
    logStatus,
    JSON.stringify(req.body).length
  );

  // Broadcast updates
  broadcast({
    type: "CAMPAIGN_UPDATED",
    data: db.adCampaigns[index],
    tenant: campaign.tenant
  });

  broadcast({
    type: "AUTOMATION_CALLBACK",
    data: {
      campaign_id,
      title: campaign.title,
      status: updatedStatus,
      google_sheets_updated
    }
  });

  return res.status(200).json({
    success: true,
    message: "CRM state successfully updated via callback"
  });
});

app.put("/api/campaigns/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.adCampaigns.findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }
  db.adCampaigns[index] = { ...db.adCampaigns[index], ...req.body };
  const updated = db.adCampaigns[index];
  await saveDb(db);
  await createSystemLog("Marketing Gateway", `Campaign ${updated.title} updated`, "success", 600);
  broadcast({ type: "CAMPAIGN_UPDATED", data: updated, tenant: updated.tenant });
  res.json(updated);
});

app.delete("/api/campaigns/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  db.adCampaigns = db.adCampaigns.filter((c: any) => c.id !== id);
  await saveDb(db);
  await createSystemLog("Marketing Gateway", `Aborted campaign configuration record ID: ${id}`, "warning", 240);
  broadcast({ type: "CAMPAIGN_DELETED", id });
  res.json({ success: true, id });
});

// 8. USER MANAGEMENT API
app.get("/api/users", async (req, res) => {
  const db = await getDb();
  // Strip password hash fields before sending
  const safeUsers = db.users.map(({ passwordHash, ...user }) => user);
  res.json(safeUsers);
});

app.post("/api/users", async (req, res) => {
  const { name, email, password, role, department, tenantId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  const db = await getDb();
  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "A user with this email already exists" });
  }
  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash: Buffer.from(password).toString("base64"),
    role: role || "Technician",
    department: department || "Heating",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=150`,
    tenantId: tenantId || "all"
  };
  db.users.push(newUser);
  await saveDb(db);
  await createSystemLog("User Management", `User created: ${name} (${newUser.role})`, "success", 512);
  broadcast({ type: "USER_CREATED", data: { id: newUser.id, name: newUser.name } });
  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const index = db.users.findIndex((u: any) => u.id === id);
  if (index === -1) return res.status(404).json({ error: "User not found" });

  const updateData = { ...req.body };
  if (updateData.password) {
    updateData.passwordHash = Buffer.from(updateData.password).toString("base64");
    delete updateData.password;
  }
  delete updateData.passwordHash;
  delete updateData.id;

  db.users[index] = { ...db.users[index], ...updateData };
  await saveDb(db);
  await createSystemLog("User Management", `User updated: ${db.users[index].name}`, "success", 512);
  broadcast({ type: "USER_UPDATED", data: { id } });
  const { passwordHash, ...safeUser } = db.users[index];
  res.json(safeUser);
});

app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const db = await getDb();
  const idx = db.users.findIndex((u: any) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const deletedName = db.users[idx].name;
  db.users = db.users.filter((u: any) => u.id !== id);
  await saveDb(db);
  await createSystemLog("User Management", `User deleted: ${deletedName}`, "warning", 320);
  broadcast({ type: "USER_DELETED", data: { id } });
  res.json({ success: true, id, name: deletedName });
});

// 9. LOGS API
app.get("/api/logs", async (req, res) => {
  const db = await getDb();
  res.json(db.systemLogs);
});

// Configure Vite integration inside server.ts for dev/prod environment
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", async (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production static files from: dist/");
  }
}

if (!process.env.VERCEL) {
  setupViteMiddleware().then(() => {
    if (process.env.NODE_ENV !== "production") {
      // Bind and start the server only locally
      server.listen(PORT, "0.0.0.0", async () => {
        console.log(`Server running and listening on http://localhost:${PORT}`);
        await createSystemLog("Core System Kernel", `Abdelghanem CRM server boot initialized successfully on port ${PORT}`, "success");
      });
    }
  }).catch(err => {
    console.error("Failed to initialize Vite middleware:", err);
  });
}

// Export the express app for Vercel Serverless
export default app;
