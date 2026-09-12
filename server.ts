import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'platform-store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerStore {
  staffList: any[];
  documents: any[];
  awards: any[];
  schoolSettings: any | null;
  circularTemplates: any[];
  lastModified: number;
}

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        staffList: Array.isArray(parsed.staffList) ? parsed.staffList : [],
        documents: Array.isArray(parsed.documents) ? parsed.documents : [],
        awards: Array.isArray(parsed.awards) ? parsed.awards : [],
        schoolSettings: parsed.schoolSettings || null,
        circularTemplates: Array.isArray(parsed.circularTemplates) ? parsed.circularTemplates : [],
        lastModified: typeof parsed.lastModified === 'number' ? parsed.lastModified : Date.now(),
      };
    }
  } catch (err) {
    console.error('Error reading store file:', err);
  }
  return {
    staffList: [],
    documents: [],
    awards: [],
    schoolSettings: null,
    circularTemplates: [],
    lastModified: Date.now(),
  };
}

let store: ServerStore = loadStore();

function saveStore(updatedStore: ServerStore) {
  store = updatedStore;
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error saving store to disk:', err);
  }
}

// -------------------------------------------------------------
// Centralized API Routes for Multi-Device Data Persistence
// -------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    serverTime: new Date().toISOString(),
    counts: {
      staff: store.staffList.length,
      documents: store.documents.length,
      awards: store.awards.length,
    },
    lastModified: store.lastModified,
  });
});

// Full Sync: Fetch data for any device
app.get('/api/sync', (req, res) => {
  res.json({
    success: true,
    data: store,
    lastModified: store.lastModified,
  });
});

// Full Sync: Update or merge state from any device
app.post('/api/sync', (req, res) => {
  try {
    const { staffList, documents, awards, schoolSettings, circularTemplates } = req.body;
    let modified = false;

    const newStore: ServerStore = { ...store };

    if (Array.isArray(staffList)) {
      const staffMap = new Map<string, any>();
      for (const s of newStore.staffList) {
        if (s.nationalId) staffMap.set(`nat:${s.nationalId}`, s);
        if (s.id) staffMap.set(`id:${s.id}`, s);
      }
      for (const s of staffList) {
        const key = s.nationalId ? `nat:${s.nationalId}` : `id:${s.id}`;
        const existing = staffMap.get(key) || (s.id ? staffMap.get(`id:${s.id}`) : null);
        const merged = existing ? { ...existing, ...s } : s;
        if (s.nationalId) staffMap.set(`nat:${s.nationalId}`, merged);
        if (s.id) staffMap.set(`id:${s.id}`, merged);
      }
      const seen = new Set<string>();
      const finalStaff: any[] = [];
      for (const s of staffMap.values()) {
        const uKey = s.nationalId || s.id;
        if (!seen.has(uKey)) {
          seen.add(uKey);
          finalStaff.push(s);
        }
      }
      newStore.staffList = finalStaff;
      modified = true;
    }

    if (Array.isArray(documents)) {
      const existingDocMap = new Map<string, any>();
      for (const d of newStore.documents) {
        if (d && d.id) existingDocMap.set(d.id, d);
      }
      // Preserve client's ordered list (newest first) while retaining any server-side signatures
      newStore.documents = documents.map(d => {
        if (!d || !d.id) return d;
        const existing = existingDocMap.get(d.id);
        if (existing && existing.signatures) {
          return {
            ...d,
            signatures: { ...(existing.signatures || {}), ...(d.signatures || {}) },
          };
        }
        return d;
      });
      modified = true;
    }

    if (Array.isArray(awards)) {
      newStore.awards = awards;
      modified = true;
    }

    if (schoolSettings && typeof schoolSettings === 'object') {
      newStore.schoolSettings = { ...(newStore.schoolSettings || {}), ...schoolSettings };
      modified = true;
    }

    if (Array.isArray(circularTemplates)) {
      newStore.circularTemplates = circularTemplates;
      modified = true;
    }

    if (modified) {
      newStore.lastModified = Date.now();
      saveStore(newStore);
    }

    res.json({ success: true, lastModified: newStore.lastModified, data: newStore });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save or Update a Document (e.g., Inquiries or Circulars)
app.post('/api/data/documents', (req, res) => {
  try {
    const { document } = req.body;
    if (!document || !document.id) {
      return res.status(400).json({ success: false, error: 'Document data invalid' });
    }
    const idx = store.documents.findIndex(d => d.id === document.id);
    let updatedDocs = [...store.documents];
    if (idx !== -1) {
      const existing = updatedDocs[idx];
      updatedDocs[idx] = {
        ...existing,
        ...document,
        signatures: { ...(existing.signatures || {}), ...(document.signatures || {}) },
      };
    } else {
      updatedDocs = [document, ...updatedDocs];
    }
    store.documents = updatedDocs;
    store.lastModified = Date.now();
    saveStore(store);
    res.json({ success: true, document: updatedDocs[idx !== -1 ? idx : 0], lastModified: store.lastModified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Staff Signature on Document
app.post('/api/data/signatures', (req, res) => {
  try {
    const { docId, signature } = req.body;
    if (!docId || !signature || !signature.staffId) {
      return res.status(400).json({ success: false, error: 'Signature data invalid' });
    }
    const updatedDocs = store.documents.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          signatures: {
            ...(d.signatures || {}),
            [signature.staffId]: signature,
          },
        };
      }
      return d;
    });
    store.documents = updatedDocs;
    store.lastModified = Date.now();
    saveStore(store);
    res.json({ success: true, lastModified: store.lastModified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Awards & Recognition (Certificates of appreciation)
app.post('/api/data/awards', (req, res) => {
  try {
    const { awards, staffList } = req.body;
    if (Array.isArray(awards)) {
      store.awards = awards;
    }
    if (Array.isArray(staffList)) {
      store.staffList = staffList;
    }
    store.lastModified = Date.now();
    saveStore(store);
    res.json({ success: true, lastModified: store.lastModified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Staff Member updates (registration, pin update, etc.)
app.post('/api/data/staff', (req, res) => {
  try {
    const { staffList, updatedStaff } = req.body;
    if (Array.isArray(staffList)) {
      store.staffList = staffList;
    } else if (updatedStaff && (updatedStaff.id || updatedStaff.nationalId)) {
      const idx = store.staffList.findIndex(
        s => (updatedStaff.id && s.id === updatedStaff.id) || (updatedStaff.nationalId && s.nationalId === updatedStaff.nationalId)
      );
      if (idx !== -1) {
        store.staffList[idx] = { ...store.staffList[idx], ...updatedStaff };
      } else {
        store.staffList = [updatedStaff, ...store.staffList];
      }
    }
    store.lastModified = Date.now();
    saveStore(store);
    res.json({ success: true, lastModified: store.lastModified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
