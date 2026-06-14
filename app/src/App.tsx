import { useEffect, useState } from 'react';
import { useAuthStore, useAppStore, initializeAppStore, initializeAuthStore } from './stores';
import { getMachineId } from './utils/machine-id';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Sidebar, Header } from './components/layout';
import {
  LoginPage,
  AccountSetupPage,
  Dashboard,
  StudentsPage,
  EnrollmentCenterPage,
  SubjectsPage,
  SectionsPage,
  EClassRecord,
  ShsEClassRecord,
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
  TemporaryGradeSlipPage,
  AnecdotalRecordPage,
  GamesAndToolsPage,
} from './pages';
import { AutoBackupManager } from './components/AutoBackupManager';
import { Toast } from './components/ui/Toast';
import { AnimatePresence } from 'framer-motion';


// DepEd-branded loading splash while auth state resolves
function LoadingSplash() {
  const schoolProfile = useAppStore(state => state.schoolProfile);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-deped-blue via-deped-blue-dark to-[#051d45] relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-deped-blue-light/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-deped-red/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-deped-yellow/8 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Logo */}
        <div className="p-5 bg-white/6 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
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
            <div className="absolute inset-0 border-[2.5px] border-transparent border-t-deped-yellow rounded-full animate-spin" />
          </div>
          <span className="text-[13px] text-blue-200/50 font-medium animate-pulse">Loading...</span>
        </div>

        {/* DepEd tri-color accent */}
        <div className="flex gap-1 mt-1">
          <div className="w-8 h-[2px] bg-deped-blue-light/60 rounded-full" />
          <div className="w-5 h-[2px] bg-deped-red/60 rounded-full" />
          <div className="w-8 h-[2px] bg-deped-yellow/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 'pending'    — waiting for the main process verdict (Electron only)
// 'licensed'   — main process confirmed a valid license
// 'unlicensed' — main process says no/expired license (trial may still apply)
// 'legacy'     — no main-process licensing available (web build / IPC failure):
//                fall back to the old profile-based gate
type LicenseVerdict = 'pending' | 'licensed' | 'unlicensed' | 'legacy';

function App() {
  const { isAuthenticated, isLoading, needsAccountSetup } = useAuthStore();
  const { currentView, schoolProfile, isSyncReady, selectedSection, sections } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [licenseVerdict, setLicenseVerdict] = useState<LicenseVerdict>(
    window.electronAPI?.licenseStatus ? 'pending' : 'legacy'
  );

  // React to license changes: re-activation from the ActivationPage, or a
  // revocation pushed by the main process's background verification.
  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.licenseStatus) return;

    const refresh = async () => {
      try {
        const status = await electronAPI.licenseStatus();
        setLicenseVerdict(status.activated ? 'licensed' : 'unlicensed');
      } catch {
        setLicenseVerdict('legacy');
      }
    };

    window.addEventListener('formease-license-changed', refresh);
    electronAPI.onLicenseRevoked?.(() => {
      try {
        localStorage.setItem('formease-license-reset-detected', 'true');
      } catch { /* ignore */ }
      setLicenseVerdict('unlicensed');
    });
    return () => window.removeEventListener('formease-license-changed', refresh);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isSyncReady) {
      try {
        const completed = localStorage.getItem('formease_onboarding_completed') === 'true';
        if (!completed) {
          const timer = setTimeout(() => setShowOnboarding(true), 0);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAuthenticated, isSyncReady]);

  useEffect(() => {
    const handleTrigger = () => setShowOnboarding(true);
    window.addEventListener('formease-trigger-onboarding', handleTrigger);
    return () => window.removeEventListener('formease-trigger-onboarding', handleTrigger);
  }, []);

  const selectedSectionObj = sections.find(s => s.section_name === selectedSection);
  const isSHSSection = selectedSectionObj 
    ? (selectedSectionObj.section_grade_level.includes('11') || selectedSectionObj.section_grade_level.includes('12'))
    : false;

  const isExpired = schoolProfile?.subscription_end_date
    ? new Date(schoolProfile.subscription_end_date) < new Date()
    : false;

  // Use school name for page title
  useEffect(() => {
    const schoolName = schoolProfile?.name?.trim();
    document.title = schoolName && schoolName !== 'School Name' ? schoolName : 'FormEase Pro';
  }, [schoolProfile]);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAppStore();
        await initializeAuthStore();
        console.log('✅ Application initialization complete');

        const state = useAppStore.getState();
        const profile = state.schoolProfile;

        if (window.electronAPI?.licenseStatus) {
          // --- MAIN-PROCESS LICENSE VERDICT (Electron) ---
          // The verdict is computed and stored by the main process; the
          // renderer cannot forge it via localStorage/IndexedDB edits.
          try {
            let status = await window.electronAPI.licenseStatus();

            // Legacy migration: installs activated before v2.2.0 kept their
            // activation only in renderer state. Re-verify the stored serial
            // once and bind it in the main process.
            if (!status.activated && status.reason === 'none' &&
                profile.is_activated && !profile.is_trial && profile.activation_key) {
              console.log('🛡️ Migrating legacy activation to main process...');
              const migrated = await window.electronAPI.licenseActivate({
                serial: profile.activation_key,
                fullName: profile.adviser_name,
                platform: navigator.userAgent.toLowerCase().includes('mac') ? 'mac' : 'windows',
              });
              if (migrated.success) {
                status = await window.electronAPI.licenseStatus();
              } else if (migrated.offline) {
                // Offline grace: keep the legacy profile-based verdict until
                // the licensing server is reachable again.
                console.log('📡 License migration deferred (offline)');
                setLicenseVerdict('legacy');
                return;
              }
              // Explicit rejection (invalid serial / bound elsewhere) falls
              // through to an 'unlicensed' verdict below.
            }

            setLicenseVerdict(status.activated ? 'licensed' : 'unlicensed');
          } catch (licenseErr) {
            console.warn('License status check failed, using legacy gate:', licenseErr);
            setLicenseVerdict('legacy');
          }
        } else if (profile.is_activated && profile.activation_key && !profile.is_trial && navigator.onLine) {
          // --- BACKGROUND LICENSE VERIFICATION (web build fallback) ---
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
                  activated_at: undefined,
                  subscription_end_date: undefined
                });
              }
            }
          } catch {
            console.warn('📡 License verification skipped (offline or network error)');
          }
        }
      } catch (error) {
        console.error('❌ Application initialization failed:', error);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void initializeAppStore();
    } else {
      // Reset app-store state on logout to prevent data leaks between sessions
      useAppStore.setState({
        students: [],
        studentProfiles: [],
        sections: [],
        subjects: [],
        classRecords: [],
        gradingSheetRecords: [],
        hpsRecords: [],
        enrollments: [],
        announcements: [],
        attendanceRecords: [],
        sf2Sheets: [],
        observedValues: [],
        activeSF2Sheet: null,
        selectedSection: null,
      });
    }
  }, [isAuthenticated]);

  // Use a synchronized loading state to prevent race conditions during reload
  if (isLoading || (isAuthenticated && !isSyncReady) || licenseVerdict === 'pending') {
    return <LoadingSplash />;
  }

  // Activation gate. In Electron the verdict comes from the main process and
  // cannot be forged from the renderer; trials remain profile-based (they are
  // strictly time-boxed). The 'legacy' verdict covers the web build and
  // offline-grace migration, using the old profile-based checks.
  const trialActive = !!(schoolProfile?.is_activated && schoolProfile.is_trial && !isExpired);
  const activationOk =
    licenseVerdict === 'licensed' ||
    (licenseVerdict === 'legacy' && !!schoolProfile?.is_activated && !isExpired) ||
    (licenseVerdict === 'unlicensed' && trialActive);

  if (!activationOk) {
    return <ActivationPage />;
  }

  // 3. First run: no local account exists yet — force account creation
  if (!isAuthenticated && needsAccountSetup) {
    return <AccountSetupPage />;
  }

  // 4. Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsPage />;
      case 'enrollment':
        return <EnrollmentCenterPage />;
      case 'institute':
        return <InstitutePage />;
      case 'subjects':
        return <SubjectsPage />;
      case 'class-record':
        return isSHSSection ? <ShsEClassRecord /> : <EClassRecord />;
      case 'eclass':
        return isSHSSection ? <ShsEClassRecord /> : <EClassRecord />;
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
      case 'tgs':
        return <TemporaryGradeSlipPage />;
      case 'anecdotal-record':
        return <AnecdotalRecordPage />;
      case 'games-tools':
        return <GamesAndToolsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#080d1a] relative text-slate-800 dark:text-slate-200">
      <AutoBackupManager />
      {/* Global Multi-Color Mesh Underlay (static — animating this forces a
          full-window repaint every frame and was a major source of lag) */}
      <div className="absolute inset-0 z-0 opacity-60 dark:opacity-20 pointer-events-none print:hidden" style={{
        backgroundImage: `radial-gradient(circle at 10% 0%, #3A7BFF44 0%, transparent 50%), radial-gradient(circle at 90% 100%, #10b98133 0%, transparent 50%), radial-gradient(circle at 50% 50%, #fdb71411 0%, transparent 50%)`,
      }} />
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none print:hidden" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <Toast />
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex w-full h-full p-0 gap-0 box-border print:p-0 print:block">
        <div className="print:hidden h-full flex flex-col">
          <Sidebar />
        </div>
        <main data-tour="workspace" className="flex-1 flex flex-col overflow-hidden bg-white/85 dark:bg-[#0a101f]/90 rounded-none border-l border-r-0 border-y-0 border-slate-200 dark:border-white/5 relative print:bg-white print:border-none print:shadow-none print:rounded-none print:block print:overflow-visible">
          <div className="print:hidden">
            <Header />
          </div>
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 custom-scrollbar print:p-0 print:overflow-visible">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}


export default App;
