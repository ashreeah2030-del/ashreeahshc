import React, { useState, useEffect } from 'react';
import { 
  StaffMember, 
  DispatchedDocument, 
  SchoolSettings, 
  StaffSignature,
  AuthSession,
  RecognitionAward
} from './types';
import { ArrowUp } from 'lucide-react';
import { 
  loadStaffMembers, 
  saveStaffMembers, 
  clearAllStaffMembers,
  loadDocuments, 
  saveDocuments, 
  loadSchoolSettings, 
  saveSchoolSettings, 
  saveStaffSignature,
  resetToDefaults,
  loadAuthSession,
  saveAuthSession,
  updateStaffPin,
  loadRecognitionAwards,
  addRecognitionAward,
  addBulkRecognitionAwards,
  updateRecognitionAward,
  deleteRecognitionAward
} from './utils/storage';
import { syncService, ServerSyncData } from './utils/syncService';
import { Header } from './components/Header';
import { StaffDirectory } from './components/StaffDirectory';
import { CircularsManager } from './components/CircularsManager';
import { InquiriesManager } from './components/InquiriesManager';
import { AuditsManager } from './components/AuditsManager';
import { ReportsManager } from './components/ReportsManager';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { DocumentSignView } from './components/DocumentSignView';
import { SignatureAuditModal } from './components/SignatureAuditModal';
import { TeacherSimulatorModal } from './components/TeacherSimulatorModal';
import { LoginView } from './components/LoginView';
import { StaffPortalView } from './components/StaffPortalView';
import { ChangePasscodeModal } from './components/ChangePasscodeModal';
import { AcademicCalendarView } from './components/AcademicCalendarView';
import { RecognitionManager } from './components/RecognitionManager';

export default function App() {
  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());

  // Main Data State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [documents, setDocuments] = useState<DispatchedDocument[]>([]);
  const [awards, setAwards] = useState<RecognitionAward[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(loadSchoolSettings());
  const [activeTab, setActiveTab] = useState<'staff' | 'circulars' | 'inquiries' | 'audits' | 'reports' | 'recognition' | 'calendar' | 'settings' | 'portal'>('staff');

  // Interactive Modals
  const [auditDoc, setAuditDoc] = useState<DispatchedDocument | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isChangePasscodeModalOpen, setIsChangePasscodeModalOpen] = useState(false);

  // Active Direct Signing View (Personal Teacher View)
  const [activeSignDocId, setActiveSignDocId] = useState<string | null>(null);
  const [activeSignStaffId, setActiveSignStaffId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll listener for mobile convenience
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial Data Load & Multi-Device Cloud Sync
  useEffect(() => {
    const loadedStaff = loadStaffMembers();
    const loadedDocs = loadDocuments();
    const loadedSettings = loadSchoolSettings();
    const loadedAwards = loadRecognitionAwards();

    setStaffList(loadedStaff);
    setDocuments(loadedDocs);
    setSchoolSettings(loadedSettings);
    setAwards(loadedAwards);

    // Initial server fetch & seeding across devices
    syncService.fetchInitialData({
      staffList: loadedStaff,
      documents: loadedDocs,
      schoolSettings: loadedSettings,
      awards: loadedAwards,
    }).then((serverData) => {
      if (serverData) {
        if (serverData.staffList && serverData.staffList.length > 0) {
          setStaffList(serverData.staffList);
          try { localStorage.setItem('shariah_platform_staff_v5', JSON.stringify(serverData.staffList)); } catch (e) {}
        }
        if (serverData.documents && serverData.documents.length > 0) {
          setDocuments(serverData.documents);
          try { localStorage.setItem('shariah_platform_documents_v1', JSON.stringify(serverData.documents)); } catch (e) {}
        }
        if (serverData.awards && serverData.awards.length > 0) {
          setAwards(serverData.awards);
          try { localStorage.setItem('shariah_platform_recognition_v1', JSON.stringify(serverData.awards)); } catch (e) {}
        }
        if (serverData.schoolSettings) {
          setSchoolSettings(serverData.schoolSettings);
          try { localStorage.setItem('shariah_platform_settings_v3', JSON.stringify(serverData.schoolSettings)); } catch (e) {}
        }
      }
    });

    // Start background multi-device polling sync (fast 2.5s interval)
    syncService.startPolling(2500);

    // Subscribe to live background updates from other devices & tabs
    const unsubscribe = syncService.subscribe((data: ServerSyncData) => {
      if (Array.isArray(data.staffList)) {
        setStaffList(data.staffList);
        try { localStorage.setItem('shariah_platform_staff_v5', JSON.stringify(data.staffList)); } catch (e) {}
      }
      if (Array.isArray(data.documents)) {
        setDocuments(data.documents);
        try { localStorage.setItem('shariah_platform_documents_v1', JSON.stringify(data.documents)); } catch (e) {}
      }
      if (Array.isArray(data.awards)) {
        setAwards(data.awards);
        try { localStorage.setItem('shariah_platform_recognition_v1', JSON.stringify(data.awards)); } catch (e) {}
      }
      if (data.schoolSettings) {
        setSchoolSettings(data.schoolSettings);
        try { localStorage.setItem('shariah_platform_settings_v3', JSON.stringify(data.schoolSettings)); } catch (e) {}
      }

      // If user is currently logged in as a staff member, update their session so certificates and points match live
      setAuthSession((prev) => {
        if (!prev || prev.role !== 'staff' || !prev.staffMember) return prev;
        const matching = data.staffList?.find(
          s => s.id === prev.staffMember?.id || (s.nationalId && prev.staffMember?.nationalId && s.nationalId === prev.staffMember.nationalId)
        );
        if (matching) {
          const updatedSession = { ...prev, staffMember: matching };
          saveAuthSession(updatedSession);
          return updatedSession;
        }
        return prev;
      });
    });

    // Check URL parameters for direct WhatsApp link
    const params = new URLSearchParams(window.location.search);
    const docIdParam = params.get('docId');
    const staffIdParam = params.get('staffId');

    if (docIdParam && staffIdParam) {
      setActiveSignDocId(docIdParam);
      setActiveSignStaffId(staffIdParam);
    }

    return () => {
      unsubscribe();
      syncService.stopPolling();
    };
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    saveAuthSession(session);
    if (session.role === 'staff') {
      setActiveTab('portal');
    } else {
      setActiveTab('staff');
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    saveAuthSession(null);
    setActiveSignDocId(null);
    setActiveSignStaffId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleUpdateStaffPin = (newPin: string) => {
    if (authSession?.staffMember) {
      const updatedList = updateStaffPin(authSession.staffMember.id, newPin);
      setStaffList(updatedList);
      const updatedStaff = updatedList.find(s => s.id === authSession.staffMember?.id);
      if (updatedStaff) {
        const newSession: AuthSession = {
          ...authSession,
          staffMember: updatedStaff,
        };
        setAuthSession(newSession);
        saveAuthSession(newSession);
      }
    }
  };

  // Handlers for Staff
  const handleAddStaff = (newStaffData: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...newStaffData,
      id: `staff-${Date.now()}`,
      pin: newStaffData.pin || newStaffData.nationalId.slice(-4),
    };
    const updated = [newStaff, ...staffList];
    setStaffList(updated);
    saveStaffMembers(updated);
  };

  const handleUpdateStaff = (updatedStaff: StaffMember) => {
    const updated = staffList.map(s => s.id === updatedStaff.id ? updatedStaff : s);
    setStaffList(updated);
    saveStaffMembers(updated);
  };

  const handleDeleteStaff = (staffId: string) => {
    const updated = staffList.filter(s => s.id !== staffId);
    setStaffList(updated);
    saveStaffMembers(updated);
  };

  const handleClearAllStaff = () => {
    setStaffList([]);
    clearAllStaffMembers();
  };

  const handleBulkImportStaff = (importedList: Omit<StaffMember, 'id'>[], updateExisting: boolean = true) => {
    let currentList = [...staffList];
    let addedCount = 0;
    let updatedCount = 0;

    for (const item of importedList) {
      const existingIdx = currentList.findIndex(s => s.nationalId === item.nationalId);
      if (existingIdx !== -1 && updateExisting) {
        currentList[existingIdx] = {
          ...currentList[existingIdx],
          ...item,
          id: currentList[existingIdx].id,
          pin: item.pin || currentList[existingIdx].pin || item.nationalId.slice(-4),
        };
        updatedCount++;
      } else if (existingIdx === -1) {
        const newStaff: StaffMember = {
          ...item,
          id: `staff-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          pin: item.pin || item.nationalId.slice(-4),
        };
        currentList.unshift(newStaff);
        addedCount++;
      }
    }

    setStaffList(currentList);
    saveStaffMembers(currentList);
  };

  // Handlers for Documents
  const handleAddDocument = (newDoc: DispatchedDocument) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
    syncService.pushDocument(newDoc);
    syncService.broadcastLocalUpdate({ documents: updated });
  };

  const handleSaveSignature = (docId: string, signature: StaffSignature) => {
    const updatedDocs = saveStaffSignature(docId, signature);
    setDocuments(updatedDocs);
  };

  // Handlers for Settings
  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSchoolSettings(newSettings);
    saveSchoolSettings(newSettings);
  };

  const handleUpdateAdminPassword = (newPassword: string) => {
    const updatedSettings = { ...schoolSettings, adminPassword: newPassword };
    setSchoolSettings(updatedSettings);
    saveSchoolSettings(updatedSettings);
  };

  const handleResetData = () => {
    resetToDefaults();
    setStaffList(loadStaffMembers());
    setDocuments(loadDocuments());
    setSchoolSettings(loadSchoolSettings());
    setAwards(loadRecognitionAwards());
    alert('تمت استعادة البيانات النموذجية لمجمع الشريعة التعليمي للبنين بنجاح.');
  };

  // Handlers for Recognition and Awards
  const handleAddAward = (awardData: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'>) => {
    const result = addRecognitionAward(awardData, staffList);
    setAwards(result.updatedAwards);
    setStaffList(result.updatedStaff);
  };

  const handleAddBulkAwards = (awardsDataList: Omit<RecognitionAward, 'id' | 'createdAt' | 'certificateNumber'>[]) => {
    const result = addBulkRecognitionAwards(awardsDataList, staffList);
    setAwards(result.updatedAwards);
    setStaffList(result.updatedStaff);
  };

  const handleDeleteAward = (awardId: string) => {
    const result = deleteRecognitionAward(awardId, staffList);
    setAwards(result.updatedAwards);
    setStaffList(result.updatedStaff);
  };

  const handleUpdateAward = (updatedAward: RecognitionAward) => {
    const result = updateRecognitionAward(updatedAward, staffList);
    setAwards(result.updatedAwards);
    setStaffList(result.updatedStaff);
  };

  // Open Direct Teacher Signing Portal
  const handleOpenSignPortal = (docId: string, staffId: string) => {
    setActiveSignDocId(docId);
    setActiveSignStaffId(staffId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseSignPortal = () => {
    setActiveSignDocId(null);
    setActiveSignStaffId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Handler for Registering Staff from Login View
  const handleRegisterStaff = (registeredStaff: StaffMember) => {
    const existingIndex = staffList.findIndex(s => s.id === registeredStaff.id || s.nationalId === registeredStaff.nationalId);
    let updated: StaffMember[];
    if (existingIndex !== -1) {
      updated = [...staffList];
      updated[existingIndex] = { ...updated[existingIndex], ...registeredStaff };
    } else {
      updated = [registeredStaff, ...staffList];
    }
    setStaffList(updated);
    saveStaffMembers(updated);
  };

  // Resolve active signing doc and staff
  const activeSignDoc = activeSignDocId ? documents.find(d => d.id === activeSignDocId) : null;
  const activeSignStaff = activeSignStaffId ? staffList.find(s => s.id === activeSignStaffId) : (authSession?.staffMember || null);

  // IF NOT AUTHENTICATED: Show the Private Login View
  if (!authSession) {
    return (
      <LoginView
        schoolSettings={schoolSettings}
        staffList={staffList}
        onLoginSuccess={handleLoginSuccess}
        onUpdateAdminPassword={handleUpdateAdminPassword}
        onRegisterStaff={handleRegisterStaff}
      />
    );
  }

  // IF AUTHENTICATED AS STAFF:
  if (authSession.role === 'staff' && authSession.staffMember) {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-emerald-600 selection:text-white">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          schoolSettings={schoolSettings}
          staffList={staffList}
          documents={documents}
          awardsCount={awards.length}
          authSession={authSession}
          onLogout={handleLogout}
          onOpenTeacherSimulator={() => {}}
        />

        <main className="flex-1 w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-8">
          {activeSignDoc && activeSignStaff ? (
            <DocumentSignView
              document={activeSignDoc}
              staff={activeSignStaff}
              schoolSettings={schoolSettings}
              onSaveSignature={handleSaveSignature}
              onBackToDashboard={handleCloseSignPortal}
            />
          ) : (
            (() => {
              const currentStaffInList = staffList.find(
                s => s.id === authSession.staffMember?.id || (s.nationalId && authSession.staffMember?.nationalId && s.nationalId === authSession.staffMember.nationalId)
              ) || authSession.staffMember;
              return (
                <StaffPortalView
                  currentStaff={currentStaffInList}
                  documents={documents}
                  schoolSettings={schoolSettings}
                  awards={awards}
                  onOpenDoc={handleOpenSignPortal}
                  onUpdatePin={handleUpdateStaffPin}
                  onLogout={handleLogout}
                />
              );
            })()
          )}
        </main>

        <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">
              {schoolSettings.schoolName} • بوابة المعلم والموظف الخاصة • {schoolSettings.educationDepartment}
            </span>
            <span className="font-mono text-slate-400">
              بيانات مشفرة ومحمية بالرمز السري • المملكة العربية السعودية
            </span>
          </div>
        </footer>

        {/* Floating Scroll-to-Top Button for Mobile & Desktop */}
        {showScrollTop && (
          <button
            id="scroll-to-top-staff-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-5 left-5 z-40 bg-emerald-800 hover:bg-emerald-900 text-white p-3 rounded-full shadow-lg border border-emerald-600/50 flex items-center justify-center transition-all animate-in fade-in cursor-pointer hover:scale-110 active:scale-95"
            title="العودة لأعلى الصفحة"
            aria-label="العودة لأعلى الصفحة"
          >
            <ArrowUp className="w-5 h-5 text-amber-300" />
          </button>
        )}
      </div>
    );
  }

  // IF AUTHENTICATED AS ADMIN: Full School Administration Dashboard
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (activeSignDocId) handleCloseSignPortal();
        }}
        schoolSettings={schoolSettings}
        staffList={staffList}
        documents={documents}
        awardsCount={awards.length}
        authSession={authSession}
        onLogout={handleLogout}
        onOpenTeacherSimulator={() => setIsSimulatorOpen(true)}
        onOpenChangePasswordModal={() => setIsChangePasscodeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-2.5 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-8">
        {/* If viewing a specific document as a Teacher / Signer */}
        {activeSignDoc && activeSignStaff ? (
          <DocumentSignView
            document={activeSignDoc}
            staff={activeSignStaff}
            schoolSettings={schoolSettings}
            onSaveSignature={handleSaveSignature}
            onBackToDashboard={handleCloseSignPortal}
          />
        ) : (
          /* Dashboard Views */
          <div>
            {activeTab === 'staff' && (
              <StaffDirectory
                staffList={staffList}
                schoolSettings={schoolSettings}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onBulkImport={handleBulkImportStaff}
                onClearAllStaff={handleClearAllStaff}
              />
            )}

            {activeTab === 'circulars' && (
              <CircularsManager
                documents={documents}
                staffList={staffList}
                schoolSettings={schoolSettings}
                onAddCircular={handleAddDocument}
                onOpenSignPortal={handleOpenSignPortal}
                onOpenAuditModal={(doc) => setAuditDoc(doc)}
              />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesManager
                documents={documents}
                staffList={staffList}
                schoolSettings={schoolSettings}
                onAddInquiry={handleAddDocument}
                onOpenSignPortal={handleOpenSignPortal}
                onOpenAuditModal={(doc) => setAuditDoc(doc)}
              />
            )}

            {activeTab === 'audits' && (
              <AuditsManager
                documents={documents}
                staffList={staffList}
                schoolSettings={schoolSettings}
                onOpenAuditModal={(doc) => setAuditDoc(doc)}
                onOpenSignPortal={handleOpenSignPortal}
                onNavigateToReports={() => setActiveTab('reports')}
              />
            )}

            {activeTab === 'recognition' && (
              <RecognitionManager
                staffList={staffList}
                schoolSettings={schoolSettings}
                awards={awards}
                onAddAward={handleAddAward}
                onAddBulkAwards={handleAddBulkAwards}
                onUpdateAward={handleUpdateAward}
                onDeleteAward={handleDeleteAward}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsManager
                documents={documents}
                staffList={staffList}
                schoolSettings={schoolSettings}
                onOpenAuditModal={(doc) => setAuditDoc(doc)}
                onOpenSignPortal={handleOpenSignPortal}
              />
            )}

            {activeTab === 'calendar' && (
              <AcademicCalendarView
                schoolSettings={schoolSettings}
              />
            )}

            {activeTab === 'settings' && (
              <SchoolSettingsView
                settings={schoolSettings}
                onSaveSettings={handleSaveSettings}
                onResetToDefaults={handleResetData}
              />
            )}
          </div>
        )}
      </main>

      {/* Signature Audit Modal */}
      {auditDoc && (
        <SignatureAuditModal
          document={auditDoc}
          staffList={staffList}
          schoolSettings={schoolSettings}
          onClose={() => setAuditDoc(null)}
        />
      )}

      {/* Teacher Simulator Modal */}
      {isSimulatorOpen && (
        <TeacherSimulatorModal
          staffList={staffList}
          documents={documents}
          onOpenDocForStaff={handleOpenSignPortal}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}

      {/* Admin Change Passcode Modal */}
      {isChangePasscodeModalOpen && (
        <ChangePasscodeModal
          isOpen={isChangePasscodeModalOpen}
          onClose={() => setIsChangePasscodeModalOpen(false)}
          schoolSettings={schoolSettings}
          onSavePassword={handleUpdateAdminPassword}
          isLoggedInAdmin={true}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            {schoolSettings.schoolName} • منظومة التواصل المعتمدة • {schoolSettings.educationDepartment}
          </span>
          <span className="font-mono text-slate-400">
            العام الدراسي {schoolSettings.academicYear} • المملكة العربية السعودية
          </span>
        </div>
      </footer>

      {/* Floating Scroll-to-Top Button for Mobile & Desktop */}
      {showScrollTop && (
        <button
          id="scroll-to-top-admin-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 left-5 z-40 bg-emerald-800 hover:bg-emerald-900 text-white p-3 rounded-full shadow-lg border border-emerald-600/50 flex items-center justify-center transition-all animate-in fade-in cursor-pointer hover:scale-110 active:scale-95"
          title="العودة لأعلى الصفحة"
          aria-label="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5 text-amber-300" />
        </button>
      )}
    </div>
  );
}
