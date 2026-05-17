import { useEffect, useMemo } from 'react';
import { useAuthStore, useAppStore, initializeAppStore, initializeAuthStore } from './stores';
import { getMachineId } from './utils/machine-id';
import { Sidebar, Header } from './components/layout';
import {
  LoginPage,
  Dashboard,
  StudentsPage,
  SubjectsPage,
  SectionsPage,
  EClassRecord,
  SF9Page,
  SF10Page,
  SF8Page,
  SF5Page,
  SF6Page,
  AttendancePage,
  AnnouncementsPage,
  InstitutePage,
  SettingsPage,
  UsersPage,
  ReportsPage,
  ConsolidatedGradesPage,
  CalendarPage,
  CertificateGeneratorPage,
  SchoolFormsPage,
  NameTagPage,
  AboutPage,
  ActivationPage,
  LIRPage,
} from './pages';
import { AutoBackupManager } from './components/AutoBackupManager';
import { Toast } from './components/ui/Toast';
import { AccessDenied } from './components/auth/AccessDenied';

// DepEd-branded loading splash while auth state resolves
function LoadingSplash() {
  const schoolProfile = useAppStore(state => state.schoolProfile);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0A3D91] via-[#072C6B] to-[#051d45] relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3A7BFF]/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#ed1c24]/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-[#FFC107]/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Logo */}
        <div className="p-5 bg-white/[0.06] backdrop-blur-xl rounded-3xl border border-white/[0.1] shadow-2xl">
          <img
            src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
            alt="School Logo"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* School name */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white tracking-wider">{schoolProfile.name}</h1>
          <p className="text-[13px] text-blue-200/60 font-medium mt-1.5 tracking-wide">Digital Management Portal</p>
        </div>

        {/* Loading spinner */}
        <div className="flex items-center gap-3">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 border-[2.5px] border-white/10 rounded-full" />
            <div className="absolute inset-0 border-[2.5px] border-transparent border-t-[#FFC107] rounded-full animate-spin" />
          </div>
          <span className="text-[13px] text-blue-200/50 font-medium animate-pulse">Loading...</span>
        </div>

        {/* DepEd tri-color accent */}
        <div className="flex gap-1 mt-1">
          <div className="w-8 h-[2px] bg-[#3A7BFF]/60 rounded-full" />
          <div className="w-5 h-[2px] bg-[#ed1c24]/60 rounded-full" />
          <div className="w-8 h-[2px] bg-[#FFC107]/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { currentView, schoolProfile, isSyncReady } = useAppStore();

  const isExpired = schoolProfile?.subscription_end_date 
    ? new Date(schoolProfile.subscription_end_date) < new Date() 
    : false;

  const isActivationRedirectPending = (() => {
    try {
      return localStorage.getItem('formease-activation-redirect-pending') === 'true';
    } catch {
      return false;
    }
  })();

  // Use school name for page title
  useEffect(() => {
    const schoolName = schoolProfile?.name?.trim();
    document.title = schoolName && schoolName !== 'School Name' ? schoolName : 'FormEase Pro';
  }, [schoolProfile]);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 Starting application initialization...');
        await Promise.all([
          initializeAuthStore(),
          initializeAppStore()
        ]);
        console.log('✅ Application initialization complete');
        
        // --- BACKGROUND LICENSE VERIFICATION ---
        const state = useAppStore.getState();
        const profile = state.schoolProfile;
        
        if (profile.is_activated && profile.activation_key && !profile.is_trial) {
           console.log('🛡️ Verifying license binding...');
           try {
              const machineId = await getMachineId();
              const serial = profile.activation_key.trim().toUpperCase();
              const projectId = 'formease-licensing';
              const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/g7-special/public/data/licenses/${serial}`;

              const response = await fetch(baseUrl);
              if (response.ok) {
                 const docData = await response.json();
                 const fields = docData.fields || {};
                 const remoteMachineId = fields.machine_id?.stringValue || '';
                 const remoteStatus = fields.status?.stringValue || 'pending';

                 if (remoteStatus !== 'activated' || (remoteMachineId && remoteMachineId !== machineId)) {
                    console.warn('⚠️ License mismatch or reset detected. Reverting to activation state.');
                    localStorage.setItem('formease-license-reset-detected', 'true');
                    await state.updateSchoolProfile({
                       ...profile,
                       is_activated: false,
                       activated_at: null,
                       subscription_end_date: null
                    });
                 } else {
                    console.log('✅ License binding verified.');
                 }
              }
           } catch (verificationError) {
              console.warn('📡 License verification skipped (offline or network error)');
           }
        }

      } catch (error) {
        console.error('❌ Application initialization failed:', error);
      }
    };
    void init();
  }, []);


  // Use a synchronized loading state to prevent race conditions during reload
  if (isLoading || !isSyncReady) {
    return <LoadingSplash />;
  }

  if (!schoolProfile || !schoolProfile.is_activated || isExpired || isActivationRedirectPending) {
    return <ActivationPage />;
  }

  // 3. Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsPage />;
      case 'institute':
        return <InstitutePage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'class-record':
        return <EClassRecord />;
      case 'eclass':
        return <EClassRecord />;
      case 'sf9':
        return <SF9Page />;
      case 'sf10':
        return <SF10Page />;
      case 'sf8':
        return <SF8Page />;
      case 'sf5':
        return <SF5Page />;
      case 'sf6':
        return <SF6Page />;
      case 'school-forms':
        return <SchoolFormsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'consolidated-grades':
        return <ConsolidatedGradesPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'certificates':
        return <CertificateGeneratorPage />;
      case 'name-tags':
        return <NameTagPage />;
      case 'sections':
        return <SectionsPage />;
      case 'about':
        return <AboutPage />;
      case 'lir':
        return <LIRPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f0f4f8] dark:bg-[#080d1a] relative text-slate-800 dark:text-slate-200">
      <AutoBackupManager />
      {/* Global Animated Multi-Color Mesh Underlay */}
      <div className="absolute inset-0 z-0 opacity-60 dark:opacity-20 pointer-events-none animate-pulse print:hidden" style={{
        backgroundImage: `radial-gradient(circle at 10% 0%, #3A7BFF44 0%, transparent 50%), radial-gradient(circle at 90% 100%, #10b98133 0%, transparent 50%), radial-gradient(circle at 50% 50%, #fdb71411 0%, transparent 50%)`,
        animationDuration: '15s',
      }} />
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none print:hidden" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <Toast />

      <div className="relative z-10 flex w-full h-full p-2 lg:p-3 gap-2 lg:gap-3 box-border print:p-0 print:block">
        <div className="print:hidden h-full flex flex-col">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative print:bg-white print:border-none print:shadow-none print:rounded-none print:block print:overflow-visible">
          <div className="print:hidden">
            <Header />
          </div>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar print:p-0 print:overflow-visible">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}


export default App;
