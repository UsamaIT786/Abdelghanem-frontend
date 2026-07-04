require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = require('./db');
const { verifyTokenAndTenant, authorizeRoles } = require('./middleware/auth');
const crmController = require('./controllers/crmController');
const aiController = require('./controllers/aiController');
const userController = require('./controllers/userController');

// Configuration
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || '*';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_abdelghanem_jwt_secret_token_12345_v2';

// Init Core Express App & HTTP Wrapper
const app = express();
const server = http.createServer(app);

// Setup Socket.io Gateway with customized CORS permission profiles
const io = socketIo(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Attach Socket.io server to App context so controllers can fire events
app.set('io', io);

// Global Middlewares
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Setup Multer to handle high-speed in-memory PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit limit
});

// ==========================================
// SOCKET.IO REAL-TIME ROUTING GATEWAY
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to SaaS WebSocket. ID: ${socket.id}`);

  // Dynamic Room Subscription - isolating broadcasts to division modules
  socket.on('join_room', (tenantId) => {
    // Leave previous tenant rooms (excluding self id) to avoid double bindings
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });

    const activeRoom = tenantId || 'all';
    socket.join(activeRoom);
    console.log(`👥 Client ${socket.id} subscribed to Tenant Room: [${activeRoom}]`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected. ID: ${socket.id}`);
  });
});

// ==========================================
// AUTHENTICATION REGISTER & TOKEN ISSUANCE
// ==========================================

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please submit email and password credentials.' });
    }

    const DEFAULT_DEMO_USERS = [
      { email: "admin@crms.com", password: "admin123", role: "Admin", name: "Super Admin Panel", tenantId: "all" },
      { email: "heat@crms.com", password: "admin123", role: "Operator", name: "Heating Works", tenantId: "heating" },
      { email: "screed@crms.com", password: "admin123", role: "Marketer", name: "Screed Works", tenantId: "screed" },
      { email: "elec@crms.com", password: "admin123", role: "Technician", name: "Electrical Works", tenantId: "electrical" }
    ];

    let user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    let isDemoUser = false;

    if (!user) {
      const demoUser = DEFAULT_DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (demoUser) {
        user = {
          id: `demo-${Date.now()}`,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          tenantId: demoUser.tenantId,
          passwordHash: demoUser.password
        };
        isDemoUser = true;
      } else {
        return res.status(401).json({ error: 'Provided email address not recognized on database.' });
      }
    }

    // Verify tenant authorization matching
    if (tenantId && user.tenantId !== 'all' && user.tenantId !== tenantId) {
      return res.status(403).json({ error: `Operational restrictions: User is authorized for '${user.tenantId}' only.` });
    }

    const passwordMatches = isDemoUser 
      ? (password === user.passwordHash)
      : await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid security password. Please re-authenticate.' });
    }

    // Sign complete payload representing the operational tenant security profile
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId === 'all' ? (tenantId || 'all') : user.tenantId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      token,
      tenantId: tokenPayload.tenantId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Internal Auth Service Error: ' + err.message });
  }
});

// Validate Identity Route
app.get('/api/auth/me', verifyTokenAndTenant, (req, res) => {
  res.json({ user: req.user, tenantId: req.tenantId });
});

// ==========================================
// SECURED CRM ROUTING DEFINITION
// ==========================================

// Contacts CRM Module mapping
app.get('/api/contacts', verifyTokenAndTenant, crmController.getContacts);
app.post('/api/contacts', verifyTokenAndTenant, crmController.createContact);
app.put('/api/contacts/:id', verifyTokenAndTenant, authorizeRoles('Admin', 'Operator'), crmController.updateContact);
app.delete('/api/contacts/:id', verifyTokenAndTenant, authorizeRoles('Admin'), crmController.deleteContact);

// Pipeline Opportunities mapping
app.get('/api/deals', verifyTokenAndTenant, crmController.getDeals);
app.post('/api/deals', verifyTokenAndTenant, crmController.createDeal);
app.put('/api/deals/:id', verifyTokenAndTenant, authorizeRoles('Admin', 'Operator', 'Marketer'), crmController.updateDeal);
app.delete('/api/deals/:id', verifyTokenAndTenant, authorizeRoles('Admin'), crmController.deleteDeal);

// Schedular Dispatch and Technician Tasks routing module
app.get('/api/tasks', verifyTokenAndTenant, crmController.getTasks);
app.post('/api/tasks', verifyTokenAndTenant, authorizeRoles('Admin', 'Operator'), crmController.createTask);
app.put('/api/tasks/:id', verifyTokenAndTenant, crmController.updateTask);
app.delete('/api/tasks/:id', verifyTokenAndTenant, authorizeRoles('Admin'), crmController.deleteTask);

// ==========================================
// SECURED AI ENGAGEMENT ROUTING DEFINITION
// ==========================================

// PDF Smart Intake OCR
app.get('/api/documents', verifyTokenAndTenant, aiController.getDocuments);
app.post('/api/documents', verifyTokenAndTenant, upload.single('file'), aiController.uploadDocument);
app.put('/api/documents/:id', verifyTokenAndTenant, authorizeRoles('Admin', 'Operator'), aiController.updateDocument);
app.delete('/api/documents/:id', verifyTokenAndTenant, authorizeRoles('Admin'), aiController.deleteDocument);

// Marketing Copy Synthesis Route
app.get('/api/campaigns', verifyTokenAndTenant, aiController.getCampaigns);
app.post('/api/campaigns', verifyTokenAndTenant, authorizeRoles('Admin', 'Marketer'), aiController.generateCampaign);
app.put('/api/campaigns/:id', verifyTokenAndTenant, authorizeRoles('Admin', 'Marketer'), aiController.updateCampaign);
app.patch('/api/campaigns/:id/approve', verifyTokenAndTenant, authorizeRoles('Admin', 'Operator', 'Marketer'), aiController.approveCampaign);
app.delete('/api/campaigns/:id', verifyTokenAndTenant, authorizeRoles('Admin', 'Marketer'), aiController.deleteCampaign);

// ==========================================
// SYSTEM ANALYTICS & DASHBOARD METRICS
// ==========================================
app.get(['/api/analytics', '/api/v1/analytics'], verifyTokenAndTenant, (req, res) => {
  try {
    const totalRevenue = db.contacts.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    const pipelineValue = db.deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const customerCount = db.contacts.length;
    const activeTechnicians = db.users.filter(u => u.role === 'Technician').length;

    let heatingRev = 0, screedRev = 0, electricalRev = 0;
    db.contacts.forEach(c => {
      const val = Number(c.revenue) || 0;
      if (c.tenant === 'heating') heatingRev += val;
      else if (c.tenant === 'screed') screedRev += val;
      else if (c.tenant === 'electrical') electricalRev += val;
    });

    const divisionDistribution = [
      { name: 'Heating Works', value: heatingRev },
      { name: 'Screed Works', value: screedRev },
      { name: 'Electrical Works', value: electricalRev }
    ];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      let mIndex = d.getMonth() - i;
      if (mIndex < 0) mIndex += 12;
      monthlyTrend.push({
        month: monthNames[mIndex],
        Revenue: 0,
        Target: 0,
        Leads: 0
      });
    }
    
    if (totalRevenue > 0) {
      monthlyTrend[5].Revenue = totalRevenue;
      monthlyTrend[5].Leads = customerCount;
      monthlyTrend[5].Target = totalRevenue + 5000;
    }

    res.json({
      kpis: {
        totalRevenue,
        pipelineValue,
        customerCount,
        activeTechnicians
      },
      charts: {
        monthlyTrend,
        divisionDistribution
      },
      status: "healthy",
      message: "Analytics synchronized dynamically with live data."
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics synthesis failed: ' + err.message });
  }
});

// ==========================================
// USER MANAGEMENT (ADMIN ONLY)
// ==========================================
app.get('/api/users', verifyTokenAndTenant, authorizeRoles('Admin'), userController.getUsers);
app.post('/api/users', verifyTokenAndTenant, authorizeRoles('Admin'), userController.createUser);
app.put('/api/users/:id', verifyTokenAndTenant, authorizeRoles('Admin'), userController.updateUser);
app.delete('/api/users/:id', verifyTokenAndTenant, authorizeRoles('Admin'), userController.deleteUser);

// ==========================================
// SERVER SPIN TACTICS AND HEARTS CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global Fallthrough Error Handler Block
app.use((err, req, res, next) => {
  console.error(`💥 CRITICAL BACKEND ERROR: ${err.message}`, err.stack);
  res.status(500).json({
    error: 'A fatal server error occurred while handling this action.',
    details: err.message
  });
});

// Launch server instance
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 =======================================================`);
  console.log(`🚀 STANDALONE BACKEND RUNNING FOR: Abdelghanem Enterprise`);
  console.log(`🚀 Server Address: http://localhost:${PORT}`);
  console.log(`🚀 WebSockets Gateway Enabled - Mapping Client CORS`);
  console.log(`🚀 =======================================================`);
});
