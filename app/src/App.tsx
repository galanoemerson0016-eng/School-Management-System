import { useAuthStore, useAppStore } from './stores';
import { Sidebar, Header } from './components/layout';
import {
  LoginPage,
  Dashboard,
  StudentsPage,
  ClassesPage,
  SubjectsPage,
  EClassRecord,
  SF9Page,
  SF10Page,
  AttendancePage,
  AnnouncementsPage,
  InstitutePage,
  SettingsPage,
  UsersPage,
  ReportsPage,
  ConsolidatedGradesPage,
  CalendarPage,
} from './pages';
import useStoreSync from './hooks/useStoreSync';

// DepEd-branded loading splash while auth state resolves
function LoadingSplash() {
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
            src="/school-logo.png"
            alt="School Logo"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* School name */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white tracking-wider">Calibungan High School</h1>
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
  const { currentView } = useAppStore();

  // Sync data with Firestore
  useStoreSync();

  // Show loading splash while auth state is resolving — prevents login page flash
  if (isLoading) {
    return <LoadingSplash />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render the appropriate page based on currentView
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsPage />;
      case 'institute':
        return <InstitutePage />;
      case 'classes':
        return <ClassesPage />;
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
      case 'attendance':
        return <AttendancePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'announcements':
        return <AnnouncementsPage />;
      case 'parent-portal':
        return <ParentPortalPage />;
      case 'reports':
        return <ReportsPage />;
      case 'consolidated-grades':
        return <ConsolidatedGradesPage />;
      case 'users':
        return user?.role === 'admin' ? <UsersPage /> : <Dashboard />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f0f4f8] dark:bg-[#080d1a] relative text-slate-800 dark:text-slate-200">
      {/* Global Animated Multi-Color Mesh Underlay */}
      <div className="absolute inset-0 z-0 opacity-60 dark:opacity-20 pointer-events-none animate-pulse" style={{
        backgroundImage: `radial-gradient(circle at 10% 0%, #3A7BFF44 0%, transparent 50%), radial-gradient(circle at 90% 100%, #10b98133 0%, transparent 50%), radial-gradient(circle at 50% 50%, #fdb71411 0%, transparent 50%)`,
        animationDuration: '15s',
      }} />
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 flex w-full h-full p-2 lg:p-3 gap-2 lg:gap-3 box-border">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[28px] border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
          <Header />
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Parent Portal — functional view for parents
function ParentPortalPage() {
  const { classRecords, announcements } = useAppStore();

  // For now show a read-only overview
  const recentAnnouncements = announcements.slice(0, 5);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-deped-blue to-blue-600 text-white p-8 text-center">
          <div className="text-5xl mb-4">👪</div>
          <h2 className="text-2xl font-bold mb-2">Parent Portal</h2>
          <p className="text-blue-200">View your child's grades, attendance, and announcements</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">📊</div>
              <p className="font-bold text-gray-800">Grades</p>
              <p className="text-sm text-gray-600 mt-1">View quarterly grades and report cards</p>
              <p className="mt-3 text-xs text-gray-400">
                {classRecords.length > 0 ? `${classRecords.length} records available` : 'No grades posted yet'}
              </p>
            </div>
            <div className="p-5 bg-green-50 rounded-xl border border-green-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">✅</div>
              <p className="font-bold text-gray-800">Attendance</p>
              <p className="text-sm text-gray-600 mt-1">Check daily attendance record</p>
              <p className="mt-3 text-xs text-gray-400">Real-time attendance tracking</p>
            </div>
            <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">📢</div>
              <p className="font-bold text-gray-800">Announcements</p>
              <p className="text-sm text-gray-600 mt-1">School updates and notices</p>
              <p className="mt-3 text-xs text-gray-400">{announcements.length} announcements</p>
            </div>
          </div>

          {/* Recent Announcements for Parents */}
          {recentAnnouncements.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-lg">📢</span> Latest Announcements
              </h3>
              <div className="space-y-2">
                {recentAnnouncements.map(a => (
                  <div key={a.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${a.announcement_type === 'urgent' ? 'bg-red-100 text-red-700' : a.announcement_type === 'event' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {a.announcement_type}
                      </span>
                      <span className="text-xs text-gray-400">{a.announcement_date}</span>
                    </div>
                    <p className="font-bold text-sm text-gray-800">{a.announcement_title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.announcement_content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default App;
