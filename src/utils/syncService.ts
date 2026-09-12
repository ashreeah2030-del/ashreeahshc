import { 
  StaffMember, 
  DispatchedDocument, 
  RecognitionAward, 
  SchoolSettings, 
  CircularTemplate, 
  StaffSignature 
} from '../types';

export interface ServerSyncData {
  staffList: StaffMember[];
  documents: DispatchedDocument[];
  awards: RecognitionAward[];
  schoolSettings: SchoolSettings | null;
  circularTemplates: CircularTemplate[];
  lastModified: number;
}

type SyncListener = (data: ServerSyncData) => void;

class SyncService {
  private lastModified: number = 0;
  private listeners: Set<SyncListener> = new Set();
  private pollIntervalId: any = null;
  private isSyncing: boolean = false;
  private isOnline: boolean = true;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // 1. Cross-tab real-time instant synchronization via BroadcastChannel (<5ms latency)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('shariah_platform_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event?.data?.type === 'SYNC_DATA' && event.data.payload) {
            const data = event.data.payload as ServerSyncData;
            if (data.lastModified && data.lastModified >= this.lastModified) {
              this.lastModified = data.lastModified;
            }
            this.notifyListeners(data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or failed to initialize:', e);
      }
    }

    // 2. Cross-tab fallback via storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (
          e.key === 'shariah_platform_documents_v1' ||
          e.key === 'shariah_platform_recognition_v1' ||
          e.key === 'shariah_platform_staff_v5' ||
          e.key === 'shariah_platform_settings_v3'
        ) {
          this.handleStorageEvent();
        }
      });

      // 3. Focus & visibility events for instant multi-device sync
      window.addEventListener('focus', () => this.checkForUpdates());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates();
        }
      });
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.checkForUpdates();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private handleStorageEvent() {
    try {
      const rawDocs = localStorage.getItem('shariah_platform_documents_v1');
      const rawAwards = localStorage.getItem('shariah_platform_recognition_v1');
      const rawStaff = localStorage.getItem('shariah_platform_staff_v5');
      const rawSettings = localStorage.getItem('shariah_platform_settings_v3');

      const data: Partial<ServerSyncData> = {};
      if (rawDocs) data.documents = JSON.parse(rawDocs);
      if (rawAwards) data.awards = JSON.parse(rawAwards);
      if (rawStaff) data.staffList = JSON.parse(rawStaff);
      if (rawSettings) data.schoolSettings = JSON.parse(rawSettings);

      this.notifyListeners(data as ServerSyncData);
    } catch (e) {
      this.checkForUpdates();
    }
  }

  public broadcastLocalUpdate(data: Partial<ServerSyncData>) {
    const timestamp = Date.now();
    this.lastModified = timestamp;
    const fullPayload: ServerSyncData = {
      staffList: data.staffList || [],
      documents: data.documents || [],
      awards: data.awards || [],
      schoolSettings: data.schoolSettings || null,
      circularTemplates: data.circularTemplates || [],
      lastModified: timestamp,
    };

    // Broadcast immediately across all open tabs/windows
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SYNC_DATA',
          payload: fullPayload,
        });
      } catch (err) {}
    }

    // Trigger listeners in current window
    this.notifyListeners(fullPayload);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(data: ServerSyncData) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  public startPolling(intervalMs: number = 2500) {
    if (this.pollIntervalId) return;
    this.pollIntervalId = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
  }

  public stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public async checkForUpdates(): Promise<ServerSyncData | null> {
    if (this.isSyncing) return null;
    this.isSyncing = true;
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Sync HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        const serverData: ServerSyncData = json.data;
        if (serverData.lastModified !== this.lastModified) {
          this.lastModified = serverData.lastModified;
          this.notifyListeners(serverData);
        }
        return serverData;
      }
    } catch (err) {
      // Benign network issue or offline mode
    } finally {
      this.isSyncing = false;
    }
    return null;
  }

  public async fetchInitialData(localFallback: Partial<ServerSyncData>): Promise<ServerSyncData | null> {
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const serverData: ServerSyncData = json.data;
          // If server is empty but local has records (first time container boots), upload local data to server!
          const isServerEmpty = (!serverData.staffList || serverData.staffList.length === 0) &&
                                (!serverData.documents || serverData.documents.length === 0) &&
                                (!serverData.awards || serverData.awards.length === 0);
          
          const hasLocalData = (localFallback.staffList && localFallback.staffList.length > 0) ||
                               (localFallback.documents && localFallback.documents.length > 0) ||
                               (localFallback.awards && localFallback.awards.length > 0);

          if (isServerEmpty && hasLocalData) {
            console.log('Seeding server with existing local data...');
            const uploaded = await this.pushFullSync(localFallback);
            if (uploaded) {
              this.lastModified = uploaded.lastModified;
              return uploaded;
            }
          }

          this.lastModified = serverData.lastModified;
          return serverData;
        }
      }
    } catch (err) {
      console.warn('Initial server sync failed, relying on local cache:', err);
    }
    return null;
  }

  public async pushFullSync(data: Partial<ServerSyncData>): Promise<ServerSyncData | null> {
    this.broadcastLocalUpdate(data);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.lastModified = json.data.lastModified;
          return json.data;
        }
      }
    } catch (err) {
      console.error('Error pushing full sync to server:', err);
    }
    return null;
  }

  public async pushDocument(doc: DispatchedDocument): Promise<void> {
    try {
      const res = await fetch('/api/data/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: doc }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastModified) this.lastModified = json.lastModified;
      }
    } catch (err) {
      console.error('Error saving document to server:', err);
    }
  }

  public async pushSignature(docId: string, signature: StaffSignature): Promise<void> {
    try {
      const res = await fetch('/api/data/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, signature }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastModified) this.lastModified = json.lastModified;
      }
    } catch (err) {
      console.error('Error pushing signature to server:', err);
    }
  }

  public async pushAwards(awards: RecognitionAward[], staffList?: StaffMember[]): Promise<void> {
    this.broadcastLocalUpdate({ awards, staffList });
    try {
      const res = await fetch('/api/data/awards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awards, staffList }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastModified) this.lastModified = json.lastModified;
      }
    } catch (err) {
      console.error('Error saving awards to server:', err);
    }
  }

  public async pushStaffList(staffList: StaffMember[]): Promise<void> {
    this.broadcastLocalUpdate({ staffList });
    try {
      const res = await fetch('/api/data/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffList }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastModified) this.lastModified = json.lastModified;
      }
    } catch (err) {
      console.error('Error saving staff list to server:', err);
    }
  }

  public async pushStaffMember(updatedStaff: StaffMember): Promise<void> {
    this.broadcastLocalUpdate({ staffList: [updatedStaff] });
    try {
      const res = await fetch('/api/data/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedStaff }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastModified) this.lastModified = json.lastModified;
      }
    } catch (err) {
      console.error('Error saving staff member to server:', err);
    }
  }
}

export const syncService = new SyncService();
