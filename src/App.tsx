import React, { useState, useEffect } from 'react';
import { 
  StaffMember, 
  DispatchedDocument, 
  SchoolSettings, 
  StaffSignature,
  AuthSession
} from './types';
import { 
  loadStaffMembers, 
  saveStaffMembers, 
  loadDocuments, 
  saveDocuments, 
  loadSchoolSettings, 
  saveSchoolSettings, 
  saveStaffSignature,
  resetToDefaults,
  loadAuthSession,
  saveAuthSession,
  updateStaffPin
} from './utils/storage';
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

export default function App() {
  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());

  // Main Data State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [documents, setDocuments] = useState<DispatchedDocument[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(loadSchoolSettings());
  const [activeTab, setActiveTab] = useState<'staff' | 'circulars' | 'inquiries' | 'audits' | 'reports' | 'settings' | 'portal'>('staff');

  // Interactive Modals
  const [auditDoc, setAuditDoc] = useState<DispatchedDocument | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Active Direct Signing View (Personal Teacher View)
  const [activeSignDocId, setActiveSignDocId] = useState<string | null>(null);
  const [activeSignStaffId, setActiveSignStaffId] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    const loadedStaff = loadStaffMembers();
    const loadedDocs = loadDocuments();
    const loadedSettings = loadSchoolSettings();

    setStaffList(loadedStaff);
    setDocuments(loadedDocs);
    setSchoolSettings(loadedSettings);

    // Check URL parameters for direct WhatsApp link
    const params = new URLSearchParams(window.location.search);
    const docIdParam = params.get('docId');
    const staffIdParam = params.get('staffId');

    if (docIdParam && staffIdParam) {
      setActiveSignDocId(docIdParam);
      setActiveSignStaffId(staffIdParam);
    }
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

  const handleBulkImportStaff = (importedList: Omit<StaffMember, 'id'>[]) => {
    const newStaffList: StaffMember[] = importedList.map((item, idx) => ({
      ...item,
      id: `staff-${Date.now()}-${idx}`,
      pin: item.pin || item.nationalId.slice(-4),
    }));
    const updated = [...newStaffList, ...staffList];
    setStaffList(updated);
    saveStaffMembers(updated);
  };

  // Handlers for Documents
  const handleAddDocument = (newDoc: DispatchedDocument) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveDocuments(updated);
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

  const handleResetData = () => {
    resetToDefaults();
    setStaffList(loadStaffMembers());
    setDocuments(loadDocuments());
    setSchoolSettings(loadSchoolSettings());
    alert('تمت استعادة البيانات النموذجية لمجمع الشريعة التعليمي للبنين بنجاح.');
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
          authSession={authSession}
          onLogout={handleLogout}
          onOpenTeacherSimulator={() => {}}
        />

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
          {activeSignDoc && activeSignStaff ? (
            <DocumentSignView
              document={activeSignDoc}
              staff={activeSignStaff}
              schoolSettings={schoolSettings}
              onSaveSignature={handleSaveSignature}
              onBackToDashboard={handleCloseSignPortal}
            />
          ) : (
            <StaffPortalView
              currentStaff={authSession.staffMember}
              documents={documents}
              schoolSettings={schoolSettings}
              onOpenDoc={handleOpenSignPortal}
              onUpdatePin={handleUpdateStaffPin}
              onLogout={handleLogout}
            />
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
        authSession={authSession}
        onLogout={handleLogout}
        onOpenTeacherSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
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
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onDeleteStaff={handleDeleteStaff}
                onBulkImport={handleBulkImportStaff}
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

            {activeTab === 'reports' && (
              <ReportsManager
                documents={documents}
                staffList={staffList}
                schoolSettings={schoolSettings}
                onOpenAuditModal={(doc) => setAuditDoc(doc)}
                onOpenSignPortal={handleOpenSignPortal}
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
    </div>
  );
}
