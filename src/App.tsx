import React, { useState, useEffect } from 'react';
import { TenantType, UserRole } from './types';
import LoginScreen from './components/LoginScreen';
import GrowthDashboard from './components/GrowthDashboard';
import ContactsView from './components/ContactsView';
import DispatchBoard from './components/DispatchBoard';
import UserManagement from './components/UserManagement';
import PdfIntake from './components/PdfIntake';
import AiMarketing from './components/AiMarketing';
import AdminPanel from './components/AdminPanel';
import AutomationControlCenter from './components/AutomationControlCenter';
import { getSavedToken, getSavedTenant, getSavedUser, clearSession, saveSession, initLiveWebSocket, getSavedDarkMode, saveDarkMode
} from './lib/api'; import { BarChart3, Users, CalendarRange, Cpu, Sparkles, ShieldAlert, Search, Moon, Sun, Bell, Settings, LogOut, ChevronDown, ChevronRight, Building, Menu, Clock, ExternalLink, Crown, LayoutDashboard, Smartphone, Activity, Compass, X
} from 'lucide-react'; export default function App() {
  // Authentication & tenant tracking states loaded directly from persisted browser session
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSavedToken()); const [currentTenant, setCurrentTenant] = useState<TenantType | 'all'>(() => getSavedTenant()); const [userRole, setUserRole] = useState<UserRole>(() => { const usr = getSavedUser(); return usr ? usr.role : 'Admin';
  }); const [userName, setUserName] = useState(() => { const usr = getSavedUser(); return usr ? usr.name : 'Global Administrator';
  }); const [userEmail, setUserEmail] = useState(() => { const usr = getSavedUser(); return usr ? usr.email : 'admin@crms.com';
  }); const [userAvatar, setUserAvatar] = useState(() => { const usr = getSavedUser(); return usr ? usr.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
  });

  // Sidebar navigation trackers
  const [activeTab, setActiveTab] = useState('Growth Dashboard'); const [sidebarOpen, setSidebarOpen] = useState(true); const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ dashboard: false, crm: true, prj: true, marketing: true, users: true
  }); const [searchQuery, setSearchQuery] = useState(''); const [showNotifications, setShowNotifications] = useState(false); const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }>>([]); const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => { const id = `toast-${Date.now()}`; setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  useEffect(() => { const handleToastEvent = (e: Event & { detail?: { message: string; type?: 'success' | 'info' | 'warning' | 'error' } }) => { if (e.detail) { showToast(e.detail.message, e.detail.type || 'success');
      }
    }; window.addEventListener('crm_show_toast', handleToastEvent as any); return () => window.removeEventListener('crm_show_toast', handleToastEvent as any);
  }, []); const handleTabClick = (tabName: string) => { setActiveTab(tabName); if (window.innerWidth < 768) { setSidebarOpen(false);
    }
  };

  // Live real-time responsive UTC clock ticker
  const [utcClock, setUtcClock] = useState(() => new Date().toISOString().slice(11, 19));

  // Notifications state
  const [notifications, setNotifications] = useState<Array<{id:string; text:string; time:string; read:boolean}>>([]);

  // Hook up responsive ticking clock as requested in core design
  useEffect(() => { const timer = setInterval(() => { setUtcClock(new Date().toISOString().slice(11, 19));
    }, 1000); return () => clearInterval(timer);
  }, []);

  // Handle responsive mobile sidebar state automatically
  useEffect(() => { const handleResize = () => { if (window.innerWidth < 768) { setSidebarOpen(false);
      } else { setSidebarOpen(true);
      }
    }; handleResize(); // trigger initially window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connect active WebSocket system channel when logged in
  useEffect(() => { if (!isLoggedIn) return; const ws = initLiveWebSocket((message) => { console.log("App received WebSocket event payload:", message);

      // Forward WebSocket message as custom event to AutomationControlCenter
  const customEvent = new CustomEvent('crm_websocket_message', { detail: message }); window.dispatchEvent(customEvent); if (message.type === "TASK_CREATED") { setNotifications((prev) => [
          { id: `n-${Date.now()}`, text: `Workforce Dispatch: Scheduled ${message.data?.type || 'task'} with ${message.data?.technician || 'tech'} for ${message.data?.client || 'client'}`, time: 'Just now', read: false
          },
          ...prev
        ]);
      } else if (message.type === "DOCUMENT_CREATED") { setNotifications((prev) => [
          { id: `n-${Date.now()}`, text: `smart PDF parsed: "${message.data?.fileName || 'document'}"`, time: 'Just now', read: false
          },
          ...prev
        ]);
      } else if (message.type === "CAMPAIGN_CREATED") { setNotifications((prev) => [
          { id: `n-${Date.now()}`, text: `Marketing draft generated for ${message.data?.tenant?.toUpperCase() || 'tenant'} on ${message.data?.platform || 'platform'}`, time: 'Just now', read: false
          },
          ...prev
        ]);
      } else if (message.type === "CAMPAIGN_UPDATED" && message.data?.status === "Approved") { setNotifications((prev) => [
          { id: `n-${Date.now()}`, text: `Ad campaign manual sign-off: "${message.data?.title || 'campaign'}" approved and pushed live.`, time: 'Just now', read: false
          },
          ...prev
        ]);
      }
    }); return () => { ws.close();
    };
  }, [isLoggedIn]);

  // Global High-Frequency Polling Re-Hydration (3000ms)
  useEffect(() => {
    if (!isLoggedIn) return;
    const poller = setInterval(() => {
      // Triggers silent state hydration across active dashboards
      window.dispatchEvent(new CustomEvent('crm_global_hydration_tick'));
    }, 3000);
    return () => clearInterval(poller);
  }, [isLoggedIn]);

  // Hydrate Dark Mode
  useEffect(() => { 
    const savedDark = getSavedDarkMode();
    if (savedDark !== false) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); 

  // Handle Auth expiry cleanly without hard page reloads
  useEffect(() => {
    const handleAuthExpired = () => setIsLoggedIn(false);
    window.addEventListener('crm_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('crm_auth_expired', handleAuthExpired);
  }, []);
  const handleLoginSuccess = (tenant: TenantType | 'all', role: UserRole, name: string, avatar: string, email: string) => { setCurrentTenant(tenant); setUserRole(role); setUserName(name); setUserAvatar(avatar); setUserEmail(email); setIsLoggedIn(true);

    // Auto-route based on login category
  if (tenant === 'full_home_renovation') { setActiveTab('Growth Dashboard');
    } else if (tenant === 'kitchen_renovation') { setActiveTab('Campaigns');
    } else if (tenant === 'bathroom_renovation') { setActiveTab('Timesheets');
    } else { setActiveTab('Growth Dashboard');
    }
  };
  const handleLogout = () => { clearSession(); setIsLoggedIn(false); setShowProfileMenu(false);
  };
  const markAllNotificationsRead = () => { setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  const toggleMenu = (menu: string) => { setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Render correct main workspace component based on clicked sidebar item
  const renderWorkspaceContent = () => { switch (activeTab) { case 'Growth Dashboard': case 'Dashboard': case 'Sales Overview': case 'Executive Dashboard': case 'Deals Dashboard': case 'Leads Dashboard': case 'Project Dashboard': case 'Revenue Summary': return <GrowthDashboard />; case 'Contacts': case 'Companies': case 'Deals': case 'Leads': case 'Pipeline': case 'Proposals': case 'Contracts': case 'Invoices': case 'Payments': case 'Analytics': case 'Activities': return <ContactsView />; case 'Projects': case 'Tasks': case 'Milestones': case 'Timesheets': return <DispatchBoard />; case 'Estimations': case 'Application': case 'Smart Application': return <PdfIntake />; case 'Automation Center': return <AutomationControlCenter />; case 'Campaigns': case 'Email Marketing': case 'Email Engagement': return <AiMarketing />; case 'Manage Users': case 'Roles & Permissions': case 'Departments': return <UserManagement />; case 'Super Admin': case 'Super Admin Overlay': return (
          <AdminPanel currentTenant={currentTenant} onTenantChange={(t) => setCurrentTenant(t)} 
          />
        ); default: return <GrowthDashboard />;
    }
  };
  if (!isLoggedIn) { return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
  const sidebarLinkClass = (tabName: string) => { const isActive = activeTab === tabName; return `sidebar-link ${isActive ? 'active' : ''}`;
  };
  return (
    <div className={`min-h-screen flex text-slate-900 dark:text-white font-sans antialiased`} style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      
      {/* Mobile responsive backdrop overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 md:hidden transition-all duration-350"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`${ sidebarOpen 
            ? 'w-64 translate-x-0 shadow-2xl shadow-slate-950/40' 
            : 'w-64 -translate-x-full md:w-20 md:translate-x-0 md:shadow-none'
        } shrink-0 flex flex-col justify-between transition-all duration-305 ease-in-out fixed inset-y-0 left-0 z-30 md:static h-screen`} style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden pt-4 px-3.5">
          {/* Brand header */}
          <div className="flex items-center gap-2 mb-6 px-1 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center shadow-sm">
                <Crown className="w-4.5 h-4.5 text-white dark:text-black" />
              </div>
              {sidebarOpen && <span className="text-md font-bold tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}>Abdelghanem</span>}
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"> v1.4
                </span>
              {/* Close Button for Responsive Mobile layout */}
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-neutral-600 dark:text-neutral-400 transition-colors md:hidden" title="Close Sidebar"
              >
                <X className="w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Navigation Category blocks */}
          <nav className="space-y-6 text-xs flex-1">
            
            {/* 1. MAIN MENU block */}
            <div className="space-y-1.5">
              {sidebarOpen && <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest block px-1.5">Main Menu</span>}
              
              <div className="space-y-1">
                {/* Dashboard - clickable toggle */}
                <button onClick={() => toggleMenu('dashboard')} className={`w-full flex items-center justify-between p-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${ activeTab.includes('Dashboard') || activeTab === 'Dashboard'
                      ? 'bg-black dark:bg-white text-white dark:text-black text-white shadow-md shadow-black/5 dark:shadow-white/5' 
                      : 'text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white dark:hover:bg-neutral-100 dark:hover:bg-neutral-900   '
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    {sidebarOpen && <span>Dashboard</span>}
                  </div>
                  {sidebarOpen && (expandedMenus.dashboard ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                </button>

                {/* Dashboard submenu items */}
                {sidebarOpen && expandedMenus.dashboard && (
                  <div className="pl-6 space-y-1">
                    {['Growth Dashboard'].map(subtab => (
                      <button key={subtab} onClick={() => handleTabClick(subtab)} className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-between transition ${ activeTab === subtab 
                            ? 'text-black dark:text-white font-extrabold bg-neutral-200 dark:bg-neutral-800' 
                            : 'text-neutral-600 dark:text-neutral-400 transition-colors hover:text-neutral-850  '
                        }`}
                      >
                        <span>• {subtab}</span>
                        {activeTab === subtab && <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-ping" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Smart Application */}
                <button onClick={() => handleTabClick('Smart Application')} className={`w-full flex items-center justify-between p-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${ activeTab === 'Smart Application' || activeTab === 'Application' || activeTab === 'Estimations'
                      ? 'bg-black dark:bg-white text-white dark:text-black text-white shadow-md shadow-black/5 dark:shadow-white/5' 
                      : 'text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white dark:hover:bg-neutral-100 dark:hover:bg-neutral-900   '
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4" />
                    {sidebarOpen && <span>Smart Application</span>}
                  </div>
                </button>

                {/* Super Admin Overlay */}
                {userRole === 'Admin' && (
                  <button onClick={() => handleTabClick('Super Admin Overlay')} className={`w-full flex items-center justify-between p-2.5 rounded-xl font-semibold transition ${ activeTab === 'Super Admin Overlay' || activeTab === 'Super Admin'
                        ? 'bg-black dark:bg-white text-white dark:text-black text-white font-bold' 
                        : 'text-neutral-600 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white   '
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      {sidebarOpen && <span>Super Admin Overlay</span>}
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* 2. CRM block */}
            <div className="space-y-1.5" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {sidebarOpen && (
                <div className="flex items-center justify-between px-1.5 mb-1">
                  <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest">CRM</span>
                  <button onClick={() => toggleMenu('crm')} className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white">
                    {expandedMenus.crm ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {(expandedMenus.crm || !sidebarOpen) && (
                <div className="space-y-1">
                  {['Contacts', 'Companies', 'Deals', 'Leads', 'Pipeline', 'Proposals', 'Contracts', 'Estimations', 'Invoices', 'Payments', 'Analytics', 'Activities'].map(tab => (
                    <button key={tab} onClick={() => handleTabClick(tab)} className={sidebarLinkClass(tab)}
                    >
                      <span className="text-[10px] w-4 text-center">◆</span>
                      {sidebarOpen && <span>{tab}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. PRJ WORKFORCE */}
            <div className="space-y-1.5" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {sidebarOpen && (
                <div className="flex items-center justify-between px-1.5 mb-1">
                  <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest">PRJ WORKFORCE</span>
                  <button onClick={() => toggleMenu('prj')} className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white">
                    {expandedMenus.prj ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {(expandedMenus.prj || !sidebarOpen) && (
                <div className="space-y-1">
                  {['Projects', 'Tasks', 'Milestones', 'Timesheets'].map(tab => (
                    <button key={tab} onClick={() => handleTabClick(tab)} className={sidebarLinkClass(tab)}
                    >
                      <CalendarRange className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                      {sidebarOpen && <span>{tab}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. MARKETING */}
            <div className="space-y-1.5" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              {sidebarOpen && (
                <div className="flex items-center justify-between px-1.5 mb-1">
                  <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest">Marketing</span>
                  <button onClick={() => toggleMenu('marketing')} className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white">
                    {expandedMenus.marketing ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>
              )}
              {(expandedMenus.marketing || !sidebarOpen) && (
                <div className="space-y-1">
                  {['Automation Center', 'Campaigns', 'Email Marketing', 'Email Engagement'].map(tab => (
                    <button key={tab} onClick={() => handleTabClick(tab)} className={sidebarLinkClass(tab)}
                    >
                      {tab === 'Automation Center' ? (
                        <Compass className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                      )}
                      {sidebarOpen && <span>{tab}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. USER MANAGEMENT */}
            {userRole === 'Admin' && (
              <div className="space-y-1.5 pb-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                {sidebarOpen && (
                  <div className="flex items-center justify-between px-1.5 mb-1">
                    <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest">User Management</span>
                    <button onClick={() => toggleMenu('users')} className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white">
                      {expandedMenus.users ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                {(expandedMenus.users || !sidebarOpen) && (
                  <div className="space-y-1">
                    {['Manage Users', 'Roles & Permissions', 'Departments'].map(tab => (
                      <button key={tab} onClick={() => handleTabClick(tab)} className={sidebarLinkClass(tab)}
                      >
                        <Users className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                        {sidebarOpen && <span>{tab}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </nav>
        </div>

        {/* Global tenant indicator profile drawer at sidebar footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }} className="p-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Building className="w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors flex-shrink-0" />
            {sidebarOpen && (
              <div className="text-[10px] truncate leading-tight">
                <span className="text-neutral-600 dark:text-neutral-400 transition-colors block font-mono uppercase">Operational Tenant</span>
                <span className="font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {currentTenant === 'all' ? '🏢 Central Office' : `${currentTenant} Works`}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN AREA GRID */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        
        {/* HEADER TOOLBAR NAVIGATION BAR */}
        <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }} className="h-14 shrink-0 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded text-neutral-600 dark:text-neutral-400 transition-colors transition" title="Toggle Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Top Bar Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400 transition-colors pointer-events-none" />
              <input type="text" placeholder="Search anything..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} className="w-full pl-8 pr-4 py-1.5 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
              />
            </div>
          </div>

          {/* Quick Action Navigation items */}
          <div className="flex items-center gap-3">
            
            {/* Real-time UTC Clock ticker */}
            <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors px-3 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <Clock className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
              <span>UTC Time Check: {utcClock}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const isDark = document.documentElement.classList.toggle("dark");
                saveDarkMode(isDark);
              }}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-black dark:text-white transition"
              title="Toggle Theme"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>


            {/* Notification button */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-neutral-600 dark:text-neutral-400 transition-colors transition relative" title="System Signals Notifications"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-black dark:bg-white animate-ping" />
                )}
              </button>

              {/* Notifications List Popover */}
              {showNotifications && (
                <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} className="absolute right-0 mt-2.5 w-80 border rounded-xl shadow-xl z-50 p-4 animate-fade-in text-xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Operational System Notifications</span>
                    <button onClick={markAllNotificationsRead} className="text-[10px] text-black dark:text-white font-semibold"
                    > Read All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No notifications</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2 rounded-lg text-[11px] leading-relaxed transition ${n.read ? '' : 'bg-neutral-100 dark:bg-neutral-800 font-medium border-l-2 border-black dark:border-white'}`} style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-primary)' }}
                      >
                        <div>{n.text}</div>
                        <span className="text-[9px] text-neutral-600 dark:text-neutral-400 transition-colors block mt-1 font-mono">{n.time}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="w-full text-center py-1 bg-slate-100 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}
                  > Close Popover
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown menu */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-1.5 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition" title="Current Admin Log Session"
              >
                <img src={userAvatar} alt={userName} className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                     onError={(e) => { 
                       const target = e.target as HTMLImageElement;
                       target.onerror = null; // Prevent infinite loop
                       target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='background-color:%234F46E5;'%3E%3Cpath d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                     }}
                />
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
              </button>

              {/* Profile dropdown popup */}
              {showProfileMenu && (
                <div style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }} className="absolute right-0 mt-2 w-56 border rounded-xl shadow-xl z-50 p-3 text-xs space-y-2 animate-fade-in">
                  <div className="pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{userName}</div>
                    <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors font-mono truncate">{userEmail}</div>
                    <span className="inline-block mt-1 bg-black text-white dark:bg-white dark:text-black font-bold text-[8px] px-1.5 rounded-sm uppercase tracking-wider">
                      {userRole} Role
                    </span>
                  </div>

                  <div className="space-y-1">
                    {userRole === 'Admin' && (
                      <button onClick={() => { setActiveTab('Super Admin Overlay'); setShowProfileMenu(false); }} className="w-full text-left py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                        <span>Workspace Admin Settings</span>
                      </button>
                    )}
                    <button onClick={handleLogout} className="w-full text-left py-1.5 px-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-black dark:text-white font-bold flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out of SaaS Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT SCROLLABLE CANVAS CONTAINER */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto relative space-y-6">
          
          {/* Active Tenant Workspace Alerts pill */}
          <div className="flex flex-wrap items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">SYSTEM CHANNEL LEDGER STATE:</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">
                {currentTenant === 'all' ? 'All Active Tenant Overrides' : `${currentTenant} Works Division Only`}
              </span>
            </div>
            
            <a href="https://ai.studio.build" target="_blank" rel="noopener noreferrer" className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-1 font-semibold transition"
            >
              <span>Deployed to Cloud Run</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Core Modular Component Render Injector */}
          {renderWorkspaceContent()}

        </main>

        {/* FOOTER */}
        <footer className="shrink-0 py-4 px-6 text-[11px] text-neutral-600 dark:text-neutral-400 transition-colors flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto w-full" style={{ backgroundColor: 'var(--header-bg)', borderTop: '1px solid var(--header-border)' }}
        >
          <span>Copyright © 2026 Abdelghanem Enterprise Automation • All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#about" className="hover:text-black dark:hover:text-white">About SaaS API</a>
            <a href="#terms" className="hover:text-black dark:hover:text-white">Terms of Service</a>
            <a href="#contact" className="hover:text-black dark:hover:text-white">Contact Operator Support</a>
          </div>
        </footer>

      </div>

      {/* Toast Notifications Stack */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-scale-in flex items-center justify-between gap-3 text-xs font-semibold pointer-events-auto transition-all duration-300 ${ toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-800/80 text-emerald-350 shadow-emerald-950/20' : toast.type === 'error' ? 'bg-rose-950/90 border-rose-800/80 text-rose-350 shadow-rose-950/20' : toast.type === 'warning' ? 'bg-amber-950/90 border-amber-800/80 text-amber-350 shadow-amber-950/20' :
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 /80 text-slate-900 dark:text-white shadow-slate-950/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}