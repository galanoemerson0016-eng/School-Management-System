import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore, initializeAuthStore } from './stores/auth-store';
import { useAppStore, initializeAppStore } from './stores/app-store';
import { getMachineId } from './utils/machine-id';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Sidebar, Header } from './components/layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AutoBackupManager } from './components/AutoBackupManager';
import { AutoBackupManager as AutoBackupService } from './services/AutoBackupManager';
import { IncrementalBackupService } from './services/IncrementalBackupService';
import { Toast } from './components/ui/Toast';
import { AnimatePresence } from 'framer-motion';
import { UpdateCenterModal } from './components/updates/UpdateCenterModal';
import { ReconciliationReportModal } from './components/updates/ReconciliationReportModal';
import { ProfileDiffModal } from './components/ProfileDiffModal';
import { GoogleDriveOnboardingModal } from './components/modals/GoogleDriveOnboardingModal';
import { ClosingSyncOverlay } from './components/modals/ClosingSyncOverlay';
import { GradeSyncInspectorModal } from './components/modals/GradeSyncInspectorModal';
import { useUpdateStore } from './stores/update-store';
import { BroadcastBannerModal } from './components/broadcasts/BroadcastBannerModal';
import { pushAttendanceSessionToBackend, revokeAttendancePairing, subscribeToAttendanceUpdates } from './services/mobile-attendance-sync';
import { triggerParentAttendanceSms } from './services/sms-gateway';
import { formatLearnerName } from './utils/student-name';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AccountSetupPage = lazy(() => import('./pages/AccountSetupPage').then(m => ({ default: m.AccountSetupPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const StudentsPage = lazy(() => import('./pages/StudentsPage').then(m => ({ default: m.StudentsPage })));
const EnrollmentCenterPage = lazy(() => import('./pages/EnrollmentCenterPage').then(m => ({ default: m.EnrollmentCenterPage })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const SectionsPage = lazy(() => import('./pages/SectionsPage').then(m => ({ default: m.SectionsPage })));
const EClassRecord = lazy(() => import('./pages/EClassRecord').then(m => ({ default: m.EClassRecord })));
const ShsEClassRecord = lazy(() => import('./pages/ShsEClassRecord').then(m => ({ default: m.ShsEClassRecord })));
const SF9Page = lazy(() => import('./pages/SF9Page').then(m => ({ default: m.SF9Page })));
const SF10Page = lazy(() => import('./pages/SF10Page').then(m => ({ default: m.SF10Page })));
const SF8Page = lazy(() => import('./pages/SF8Page').then(m => ({ default: m.SF8Page })));
const SF5Page = lazy(() => import('./pages/SF5Page').then(m => ({ default: m.SF5Page })));
const SF6Page = lazy(() => import('./pages/SF6Page').then(m => ({ default: m.SF6Page })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const DailyAttendancePage = lazy(() => import('./pages/DailyAttendancePage').then(m => ({ default: m.DailyAttendancePage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const InstitutePage = lazy(() => import('./pages/InstitutePage').then(m => ({ default: m.InstitutePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ConsolidatedGradesPage = lazy(() => import('./pages/ConsolidatedGradesPage').then(m => ({ default: m.ConsolidatedGradesPage })));
const CertificateGeneratorPage = lazy(() => import('./pages/CertificateGeneratorPage').then(m => ({ default: m.CertificateGeneratorPage })));
const SchoolFormsPage = lazy(() => import('./pages/SchoolFormsPage').then(m => ({ default: m.SchoolFormsPage })));
const NameTagPage = lazy(() => import('./pages/NameTagPage').then(m => ({ default: m.NameTagPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ActivationPage = lazy(() => import('./pages/ActivationPage').then(m => ({ default: m.ActivationPage })));
const LIRPage = lazy(() => import('./pages/LIRPage').then(m => ({ default: m.LIRPage })));
const TemporaryGradeSlipPage = lazy(() => import('./pages/TemporaryGradeSlipPage').then(m => ({ default: m.TemporaryGradeSlipPage })));
const PaceFormPage = lazy(() => import('./pages/PaceFormPage').then(m => ({ default: m.PaceFormPage })));
const GamesAndToolsPage = lazy(() => import('./pages/GamesAndToolsPage').then(m => ({ default: m.GamesAndToolsPage })));
const OnlineGeneratorsPage = lazy(() => import('./pages/OnlineGeneratorsPage').then(m => ({ default: m.OnlineGeneratorsPage })));
const StudentIDGeneratorPage = lazy(() => import('./pages/StudentIDGeneratorPage').then(m => ({ default: m.StudentIDGeneratorPage })));
const MobileAttendancePage = lazy(() => import('./pages/MobileAttendancePage').then(m => ({ default: m.MobileAttendancePage })));

function ContentLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center" style={{ minHeight: 300 }}>
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-slate-200 dark:border-slate-800 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-deped-blue dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    </div>
  );
}

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
          <div className="w-8 bg-deped-blue-light/60 rounded-full" style={{ height: 2 }} />
          <div className="w-5 bg-deped-red/60 rounded-full" style={{ height: 2 }} />
          <div className="w-8 bg-deped-yellow/60 rounded-full" style={{ height: 2 }} />
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

// Vite replaces this at build time. Development is a local authoring
// environment, not a distributable copy of FormEase, so a hot reload must not
// run production license reconciliation or interrupt work with Activation.
const isDevelopmentBuild = import.meta.env.DEV;

function App() {
  const isMobileAttendance = typeof window !== 'undefined' &&
    (window.location.hash.includes('mobile-attendance') || window.location.search.includes('mobile-attendance'));
  const { isAuthenticated, isLoading, needsAccountSetup } = useAuthStore();
  const currentView = useAppStore(state => state.currentView);
  const schoolProfile = useAppStore(state => state.schoolProfile);
  const theme = useAppStore(state => state.theme);
  const isSyncReady = useAppStore(state => state.isSyncReady);
  const selectedSection = useAppStore(state => state.selectedSection);
  const sections = useAppStore(state => state.sections);
  const students = useAppStore(state => state.students);
  const attendanceRecords = useAppStore(state => state.attendanceRecords);
  const pendingConflicts = useAppStore(state => state.pendingConflicts);
  const resolveMergeConflict = useAppStore(state => state.resolveMergeConflict);
  const currentConflict = pendingConflicts[0];
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGDriveOnboarding, setShowGDriveOnboarding] = useState(false);
  const [isClosingApp, setIsClosingApp] = useState(false);
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
        try {
          localStorage.removeItem('formease-license-offline-limit');
        } catch { /* ignore */ }
        setLicenseVerdict(status.activated ? 'licensed' : 'unlicensed');
      } catch {
        setLicenseVerdict('legacy');
      }
    };

    const handleOnline = async () => {
      console.log('📡 Device back online: triggering license verification...');
      if (electronAPI.licenseVerifyOnline) {
        try {
          await electronAPI.licenseVerifyOnline();
        } catch (err) {
          console.error('Failed to trigger online license verification:', err);
        }
      }
      refresh();
    };

    window.addEventListener('formease-license-changed', refresh);
    window.addEventListener('online', handleOnline);
    electronAPI.onLicenseRevoked?.(async () => {
      try {
        localStorage.setItem('formease-license-reset-detected', 'true');
        localStorage.removeItem('formease-license-offline-limit');
      } catch { /* ignore */ }
      setLicenseVerdict('unlicensed');

      // Also clear schoolProfile activation fields if they exist
      const state = useAppStore.getState();
      if (state.schoolProfile) {
        await state.updateSchoolProfile({
          ...state.schoolProfile,
          is_activated: false,
          activated_at: undefined,
          subscription_end_date: undefined,
          activation_key: undefined
        });
      }
    });
    return () => {
      window.removeEventListener('formease-license-changed', refresh);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Keep background Express server memory updated with active students & sections 24/7
  useEffect(() => {
    if (isMobileAttendance) return;
    const timer = setTimeout(() => {
      const state = useAppStore.getState();
      if (state.students.length > 0 || state.sections.length > 0) {
        // Mobile attendance companion only needs today's records for active roll call
        const today = new Date().toISOString().split('T')[0];
        const todaysRecords = (state.attendanceRecords || []).filter(r => r.date === today);
        pushAttendanceSessionToBackend({
          students: state.students,
          sections: state.sections,
          records: todaysRecords,
          schoolProfile: state.schoolProfile
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isMobileAttendance, students, sections, attendanceRecords, schoolProfile]);

  // Globally subscribe to mobile attendance updates so taps are never missed
  useEffect(() => {
    if (isMobileAttendance) return;
    const unsubscribe = subscribeToAttendanceUpdates((event) => {
      if (event.record && event.sourceDevice === 'Smartphone') {
        const state = useAppStore.getState();
        void state.upsertAttendanceRecords([event.record]);
        const name = event.studentName || event.record.student_lrn;
        state.showNotification(`📱 Smartphone Scan: ${name} marked ${event.record.status.toUpperCase()}`, 'success');

        // Trigger Parent SMS Notification on Laptop when mobile phone punches attendance
        const student = state.students.find(s => s.lrn === event.record.student_lrn);
        const parentPhone = student?.parent_contact || student?.parent_guardian_contact || student?.contact_number || '';
        if (parentPhone) {
          const studentFullName = student ? formatLearnerName(student, { middleInitialOnly: true }) : name;
          const schoolName = state.schoolProfile?.name || 'Calibungan High School';
          void triggerParentAttendanceSms(studentFullName, parentPhone, schoolName, event.record.status, event.record.date);
        }
      }
    });
    return () => unsubscribe();
  }, [isMobileAttendance]);

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

  // Show Google Drive cloud backup onboarding prompt if unlinked and due
  useEffect(() => {
    if (isAuthenticated && isSyncReady) {
      const timer = setTimeout(async () => {
        try {
          const { CloudSyncService } = await import('./services/cloud-sync');
          const state = await CloudSyncService.getStateAsync();
          if (!state.linked && CloudSyncService.shouldShowOnboarding()) {
            setShowGDriveOnboarding(true);
          }
        } catch (e) {
          console.warn('Google Drive onboarding check notice:', e);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSyncReady]);

  // Intercept Electron window close to save database snapshot and sync to Google Drive
  useEffect(() => {
    if (window.electronAPI?.onCloseRequested) {
      window.electronAPI.onCloseRequested(async () => {
        setIsClosingApp(true);
        try {
          await AutoBackupService.syncBeforeExit();
        } catch (err) {
          console.warn('App close sync notice:', err);
        } finally {
          if (window.electronAPI?.closeApp) {
            window.electronAPI.closeApp(true);
          }
        }
      });
    }
  }, []);

  useEffect(() => {
    const handleTrigger = () => setShowOnboarding(true);
    window.addEventListener('formease-trigger-onboarding', handleTrigger);
    return () => window.removeEventListener('formease-trigger-onboarding', handleTrigger);
  }, []);

  const selectedSectionObj = sections.find(s => s.id === selectedSection || s.section_name === selectedSection);
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
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  useEffect(() => {
    const disable = localStorage.getItem('disable-animations') === 'true';
    if (disable) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAppStore();
        await initializeAuthStore();
        const isMobile = typeof window !== 'undefined' && 
          (window.location.hash.includes('mobile-attendance') || window.location.search.includes('mobile-attendance'));
        if (!isMobile) {
          void AutoBackupService.init();
          IncrementalBackupService.init();
        }
        
        // Check for post-update data reconciliation
        if (window.electronAPI) {
          const updateStore = useUpdateStore.getState();
          void updateStore.checkForPostUpdateReconciliation();
        }
        
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

            try {
              localStorage.removeItem('formease-license-offline-limit');
            } catch { /* ignore */ }
            setLicenseVerdict(status.activated ? 'licensed' : 'unlicensed');
          } catch (licenseErr) {
            console.warn('License status check failed, using legacy gate:', licenseErr);
            setLicenseVerdict('legacy');
          }
        } else if (!isDevelopmentBuild && profile.is_activated && profile.activation_key && !profile.is_trial && navigator.onLine) {
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
                  subscription_end_date: undefined,
                  activation_key: undefined
                });
              }
            } else if (response.status === 404) {
              console.warn('⚠️ License was deleted or revoked. Reverting to activation state.');
              localStorage.setItem('formease-license-reset-detected', 'true');
              await state.updateSchoolProfile({
                ...profile,
                is_activated: false,
                activated_at: undefined,
                subscription_end_date: undefined,
                activation_key: undefined
              });
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
      void revokeAttendancePairing();
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

  // Standalone Mobile Phone Attendance Portal (accessed via scanning QR code on phone)
  if (isMobileAttendance) {
    return (
      <Suspense fallback={<LoadingSplash />}>
        <MobileAttendancePage />
      </Suspense>
    );
  }

  // Use a synchronized loading state to prevent race conditions during reload
  // Never evaluate authentication or activation from the default in-memory
  // profile. A full browser reload can happen during Vite HMR, and IndexedDB
  // must restore the real local installation first.
  if (isLoading || !isSyncReady || licenseVerdict === 'pending') {
    return <LoadingSplash />;
  }

  // Activation gate. In Electron the verdict comes from the main process and
  // cannot be forged from the renderer; trials remain profile-based (they are
  // strictly time-boxed). The 'legacy' verdict covers the web build and
  // offline-grace migration, using the old profile-based checks.
  const trialActive = !!(schoolProfile?.is_activated && schoolProfile.is_trial && !isExpired);
  const activationOk =
    isDevelopmentBuild ||
    licenseVerdict === 'licensed' ||
    (licenseVerdict === 'legacy' && !!schoolProfile?.is_activated && !isExpired) ||
    (licenseVerdict === 'unlicensed' && trialActive);

  if (!activationOk) {
    return (
      <Suspense fallback={<LoadingSplash />}>
        <ActivationPage />
      </Suspense>
    );
  }

  // 3. First run: no local account exists yet — force account creation
  if (!isAuthenticated && needsAccountSetup) {
    return (
      <Suspense fallback={<LoadingSplash />}>
        <AccountSetupPage />
      </Suspense>
    );
  }

  // 4. Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSplash />}>
        <BroadcastBannerModal />
        <AutoBackupManager />
        <LoginPage />
      </Suspense>
    );
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
      case 'daily-attendance':
        return <DailyAttendancePage />;
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
      case 'pace':
        return <PaceFormPage />;
      case 'games-tools':
        return <GamesAndToolsPage />;
      case 'online-generators':
        return <OnlineGeneratorsPage />;
      case 'student-id-generator':
        return <StudentIDGeneratorPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-app-bg-dark relative text-slate-800 dark:text-slate-200">
      <AutoBackupManager />

      <BroadcastBannerModal />
      <Toast />
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onClose={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* Global Update Modals */}
      <UpdateCenterModal />
      <ReconciliationReportModal />
      <GradeSyncInspectorModal />

      {/* Google Drive Automated Cloud Backup Modals */}
      <GoogleDriveOnboardingModal
        isOpen={showGDriveOnboarding}
        onClose={() => setShowGDriveOnboarding(false)}
        onConnected={() => {
          useAppStore.getState().showNotification('Google Drive linked successfully! Automated cloud backup is now active.', 'success');
        }}
      />
      <ClosingSyncOverlay isVisible={isClosingApp} />
      
      {currentConflict && (
        <ProfileDiffModal
          open={!!currentConflict}
          studentName={currentConflict.studentName}
          lrn={currentConflict.lrn}
          diffItems={currentConflict.diffItems}
          onConfirm={(mergedFields) => resolveMergeConflict(mergedFields)}
          onCancel={() => resolveMergeConflict(null)}
        />
      )}

      <div className="relative z-10 flex w-full h-full p-0 gap-0 box-border print:p-0 print:block">
        <div className="print:hidden h-full flex flex-col">
          <Sidebar />
        </div>
        <main data-tour="workspace" className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50 dark:bg-[#0B0F19] rounded-none border-l border-slate-200 dark:border-slate-800 relative print:bg-white print:border-none print:shadow-none print:rounded-none print:block print:overflow-visible">
          <div className="print:hidden">
            <Header />
          </div>
          <div className={`flex-1 flex flex-col min-h-0 ${['sf9', 'sf10', 'sf8', 'sf5', 'sf6', 'attendance', 'lir', 'certificates', 'name-tags', 'class-record', 'eclass', 'student-id-generator', 'consolidated-grades', 'tgs', 'pace'].includes(currentView) ? 'overflow-hidden p-0' : 'overflow-y-auto p-3 lg:p-4 custom-scrollbar'} print:p-0 print:overflow-visible`}>
            <ErrorBoundary>
              <Suspense fallback={<ContentLoading />}>
                {renderContent()}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}


export default App;
