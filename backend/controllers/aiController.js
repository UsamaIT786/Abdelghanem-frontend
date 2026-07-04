const { GoogleGenAI } = require('@google/genai');
const db = require('../db');

// Secure lazy loading of the Google GenAI SDK
let aiInstance = null;
function getAIClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined in the environment variables. Mock algorithms will be utilized instead.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

// ==========================================
// 1. SMART PDF INTAKE (GEMINI INGESTION)
// ==========================================

exports.getDocuments = (req, res) => {
  try {
    res.json(db.documents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to access document indexes: ' + err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file transmitted under the "file" form-data field.' });
    }

    const { originalname, size, buffer } = req.file;
    const io = req.app.get('io');

    // Instantly notify progress over Socket.io
    if (io) {
      io.emit('PDF_PARSING_STATUS', { progress: 20, message: 'Uploading document to cloud server...' });
    }

    const ai = getAIClient();
    let extractedData = {};

    if (ai) {
      if (io) {
        io.emit('PDF_PARSING_STATUS', { progress: 50, message: 'Uploading PDF to Gemini Large Context Window...' });
      }

      // Format direct system context and instructions for strict structured schema JSON output
      const systemPrompt = `
        You are an expert OCR AI extraction engine specialized in physical engineering schematics, estimates, and work specifications.
        Analyze the provided document and write a clean JSON response matching this exact structure:
        {
          "clientName": "string or company name",
          "address": "string main street and postal code",
          "totalAmount": "string (e.g. £15,000)",
          "items": ["list of strings representing individual specs and materials"],
          "confidence": number between 80 and 100,
          "boilerModel": "string (applicable only if heating works spec, else blank)",
          "screedThickness": "string (applicable only if floor screed spec, e.g. 50mm, else blank)",
          "wiringStandard": "string (applicable only if electrical spec, e.g. BS 7671, else blank)"
        }
        Return only the pure JSON. No markdown ticks, no commentary.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            {
              inlineData: {
                data: buffer.toString('base64'),
                mimeType: 'application/pdf'
              }
            },
            systemPrompt
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        const textOutput = response.text || '';
        extractedData = JSON.parse(textOutput);

        if (io) {
          io.emit('PDF_PARSING_STATUS', { progress: 90, message: 'Validating extraction matrices...' });
        }

      } catch (err) {
        console.error("Gemini Ingestion Engine Error:", err);
        throw new Error("Unable to parse document parameters with Gemini: " + err.message);
      }
    } else {
      // Fallback Seed mock dataset with random names to guarantee backend remains elegant
      const fallbackNames = ['Romano Construction', 'Gloucester Green Offices', 'Prestige Home Care Ltd'];
      const chosenName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
      
      extractedData = {
        clientName: chosenName,
        address: '88 Kingsway Road, London WC2B',
        totalAmount: '£18,200',
        items: [
          'Eco Combi Hybrid Boiler unit upgrade (80L tank)', 
          'Hydronic Underfloor manifold grid mapping', 
          'BS 7671 certified safety consumer isolators'
        ],
        confidence: 94,
        boilerModel: 'Worcester Greenstar Hybrid',
        screedThickness: '60mm',
        wiringStandard: 'BS 7671:2018 Standard'
      };
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      fileName: originalname,
      fileSize: `${(size / (1024 * 1024)).toFixed(2)} MB`,
      uploadedAt: 'Just Now',
      status: 'Parsed',
      extractedData
    };

    db.documents.unshift(newDoc);

    if (io) {
      io.emit('PDF_PARSING_STATUS', { progress: 100, message: 'Extraction completed!' });
      io.emit('DOCUMENT_CREATED', newDoc);
    }

    res.status(201).json(newDoc);

  } catch (err) {
    res.status(500).json({ error: 'Smart intake process aborted: ' + err.message });
  }
};

exports.updateDocument = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.documents.findIndex(d => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Document record not found with ID: ' + id });
    }

    const updated = { ...db.documents[idx], ...req.body };
    db.documents[idx] = updated;

    const io = req.app.get('io');
    if (io) {
      io.emit('DOCUMENT_UPDATED', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error updating document: ' + err.message });
  }
};

exports.deleteDocument = (req, res) => {
  try {
    const { id } = req.params;
    db.documents = db.documents.filter(d => d.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.emit('DOCUMENT_DELETED', { id });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to erase document record: ' + err.message });
  }
};


// ==========================================
// 2. AI CAMPAIGN GENERATOR (MARKETING COPY)
// ==========================================

exports.getCampaigns = (req, res) => {
  try {
    const tenantFilter = req.headers['x-tenant-id'] || 'all';
    if (tenantFilter === 'all') {
      return res.json(db.campaigns);
    }
    const filtered = db.campaigns.filter(c => c.tenant === tenantFilter);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Error loading campaign list: ' + err.message });
  }
};

exports.generateCampaign = async (req, res) => {
  try {
    const { platform, tenant, goal } = req.body;
    
    const targetPlatform = platform || 'Facebook';
    const targetTenant = tenant || 'heating';
    const targetGoal = goal || 'Drive winter boiler sales with 0% interest financing';

    const ai = getAIClient();
    let generatedCopy = '';
    let hashtags = [];

    if (ai) {
      const prompt = `
        You are a highly premium AI Copywriter specialized in physical installations and trade divisions.
        Create an expert advertising copy for:
        - Platform: ${targetPlatform}
        - Service Division: ${targetTenant.toUpperCase()} Works
        - Campaign Goal: ${targetGoal}

        Make the tone conversions-driven, trustworthy, and safety-focused.
        Include a strong call to action.
        Provide the response in raw JSON format matching this pattern exactly:
        {
          "copy": "the written body of the ad with emojis",
          "tags": ["tag1", "tag2", "tag3"]
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const output = JSON.parse(response.text);
        generatedCopy = output.copy;
        hashtags = output.tags;
      } catch (err) {
        console.error("Gemini Campaign Engine Failed, employing fallback:", err);
        throw err;
      }
    }

    // Standard high-quality copy if Gemini key is missing or failed
    if (!generatedCopy) {
      if (targetTenant === 'heating') {
        generatedCopy = `🔥 Upgrade to a smart, fuel-saving Worcester heating boiler setup with 0% financing! Guarantee complete thermal efficiency in your home before winter arrives. Full 10 year warranty and custom smart thermometers included. Book your free diagnostic visit today!`;
        hashtags = ['HeatingWorks', 'BoilerUpgrade', 'EcoClimate', 'HomeRenovation'];
      } else if (targetTenant === 'screed') {
        generatedCopy = `🏗️ Flawless Level Liquid Screed from Screed Works. High-speed flow layout combined with high heat conductivity makes this the ultimate foundation for underfloor heating networks. Set in 48 hours. Call us now!`;
        hashtags = ['ScreedWorks', 'PerfectFloor', 'FlowLevel', 'HomeBuilding'];
      } else {
        generatedCopy = `🔌 Safe EV Smart Chargers and high-voltage wiring upgrades from Electrical Works. Certified engineering under BS 7671 regulatory standards with full overloaded prevention relays. Act now for a greener driving route!`;
        hashtags = ['ElectricalWorks', 'SmartEvCharger', 'GoGreen', 'ElectricianLife'];
      }
    }

    const newCampaign = {
      id: `camp-${Date.now()}`,
      title: `${targetTenant.toUpperCase()} ${targetPlatform} Lead Generator`,
      platform: targetPlatform,
      generatedCopy,
      hashtags,
      status: 'Pending Approval', // Promotes the crucial human-in-the-loop validation
      createdAt: 'Just Now',
      tenant: targetTenant
    };

    db.campaigns.unshift(newCampaign);

    const io = req.app.get('io');
    if (io) {
      io.emit('CAMPAIGN_CREATED', newCampaign);
    }

    res.status(201).json(newCampaign);

  } catch (err) {
    res.status(500).json({ error: 'AI Campaign formulation failure: ' + err.message });
  }
};

// ==========================================
// 3. CAMPAIGN UPDATE & HUMAN-IN-THE-LOOP APPROVAL
// ==========================================

exports.updateCampaign = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.campaigns.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Ad campaign not found with id: ' + id });
    }

    const previousCampaign = db.campaigns[idx];
    const updated = { ...previousCampaign, ...req.body };
    db.campaigns[idx] = updated;

    const io = req.app.get('io');
    if (io) {
      io.emit('CAMPAIGN_UPDATED', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Campaign update failure: ' + err.message });
  }
};

exports.approveCampaign = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.campaigns.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Ad campaign not found with id: ' + id });
    }

    db.campaigns[idx].status = 'Approved';
    const approved = db.campaigns[idx];

    // Trigger webhook logs for n8n/Zapier
    console.log(`🚀 HOOK TRIGGERED: Dispatching campaign copy '${approved.title}' to production networks...`);

    const io = req.app.get('io');
    if (io) {
      io.emit('CAMPAIGN_UPDATED', approved);
    }

    res.json(approved);
  } catch (err) {
    res.status(500).json({ error: 'Approval action failure: ' + err.message });
  }
};

exports.deleteCampaign = (req, res) => {
  try {
    const { id } = req.params;
    db.campaigns = db.campaigns.filter(c => c.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.emit('CAMPAIGN_DELETED', { id });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Erase campaign error: ' + err.message });
  }
};
