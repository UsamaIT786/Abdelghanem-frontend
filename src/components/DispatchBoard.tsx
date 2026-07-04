import React, { useState, useEffect } from 'react';
import { TechnicianTask } from '../types';
import { Clock, Calendar, Phone, CheckCircle, Zap, ShieldAlert, ArrowRight, UserPlus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { fetchLiveTasks, createLiveTask, updateLiveTask, deleteLiveTask, getSavedTenant, initLiveWebSocket 
} from '../lib/api'; export default function DispatchBoard() { const [tasks, setTasks] = useState<TechnicianTask[]>([]); const [selectedTask, setSelectedTask] = useState<TechnicianTask | null>(null); const [activeUnit, setActiveUnit] = useState<'all' | 'heating' | 'screed' | 'electrical'>('all'); const [loading, setLoading] = useState(true);

  // Add Task Dispatch modal simulation values
  const [showDispatchForm, setShowDispatchForm] = useState(false); const [technician, setTechnician] = useState(''); const [client, setClient] = useState(''); const [phone, setPhone] = useState(''); const [type, setType] = useState<string>('Installation'); const [time, setTime] = useState('09:00 - 11:00'); const [taskTenant, setTaskTenant] = useState<'heating' | 'screed' | 'electrical'>('heating');

  // Edit task state
  const [editingTask, setEditingTask] = useState<TechnicianTask | null>(null); const [editTechnician, setEditTechnician] = useState(''); const [editClient, setEditClient] = useState(''); const [editPhone, setEditPhone] = useState(''); const [editType, setEditType] = useState(''); const [editTime, setEditTime] = useState(''); const [editStatus, setEditStatus] = useState(''); const [editTenant, setEditTenant] = useState<'heating' | 'screed' | 'electrical'>('heating');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null); const loadData = async () => { try { const activeTenant = getSavedTenant(); const loaded = await fetchLiveTasks(); setTasks(loaded); if (loaded.length > 0) { if (!selectedTask) { setSelectedTask(loaded[0]);
        } else { const freshSelected = loaded.find(t => t.id === selectedTask.id); if (freshSelected) { setSelectedTask(freshSelected);
          } else { setSelectedTask(loaded[0]);
          }
        }
      } else { setSelectedTask(null);
      }
    } catch (err) { console.error("Failed to load dispatch tasks:", err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadData(); const ws = initLiveWebSocket((message) => { if ( message.type === "TASK_CREATED" || message.type === "TASK_UPDATED" || message.type === "TASK_DELETED"
      ) { loadData();
      }
    }); return () => ws.close();
  }, []); const handleDispatchSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { const created = await createLiveTask({ technician: technician || 'Assigned Technician', client: client || 'Private Owner Address', phone: phone || '07700 900350', type: type as any, time, tenant: taskTenant
      }); await loadData(); setSelectedTask(created); setClient(''); setPhone(''); setShowDispatchForm(false); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Task for "${created.client}" dispatched successfully! ⚙️`, type: 'success' } 
      }));
    } catch (err) { alert("Failed to create dispatch task: " + err);
    }
  };
  const handleStartEditTask = (task: TechnicianTask) => { setEditingTask(task); setEditTechnician(task.technician); setEditClient(task.client); setEditPhone(task.phone); setEditType(task.type); setEditTime(task.time); setEditStatus(task.status); setEditTenant(task.tenant);
  };
  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    const targetId = editingTask.id;
    const updatedPayload = { technician: editTechnician, client: editClient, phone: editPhone, type: editType, time: editTime, status: editStatus, tenant: editTenant };
    
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === targetId ? { ...t, ...updatedPayload } : t));
    setEditingTask(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Task details updated for "${editClient}"! 🔧`, type: 'success' } }));
    
    try {
      await updateLiveTask(targetId, updatedPayload);
    } catch (err) {
      console.warn("Optimistic update network failure:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm.id;
    const deletedClient = deleteConfirm.clientName;
    
    // Optimistic UI Deletion
    setTasks(prev => prev.filter(t => t.id !== targetId));
    setDeleteConfirm(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Task for "${deletedClient || 'client'}" cancelled and removed! 🗑️`, type: 'warning' } }));
    
    try {
      await deleteLiveTask(targetId);
    } catch (err) {
      console.warn("Optimistic delete network failure:", err);
    }
  };

  const updateTaskStatus = async (id: string, nextStatus: TechnicianTask['status']) => {
    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status: nextStatus });
    }
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Task status updated to "${nextStatus}"! ✅`, type: 'success' } }));
    
    try {
      await updateLiveTask(id, { status: nextStatus });
    } catch (err) {
      console.error("Optimistic status update network failure:", err);
    }
  };
  const filteredTasks = tasks.filter(t => activeUnit === 'all' || t.tenant === activeUnit);

  // Collect unique technicians from tasks
  const uniqueTechnicians = Array.from(new Set(tasks.map(t => t.technician)));

  // Time Slot columns representation
  const timeHours = ['08:00', '10:00', '12:00', '14:00', '16:00']; return (
    <div className="space-y-6">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 "> Are you sure you want to delete the task for <strong className="text-slate-900 dark:text-white ">{deleteConfirm.name}</strong>? This action cannot be undone and will permanently remove this dispatch record.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition"
              > Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and top selection controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans" style={{ color: 'var(--text-primary)' }}>Technician Dispatch Control Board</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Real-time scheduling grid with interactive status dispatch capabilities.</p>
        </div>

        {/* Dispatch Filter Controls */}
        <div className="flex p-1 rounded-xl text-xs gap-1 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => setActiveUnit('all')} className={`px-3 py-1.5 rounded-lg font-semibold transition ${ activeUnit === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          > All Workforces
          </button>
          <button onClick={() => setActiveUnit('heating')} className={`px-3 py-1.5 rounded-lg font-semibold transition ${ activeUnit === 'heating' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          > Heating
          </button>
          <button onClick={() => setActiveUnit('screed')} className={`px-3 py-1.5 rounded-lg font-semibold transition ${ activeUnit === 'screed' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          > Screed
          </button>
          <button onClick={() => setActiveUnit('electrical')} className={`px-3 py-1.5 rounded-lg font-semibold transition ${ activeUnit === 'electrical' ? 'bg-yellow-500 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          > Electric
          </button>
        </div>
      </div>

      {/* DISPATCH MODULE POP-UP IF DOCK ACTIVE */}
      {showDispatchForm && (
        <form onSubmit={handleDispatchSubmit} className="bg-gradient-to-tr from-amber-50 to-orange-100/30 dark:from-amber-950/30 dark:to-orange-950/30 p-5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>Dispatch Workforce Operator Tool</span>
            </span>
            <button type="button" onClick={() => setShowDispatchForm(false)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold"
            > Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Select Active Specialist</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={technician} onChange={(e) => setTechnician(e.target.value)}
              >
                <option value="">Select technician...</option>
                {uniqueTechnicians.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value="New Technician">New Technician</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Workforce Tenant</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={taskTenant} onChange={(e) => setTaskTenant(e.target.value as any)}
              >
                <option value="heating">Heating Division</option>
                <option value="screed">Screed Foundations</option>
                <option value="electrical">Electrical Smart Control</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Scheduled Hours Slot</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={time} onChange={(e) => setTime(e.target.value)}
              >
                <option value="08:00 - 10:30">08:00 - 10:30</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="11:00 - 13:00">11:00 - 13:00</option>
                <option value="14:00 - 15:30">14:00 - 15:30</option>
                <option value="15:00 - 17:30">15:00 - 17:30</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Client Name / Location Address</label>
              <input type="text" required placeholder="e.g. 44 High St / Mr Vance" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={client} onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Telephone Connection</label>
              <input type="text" required placeholder="e.g. 07700 90001" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Task Subcategory Scope</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={type} onChange={(e) => setType(e.target.value)}
              >
                <option value="Installation">⚙️ Premium Installation</option>
                <option value="Maintenance">🔧 Recurrent Maintenance</option>
                <option value="Inspection">🔎 Regulatory Compliance Inspection</option>
                <option value="Repair">❌ Emergency Repair</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-indigo-700 transition shadow"
          > Confirm Dispatch and Update Schedule Grid
          </button>
        </form>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <form onSubmit={handleSaveEditTask} className="bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Pencil className="w-3.5 h-3.5 text-blue-500" /> Edit Task: {editingTask.client}
            </span>
            <button type="button" onClick={() => setEditingTask(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Technician</label>
              <input type="text" required className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editTechnician} onChange={(e) => setEditTechnician(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Client</label>
              <input type="text" required className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editClient} onChange={(e) => setEditClient(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone</label>
              <input type="text" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Type</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editType} onChange={(e) => setEditType(e.target.value)}
              >
                <option value="Installation">Installation</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inspection">Inspection</option>
                <option value="Repair">Repair</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Status</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Time Slot</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editTime} onChange={(e) => setEditTime(e.target.value)}
              >
                <option value="08:00 - 10:30">08:00 - 10:30</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="11:00 - 13:00">11:00 - 13:00</option>
                <option value="14:00 - 15:30">14:00 - 15:30</option>
                <option value="15:00 - 17:30">15:00 - 17:30</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Tenant</label>
              <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editTenant} onChange={(e) => setEditTenant(e.target.value as any)}
              >
                <option value="heating">Heating</option>
                <option value="screed">Screed</option>
                <option value="electrical">Electrical</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-lg shadow transition"
            >
              <Pencil className="w-3.5 h-3.5 inline mr-1" /> Save Task Changes
            </button>
            <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition"
            > Discard
            </button>
          </div>
        </form>
      )}

      {/* Main Grid & active selection sidebar block */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Scheduling Matrix Grid (3/4 width) */}
        <div className="border rounded-xl p-5 shadow-sm lg:col-span-3 space-y-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: 'var(--text-primary)' }}>Active Operations Dispatch Board</span>
            <button onClick={() => setShowDispatchForm(true)} className="px-3 py-1.5 rounded-lg bg-indigo-600 font-bold hover:bg-indigo-700 text-white text-[11px] flex items-center gap-1 transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Dispatch Callout</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>Loading dispatch data...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[650px] divide-y" style={{ borderColor: 'var(--border-color)' }}>
                
                {/* Grid Header hour blocks */}
                <div className="grid grid-cols-6 py-2.5 text-center text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase rounded-t-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="col-span-1 text-left pl-3 text-slate-600 dark:text-slate-300">Technician</div>
                  {timeHours.map(hour => (
                    <div key={hour} className="border-l" style={{ borderColor: 'var(--border-color)' }}>{hour}</div>
                  ))}
                </div>

                {/* Rows matching each staff worker */}
                {uniqueTechnicians.map(tech => { const techTasks = filteredTasks.filter(t => t.technician === tech); return (
                    <div key={tech} className="grid grid-cols-6 items-center py-4 text-center text-xs">
                      <div className="col-span-1 text-left pl-3 font-semibold text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        {tech}
                      </div>

                      <div className="col-span-5 grid grid-cols-5 h-16 relative">
                        {techTasks.map(task => { let gridColStart = 'col-start-1'; let gridColSpan = 'col-span-2'; if (task.time.includes('10:0')) gridColStart = 'col-start-2'; else if (task.time.includes('11:0')) gridColStart = 'col-start-3'; else if (task.time.includes('14:0')) { gridColStart = 'col-start-4'; gridColSpan = 'col-span-1'; } else if (task.time.includes('15:0')) { gridColStart = 'col-start-4 col-span-2'; gridColSpan = 'col-span-2'; }
  let activeStyles = 'border-rose-200 bg-rose-50/90 text-rose-950 font-medium'; if (task.tenant === 'screed') activeStyles = 'border-teal-200 bg-teal-50/90 text-teal-950 font-medium'; if (task.tenant === 'electrical') activeStyles = 'border-yellow-200 bg-amber-50/90 text-amber-950 font-medium'; return (
                            <div key={task.id} onClick={() => setSelectedTask(task)} className={`absolute inset-y-1 mx-1.5 p-2 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition shadow-xs z-10 select-none ${gridColStart} ${gridColSpan} ${ selectedTask?.id === task.id ? 'ring-2 ring-indigo-600 scale-102 font-bold shadow-md' : 'hover:scale-101'
                              }`}
                            >
                              <span className="text-[10px] block truncate font-bold">{task.client}</span>
                              <div className="flex items-center justify-between mt-1 text-[9px] text-slate-600 dark:text-slate-300 font-mono">
                                <span>{task.time}</span>
                                <span className={`px-1 rounded-sm text-[8px] font-bold tracking-wider ${ task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                                }`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {uniqueTechnicians.length === 0 && (
                  <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No technicians loaded</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Task details Drawer/Sidebar (1/4 width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-sm dark:backdrop-blur-md rounded-xl p-5 text-slate-900 dark:text-white dark:text-slate-50 flex flex-col justify-between min-h-[400px]">
          {selectedTask ? (
            <div className="space-y-5">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-300 block">Dispatch ID</span>
                  <span className="text-xs font-mono font-bold text-amber-500">{selectedTask.id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${ selectedTask.tenant === 'heating' ? 'bg-rose-950 text-rose-300' : selectedTask.tenant === 'screed' ? 'bg-teal-950 text-teal-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {selectedTask.tenant} Division
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Lead Dispatcher Assigned:</span>
                  <div className="text-slate-900 dark:text-white font-medium">{selectedTask.technician}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Target Site Client Location:</span>
                  <div className="text-slate-900 dark:text-white font-medium">{selectedTask.client}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Telephone Integration:</span>
                  <div className="text-slate-900 dark:text-white font-serif flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 " />
                    <span>{selectedTask.phone}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Dispatch Scope Parameter:</span>
                  <div className="text-slate-900 dark:text-white font-bold">{selectedTask.type}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Allocated Hours Slot:</span>
                  <div className="text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 " />
                    <span>{selectedTask.time}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Operational State:</span>
                  <div className={`mt-1 inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${ selectedTask.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {selectedTask.status}
                  </div>
                </div>
              </div>

              {/* Status Update Quick Triggers + Edit/Delete */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-300 block">Override Operational State:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button onClick={() => updateTaskStatus(selectedTask.id, 'In Progress')} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded"
                  > In Progress
                  </button>
                  <button onClick={() => updateTaskStatus(selectedTask.id, 'Completed')} className="py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold rounded"
                  >
                    ✔️ Complete
                  </button>
                </div>

                {/* Edit & Delete buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => handleStartEditTask(selectedTask)} className="py-1.5 px-2 bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-400 font-bold rounded text-[10px] flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm({ id: selectedTask.id, name: selectedTask.client })} className="py-1.5 px-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-400 font-bold rounded text-[10px] flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-600 dark:text-slate-300 ">
              <Calendar className="w-8 h-8 opacity-40 mb-3" />
              <span>Select an active schedule card box to override details</span>
            </div>
          )}

          <div className="text-[9px] text-center text-slate-600 dark:text-slate-300 pt-4 border-t border-slate-200 dark:border-slate-700 /60 font-mono"> Abdelghanem Dispatch v4.12 • GPS Active
          </div>
        </div>
      </div>
    </div>
  );
}