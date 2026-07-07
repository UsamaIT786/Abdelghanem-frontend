import React, { useState, useEffect } from 'react'; import { User, UserRole } from '../types'; import { Users, Plus, Pencil, Trash2, X, AlertTriangle, Check, Search, Shield, Mail, UserCircle, Building, Key, RefreshCw, Filter
} from 'lucide-react'; import { fetchLiveUsers, createLiveUser, updateLiveUser, deleteLiveUser, initLiveWebSocket 
} from '../lib/api'; export default function UserManagement() { const [users, setUsers] = useState<User[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [showCreateForm, setShowCreateForm] = useState(false); const [editingUser, setEditingUser] = useState<User | null>(null); const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState(''); const [formEmail, setFormEmail] = useState(''); const [formPassword, setFormPassword] = useState(''); const [formRole, setFormRole] = useState<UserRole>('Technician'); const [formDept, setFormDept] = useState('Full Home Renovation'); const [formTenant, setFormTenant] = useState('full_home_renovation'); const loadUsers = async () => { try { const data = await fetchLiveUsers(); setUsers(data);
    } catch (err) { console.error('Failed to load users:', err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadUsers(); const ws = initLiveWebSocket((msg) => { if (msg.type === 'USER_CREATED' || msg.type === 'USER_UPDATED' || msg.type === 'USER_DELETED') { loadUsers();
      }
    }); return () => ws.close();
  }, []); const resetForm = () => { setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('Technician'); setFormDept('Full Home Renovation'); setFormTenant('full_home_renovation');
  };
  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); try { await createLiveUser({ name: formName, email: formEmail, password: formPassword, role: formRole, department: formDept, tenantId: formTenant,
      }); resetForm(); setShowCreateForm(false); await loadUsers(); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `User account created for "${formName}"! 👤`, type: 'success' } 
      }));
    } catch (err) { window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Failed to create user: ' + (err instanceof Error ? err.message : String(err)), type: 'error' } })); }
  };
  const handleStartEdit = (user: User) => { setEditingUser(user); setFormName(user.name); setFormEmail(user.email); setFormRole(user.role); setFormDept(user.department); setFormTenant((user as any).tenantId || 'all'); setFormPassword('');
  };
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const targetId = editingUser.id;
    const payload: any = { name: formName, email: formEmail, role: formRole, department: formDept, tenantId: formTenant };
    if (formPassword) payload.password = formPassword;

    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === targetId ? { ...u, ...payload } : u));
    setEditingUser(null);
    resetForm();
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `User profile updated for "${formName}"! ✏️`, type: 'success' } }));

    try {
      await updateLiveUser(targetId, payload);
    } catch (err) {
      console.warn("Optimistic update network failure:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm.id;
    const deletedName = deleteConfirm.name;

    // Optimistic UI Deletion
    setUsers(prev => prev.filter(u => u.id !== targetId));
    setDeleteConfirm(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `User profile for "${deletedName}" deleted! 🗑️`, type: 'warning' } }));

    try {
      await deleteLiveUser(targetId);
    } catch (err) {
      console.warn("Optimistic delete network failure:", err);
    }
  };
  const roleColors: Record<string, string> = { Admin: 'bg-indigo-600 dark:bg-indigo-500 text-white/10 text-purple-400 border-black dark:border-white/20', Operator: 'bg-indigo-600 dark:bg-indigo-500 text-white/10 text-blue-400 border-black dark:border-white/20', Marketer: 'bg-amber-500/10 text-amber-400 border-amber-500/20', Technician: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase())
  ); return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 /50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delete User</h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors mb-6">Remove <strong className="text-slate-900 dark:text-white">{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white text-sm font-semibold border border-slate-200 dark:border-slate-700 /50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl from-rose-600 to-pink-600 text-white text-sm font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl from-white dark:from-slate-900 via-slate-50 dark:via-slate-800 to-white dark:to-slate-900 p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 /50">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600 dark:bg-indigo-500 text-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-600 dark:bg-indigo-500 text-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-white shadow-xl shadow-purple-500/30 ring-2 ring-white/10">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors mt-0.5">Manage system users, roles & permissions</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowCreateForm(true); setEditingUser(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-white text-xs font-bold transition-all shadow-lg shadow-black/5 dark:shadow-white/5 hover:bg-indigo-600 dark:bg-indigo-500 text-white hover:">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingUser) && (
        <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl animate-scale-in">
          <form onSubmit={editingUser ? handleSaveEdit : handleCreate} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 /50">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingUser ? <><Pencil className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> Edit User</> : <><Plus className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> New User</>}
              </span>
              <button type="button" onClick={() => { setShowCreateForm(false); setEditingUser(null); resetForm(); }} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Full Name</label>
                <input required className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formName} onChange={e => setFormName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Email</label>
                <input required type="email" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="user@email.com" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">{editingUser ? 'New Password (leave blank)' : 'Password'}</label>
                <input type="password" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Role</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formRole} onChange={e => setFormRole(e.target.value as UserRole)}>
                  <option value="Admin">Admin</option><option value="Operator">Operator</option><option value="Marketer">Marketer</option><option value="Technician">Technician</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Department</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formDept} onChange={e => setFormDept(e.target.value)}>
                  <option value="Full Home Renovation">Full Home Renovation</option><option value="Kitchen Renovation">Kitchen Renovation</option><option value="Bathroom Renovation">Bathroom Renovation</option><option value="Granny Flat">Granny Flat</option><option value="Extension">Extension</option><option value="Multi Unit">Multi Unit</option><option value="New Luxe Homes">New Luxe Homes</option><option value="Administration">Administration</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Tenant Access</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none" value={formTenant} onChange={e => setFormTenant(e.target.value)}>
                  <option value="all">All Tenants</option><option value="full_home_renovation">Full Home Renovation</option><option value="kitchen_renovation">Kitchen Renovation</option><option value="bathroom_renovation">Bathroom Renovation</option><option value="granny_flat">Granny Flat</option><option value="extension">Extension</option><option value="multi_unit">Multi Unit</option><option value="new_luxe_homes">New Luxe Homes</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-500 text-white hover: text-white text-sm font-bold shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {editingUser ? 'Save Changes' : 'Create User'}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setEditingUser(null); resetForm(); }} className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white text-sm font-semibold border border-slate-200 dark:border-slate-700 /50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 /50">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors">
            {users.length} Registered Users
          </span>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors" />
            <input className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none placeholder:text-neutral-600 dark:text-neutral-400 transition-colors" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-[3px] border-black dark:border-white border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {filtered.map(user => (
              <div key={user.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors /50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white/20 /20 flex items-center justify-center shrink-0 border border-black dark:border-white/10">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <UserCircle className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${roleColors[user.role] || roleColors.Technician}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" />{user.department}</span>
                      <span>•</span>
                      <span>{(user as any).tenantId === 'all' ? 'Global' : (user as any).tenantId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleStartEdit(user)} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-neutral-500 dark:text-neutral-400"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteConfirm({ id: user.id, name: user.name })} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-neutral-600 dark:text-neutral-400 transition-colors">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roles & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-purple-400" /> Roles & Permissions</h3>
          <div className="space-y-2.5">
            {[
              { role: 'Admin', desc: 'Full system access', perms: 'Create, read, update, delete all records' },
              { role: 'Operator', desc: 'Daily operations', perms: 'Manage contacts, tasks, pipeline stages' },
              { role: 'Marketer', desc: 'Campaign management', perms: 'Generate, approve & manage campaigns' },
              { role: 'Technician', desc: 'Field operations', perms: 'View tasks, update job status' },
            ].map(r => (
              <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white/10 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /></div>
                <div><span className="text-xs font-semibold text-slate-900 dark:text-white">{r.role}</span><p className="text-[9px] text-neutral-600 dark:text-neutral-400 transition-colors mt-0.5">{r.desc} — {r.perms}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><Building className="w-4 h-4 text-cyan-400" /> Departments</h3>
          <div className="space-y-2.5">
            {[
              { dept: 'Administration', users: users.filter(u => u.department === 'Administration').length, color: 'purple' },
              { dept: 'Full Home Renovation', users: users.filter(u => u.department === 'Full Home Renovation').length, color: 'indigo' },
              { dept: 'Kitchen Renovation', users: users.filter(u => u.department === 'Kitchen Renovation').length, color: 'amber' },
              { dept: 'Bathroom Renovation', users: users.filter(u => u.department === 'Bathroom Renovation').length, color: 'cyan' },
              { dept: 'Granny Flat', users: users.filter(u => u.department === 'Granny Flat').length, color: 'violet' },
              { dept: 'Extension', users: users.filter(u => u.department === 'Extension').length, color: 'emerald' },
              { dept: 'Multi Unit', users: users.filter(u => u.department === 'Multi Unit').length, color: 'blue' },
              { dept: 'New Luxe Homes', users: users.filter(u => u.department === 'New Luxe Homes').length, color: 'slate' },
            ].map(d => (
              <div key={d.dept} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors">{d.dept}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-lg">{d.users} users</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}