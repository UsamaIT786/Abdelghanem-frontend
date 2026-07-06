import React, { useState, useEffect } from 'react';
import { Contact, Deal, TenantType } from '../types';
import { Building, Mail, Phone, Plus, Search, Tag, Briefcase, Check, Layers, FileText, TrendingUp, UserPlus, FileDown, Users, Pencil, Trash2, X, AlertTriangle
} from 'lucide-react';
import { fetchLiveContacts, fetchLiveDeals, createLiveContact, createLiveDeal, updateLiveContact, updateLiveDeal, deleteLiveContact, deleteLiveDeal, getSavedTenant, initLiveWebSocket 
} from '../lib/api'; export default function ContactsView() { const [activeSubTab, setActiveSubTab] = useState<'contacts' | 'pipeline' | 'proposals'>('contacts'); const [contacts, setContacts] = useState<Contact[]>([]); const [deals, setDeals] = useState<Deal[]>([]); const [loading, setLoading] = useState(true);
  
  // Search and selector filters
  const [searchTerm, setSearchTerm] = useState(''); const [tenantFilter, setTenantFilter] = useState<'all' | 'full_home_renovation' | 'kitchen_renovation' | 'bathroom_renovation' | 'granny_flat' | 'extension' | 'multi_unit' | 'new_luxe_homes'>('all');
  
  // Create Contact modal simulation state
  const [showAddContact, setShowAddContact] = useState(false); const [newContactName, setNewContactName] = useState(''); const [newContactCompany, setNewContactCompany] = useState(''); const [newContactEmail, setNewContactEmail] = useState(''); const [newContactPhone, setNewContactPhone] = useState(''); const [newContactTenant, setNewContactTenant] = useState<TenantType>('full_home_renovation'); const [newContactStatus, setNewContactStatus] = useState<Contact['status']>('Lead'); const [newContactRevenue, setNewContactRevenue] = useState('2500');

  // Edit Contact state
  const [editingContact, setEditingContact] = useState<Contact | null>(null); const [editContactName, setEditContactName] = useState(''); const [editContactCompany, setEditContactCompany] = useState(''); const [editContactEmail, setEditContactEmail] = useState(''); const [editContactPhone, setEditContactPhone] = useState(''); const [editContactTenant, setEditContactTenant] = useState<TenantType>('full_home_renovation'); const [editContactStatus, setEditContactStatus] = useState<Contact['status']>('Lead'); const [editContactRevenue, setEditContactRevenue] = useState('');

  // Edit Deal state
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null); const [editDealTitle, setEditDealTitle] = useState(''); const [editDealCompany, setEditDealCompany] = useState(''); const [editDealValue, setEditDealValue] = useState(''); const [editDealStage, setEditDealStage] = useState<Deal['stage']>('Leads');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'contact' | 'deal'; id: string; name: string } | null>(null);

  // Proposal creator states
  const [selectedPropContact, setSelectedPropContact] = useState<Contact | null>(null); const [proposalNotes, setProposalNotes] = useState('Pricing quoted with high efficiency Eco Combi specifications.'); const [proposalDiscount, setProposalDiscount] = useState('5'); const [propCreated, setPropCreated] = useState(false); const loadData = async () => { try { 
      const cachedContacts = localStorage.getItem('crm_leads');
      const cachedDeals = localStorage.getItem('crm_deals');
      if (cachedContacts && !contacts.length) setContacts(JSON.parse(cachedContacts));
      if (cachedDeals && !deals.length) setDeals(JSON.parse(cachedDeals));
      const [loadedContacts, loadedDeals] = await Promise.all([ fetchLiveContacts(), fetchLiveDeals()
      ]); setContacts(loadedContacts); setDeals(loadedDeals); 
      localStorage.setItem('crm_leads', JSON.stringify(loadedContacts));
      localStorage.setItem('crm_deals', JSON.stringify(loadedDeals));
      if (loadedContacts.length > 0 && !selectedPropContact) { setSelectedPropContact(loadedContacts[0]);
      }
    } catch (err) { console.error("Contacts CRM failed to load live database elements:", err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadData();

    // Setup live subscription gateway sync
  const ws = initLiveWebSocket((message) => { if ( message.type === "CONTACT_CREATED" || message.type === "CONTACT_UPDATED" || message.type === "CONTACT_DELETED" || message.type === "DEAL_CREATED" || message.type === "DEAL_UPDATED" || message.type === "DEAL_DELETED"
      ) { loadData();
      }
    });
    
    // Listen for automated background polling
    const handleHydration = () => loadData();
    window.addEventListener('crm_global_hydration_tick', handleHydration);
    
    return () => {
      ws.close();
      window.removeEventListener('crm_global_hydration_tick', handleHydration);
    };
  }, []);

  // Handlers
  const handleAddContactSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { const createdCorp = newContactCompany || 'Independent Contractor'; const createdValue = parseFloat(newContactRevenue) || 1200;      const createdContact = await createLiveContact({ name: newContactName || 'Generic Client', company: createdCorp, email: newContactEmail || 'info@domain.com', phone: newContactPhone || '07700 900550', status: newContactStatus, tenant: newContactTenant, revenue: createdValue
      });
      
      // Also add an associated deal automatically 
      const createdDeal = await createLiveDeal({ title: `${newContactTenant.toUpperCase()} Work Bundle - ${createdCorp}`, company: createdCorp, value: createdValue, stage: newContactStatus as Deal['stage'], tenant: newContactTenant
      });

      // Optimistically update the UI to prevent flickering
      setContacts(prev => [createdContact, ...prev]);
      setDeals(prev => [createdDeal, ...prev]);

      // reset Form 
      setNewContactName(''); setNewContactCompany(''); setNewContactEmail(''); setNewContactPhone(''); setShowAddContact(false);
  window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Contact "${newContactName}" created successfully! 👤`, type: 'success' } 
      }));

      // Immediate state hydration callback
      loadData();
    } catch (err) { alert("Failed to insert CRM records: " + err);
    }
  };
  const handleStartEditContact = (contact: Contact) => { setEditingContact(contact); setEditContactName(contact.name); setEditContactCompany(contact.company); setEditContactEmail(contact.email); setEditContactPhone(contact.phone); setEditContactTenant(contact.tenant as TenantType); setEditContactStatus(contact.status); setEditContactRevenue(String(contact.revenue));
  };
  const handleSaveEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    const targetId = editingContact.id;
    const payload = { name: editContactName, company: editContactCompany, email: editContactEmail, phone: editContactPhone, tenant: editContactTenant, status: editContactStatus, revenue: parseFloat(editContactRevenue) || 0 };
    
    setContacts(prev => prev.map(c => c.id === targetId ? { ...c, ...payload } : c));
    setEditingContact(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Contact "${editContactName}" updated successfully! ✏️`, type: 'success' } }));
    
    try {
      await updateLiveContact(targetId, payload);
    } catch (err) {
      console.warn("Optimistic network failure:", err);
    }
  };

  const handleStartEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDealTitle(deal.title);
    setEditDealCompany(deal.company);
    setEditDealValue(String(deal.value || ''));
    setEditDealStage(deal.stage);
  };

  const handleSaveEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    const targetId = editingDeal.id;
    const payload = { title: editDealTitle, company: editDealCompany, value: parseFloat(editDealValue) || 0, stage: editDealStage };
    
    setDeals(prev => prev.map(d => d.id === targetId ? { ...d, ...payload } : d));
    setEditingDeal(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Deal "${editDealTitle}" details updated! 💼`, type: 'success' } }));
    
    try {
      await updateLiveDeal(targetId, payload);
    } catch (err) {
      console.warn("Optimistic network failure:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm.id;
    const deletedName = deleteConfirm.name;
    const isContact = deleteConfirm.type === 'contact';
    
    if (isContact) {
      setContacts(prev => prev.filter(c => c.id !== targetId));
    } else {
      setDeals(prev => prev.filter(d => d.id !== targetId));
    }
    setDeleteConfirm(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `"${deletedName}" removed from CRM! 🗑️`, type: 'warning' } }));
    
    try {
      if (isContact) {
        await deleteLiveContact(targetId);
      } else {
        await deleteLiveDeal(targetId);
      }
    } catch (err) {
      console.warn("Optimistic delete network failure:", err);
    }
  };

  const promoteDeal = async (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    if (!targetDeal) return;
    const stages: Deal['stage'][] = ['Leads', 'Contacted', 'Proposal', 'Contract', 'Won'];
    const currIdx = stages.indexOf(targetDeal.stage);
    if (currIdx < stages.length - 1) {
      const nextStage = stages[currIdx + 1];
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: nextStage } : d));
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Deal promoted to "${nextStage}"! 🚀`, type: 'success' } }));
      try {
        await updateLiveDeal(dealId, { stage: nextStage });
      } catch (err) {
        console.warn("Optimistic network failure:", err);
      }
    }
  };

  const demoteDeal = async (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    if (!targetDeal) return;
    const stages: Deal['stage'][] = ['Leads', 'Contacted', 'Proposal', 'Contract', 'Won'];
    const currIdx = stages.indexOf(targetDeal.stage);
    if (currIdx > 0) {
      const prevStage = stages[currIdx - 1];
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: prevStage } : d));
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Deal demoted back to "${prevStage}"! ↩️`, type: 'info' } }));
      try {
        await updateLiveDeal(dealId, { stage: prevStage });
      } catch (err) {
        console.warn("Optimistic network failure:", err);
      }
    }
  };

  // Filter lists
  const filteredContacts = contacts.filter(c => { const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.company.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()); const matchesTenant = tenantFilter === 'all' || c.tenant === tenantFilter; return matchesSearch && matchesTenant;
  }); return (
    <div className="space-y-6">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900 backdrop-blur-md animate-scale-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 animate-scale-in shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4 shadow-2xl border space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 "> Are you sure you want to delete <strong className="text-slate-900 dark:text-white ">{deleteConfirm.name}</strong>? This action cannot be undone and will permanently remove this record from the database.
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

      {/* Top Header & secondary menu controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans" style={{ color: 'var(--text-primary)' }}>CRM Hub Operations</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Manage single-ledger pipelines, clients database, and digital proposals.</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex p-1 rounded-xl border text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => setActiveSubTab('contacts')} className={`px-4 py-2 rounded-lg font-semibold transition ${ activeSubTab === 'contacts' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            <span>Contacts & Leads</span>
          </button>
          
          <button onClick={() => setActiveSubTab('pipeline')} className={`px-4 py-2 rounded-lg font-semibold transition ${ activeSubTab === 'pipeline' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            <span>Deals Pipeline Board</span>
          </button>

          <button onClick={() => setActiveSubTab('proposals')} className={`px-4 py-2 rounded-lg font-semibold transition ${ activeSubTab === 'proposals' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white '
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            <span>Proposals Builder</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <input type="text" className="w-full pl-9 pr-4 py-2 rounded-lg text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-slate-900" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} placeholder="Search details by client name, email, or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <select className="border px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-secondary)' }} value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value as any)}
          >
            <option value="all">🏢 All Business Units</option>
            <option value="full_home_renovation">Full Home Renovation</option>
            <option value="kitchen_renovation">Kitchen Renovation</option>
            <option value="bathroom_renovation">Bathroom Renovation</option>
            <option value="granny_flat">Granny Flat</option>
            <option value="extension">Extension</option>
            <option value="multi_unit">Multi Unit</option>
            <option value="new_luxe_homes">New Luxe Homes</option>
          </select>

          {activeSubTab === 'contacts' && (
            <button onClick={() => setShowAddContact(true)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1 hover:bg-indigo-700 transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEW CONTENTS */}
      
      {/* 1. CONTACTS GRID AND ADD MODAL */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-6">
          {showAddContact && (
            <form onSubmit={handleAddContactSubmit} className="bg-gradient-to-tr from-[#4F46E5]/5 to-[#06B6D4]/5 p-5 rounded-xl border border-[#4F46E5]/20 space-y-4 animate-scale-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                  ✏️ Create New Associated Business Client Card
                </span>
                <button type="button" onClick={() => setShowAddContact(false)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold"
                > Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Client Full Name</label>
                  <input type="text" required placeholder="e.g. Marcus Aurelius" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactName} onChange={(e) => setNewContactName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Company / Developer Name</label>
                  <input type="text" placeholder="e.g. Rome Housing Corp" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactCompany} onChange={(e) => setNewContactCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Email Connection Address</label>
                  <input type="email" required placeholder="email@example.com" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input type="text" placeholder="e.g. +44 7911..." className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Business Tenant</label>
                  <select className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactTenant} onChange={(e) => setNewContactTenant(e.target.value as TenantType)}
                  >
                    <option value="full_home_renovation">Full Home Renovation</option>
                    <option value="kitchen_renovation">Kitchen Renovation</option>
                    <option value="bathroom_renovation">Bathroom Renovation</option>
                    <option value="granny_flat">Granny Flat</option>
                    <option value="extension">Extension</option>
                    <option value="multi_unit">Multi Unit</option>
                    <option value="new_luxe_homes">New Luxe Homes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Current Status</label>
                  <select className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactStatus} onChange={(e) => setNewContactStatus(e.target.value as any)}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Contract">Contract</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Estimated Contract Value (£)</label>
                  <input type="number" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={newContactRevenue} onChange={(e) => setNewContactRevenue(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] hover:opacity-95 text-slate-900 dark:text-white font-bold text-xs py-2.5 rounded-lg shadow transition"
              > Confirm and Push to Master Database
              </button>
            </form>
          )}

          {/* Edit Contact Modal */}
          {editingContact && (
            <form onSubmit={handleSaveEditContact} className="bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-xl border border-blue-200 dark:border-blue-800 space-y-4 animate-scale-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Pencil className="w-3.5 h-3.5 text-blue-500" /> Edit Contact: {editingContact.name}
                </span>
                <button type="button" onClick={() => setEditingContact(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Client Full Name</label>
                  <input type="text" required className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactName} onChange={(e) => setEditContactName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Company</label>
                  <input type="text" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactCompany} onChange={(e) => setEditContactCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Email</label>
                  <input type="email" required className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Phone</label>
                  <input type="text" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Tenant</label>
                  <select className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactTenant} onChange={(e) => setEditContactTenant(e.target.value as TenantType)}
                  >
                    <option value="full_home_renovation">Full Home Renovation</option>
                    <option value="kitchen_renovation">Kitchen Renovation</option>
                    <option value="bathroom_renovation">Bathroom Renovation</option>
                    <option value="granny_flat">Granny Flat</option>
                    <option value="extension">Extension</option>
                    <option value="multi_unit">Multi Unit</option>
                    <option value="new_luxe_homes">New Luxe Homes</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Status</label>
                  <select className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactStatus} onChange={(e) => setEditContactStatus(e.target.value as any)}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Contract">Contract</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Revenue (£)</label>
                  <input type="number" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editContactRevenue} onChange={(e) => setEditContactRevenue(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-lg shadow transition"
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" /> Save Changes
                </button>
                <button type="button" onClick={() => setEditingContact(null)} className="px-4 py-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                > Discard
                </button>
              </div>
            </form>
          )}

          {/* Active Contacts Grid columns */}
          {loading ? (
            <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /> Loading contacts...
            </div>
          ) : (
            <div className="responsive-grid">
              {filteredContacts.length > 0 ? ( filteredContacts.map(c => (
                  <div key={c.id} className="premium-card premium-card-accent p-5 relative group">
                    {/* Tenant badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`premium-badge-tenant premium-badge-${c.tenant}`}>
                        {c.tenant.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Edit/Delete action buttons */}
                    <div className="btn-icon-group absolute top-4 right-4 z-10">
                      <button onClick={() => handleStartEditContact(c)} className="btn-ghost" title="Edit Contact"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm({ type: 'contact', id: c.id, name: c.name })} className="btn-ghost hover:text-red-500" title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Contact header */}
                    <div className="flex items-center gap-3.5 mt-8 mb-4">
                      <div className="avatar-initials">
                        {c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</h4>
                        <p className="text-xs font-medium flex items-center gap-1 mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                          <Building className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.company}</span>
                        </p>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2.5 text-xs border-t pt-3.5" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.phone}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>£{c.revenue?.toLocaleString()}</span>
                      </div>
                      <span className={`status-chip ${ c.status === 'Won' ? 'status-chip-won' : c.status === 'Contract' ? 'status-chip-contract' : c.status === 'Proposal' ? 'status-chip-proposal' : c.status === 'Contacted' ? 'status-chip-contacted' : 'status-chip-leads'
                      }`}>
                        <span className={`status-dot ${ c.status === 'Won' ? 'bg-emerald-500' : c.status === 'Contract' ? 'bg-indigo-500' : c.status === 'Proposal' ? 'bg-amber-500' : c.status === 'Contacted' ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center border border-dashed rounded-2xl" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}
                >
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No contacts match your filters</p>
                  <p className="text-xs mt-1">Try adjusting search or add a new client record</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. PIPELINE DEALS BOARD */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Edit Deal Modal */}
          {editingDeal && (
            <form onSubmit={handleSaveEditDeal} className="bg-gradient-to-tr from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-4 animate-scale-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Pencil className="w-3.5 h-3.5 text-purple-500" /> Edit Deal: {editingDeal.title}
                </span>
                <button type="button" onClick={() => setEditingDeal(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Deal Title</label>
                  <input type="text" required className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editDealTitle} onChange={(e) => setEditDealTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Company</label>
                  <input type="text" required className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editDealCompany} onChange={(e) => setEditDealCompany(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Value (£)</label>
                  <input type="number" className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editDealValue} onChange={(e) => setEditDealValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 block mb-1">Stage</label>
                  <select className="saas-input" style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={editDealStage} onChange={(e) => setEditDealStage(e.target.value as Deal['stage'])}
                  >
                    <option value="Leads">Leads</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Contract">Contract</option>
                    <option value="Won">Won</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs py-2.5 rounded-lg shadow transition"
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" /> Save Deal Changes
                </button>
                <button type="button" onClick={() => setEditingDeal(null)} className="px-4 py-2.5 border rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 transition"
                > Discard
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(['Leads', 'Contacted', 'Proposal', 'Contract', 'Won'] as Deal['stage'][]).map(stage => { const stageDeals = deals.filter(d => d.stage === stage && (tenantFilter === 'all' || d.tenant === tenantFilter)); return (
                <div key={stage} className="p-3 rounded-xl border flex flex-col min-h-[500px]" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>{stage}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Deals cards inside columns */}
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {stageDeals.map(deal => (
                      <div key={deal.id} className="border p-3.5 rounded-lg shadow-sm hover:shadow-md transition space-y-2 relative group" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                      >
                        {/* Edit/Delete buttons */}
                        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStartEditDeal(deal)} className="p-1 bg-white dark:bg-slate-900 border rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition shadow-sm" title="Edit Deal"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteConfirm({ type: 'deal', id: deal.id, name: deal.title })} className="p-1 bg-white dark:bg-slate-900 border rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-600 transition shadow-sm" title="Delete Deal"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex justify-between items-start">
                          <span className={`w-2 h-2 rounded-full ${ deal.tenant === 'full_home_renovation' ? 'bg-indigo-500' : deal.tenant === 'kitchen_renovation' ? 'bg-amber-500' : deal.tenant === 'bathroom_renovation' ? 'bg-cyan-500' : deal.tenant === 'granny_flat' ? 'bg-violet-500' : deal.tenant === 'extension' ? 'bg-emerald-500' : deal.tenant === 'multi_unit' ? 'bg-blue-500' : 'bg-slate-500'
                          }`} />
                          <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>£{deal.value?.toLocaleString()}</span>
                        </div>

                        <h4 className="text-xs font-bold line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{deal.title}</h4>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{deal.company}</p>

                        <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">{deal.date}</span>
                          <div className="flex gap-1">
                            <button onClick={() => demoteDeal(deal.id)} title="Demote" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded p-1 text-[8px] font-bold"
                            >
                              ◀
                            </button>
                            <button onClick={() => promoteDeal(deal.id)} title="Promote" className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 rounded p-1 text-[8px] font-bold"
                            >
                              ▶
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="h-full border border-dashed rounded-lg flex items-center justify-center p-4 text-center" style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>No associated deals here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PROPOSALS BUILDER */}
      {activeSubTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form generator */}
          <div className="p-6 border rounded-xl shadow-sm space-y-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>Smart Document Instantiation</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Select Client Target</label>
              <select className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} value={selectedPropContact?.id || ""} onChange={(e) => { const matched = contacts.find(c => c.id === e.target.value); if (matched) setSelectedPropContact(matched);
                }}
              >
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.company} ({c.tenant.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Spec Proposal Scope Notes</label>
              <textarea className="w-full border rounded-lg p-2.5 text-xs h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} value={proposalNotes} onChange={(e) => setProposalNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Contract Discount (%)</label>
              <input type="number" className="w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }} value={proposalDiscount} onChange={(e) => setProposalDiscount(e.target.value)} min="0" max="100"
              />
            </div>

            <button onClick={() => { setPropCreated(true); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: "Digital quote generated and synced to sheet! 📜", type: 'success' } 
                })); setTimeout(() => setPropCreated(false), 3000);
              }} className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-lg hover:from-teal-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Generate Digital Quotation</span>
            </button>

            {propCreated && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs font-semibold rounded-lg text-center animate-bounce">
                ✔️ Document verified and logged into n8n PDF synchronizer sheet!
              </div>
            )}
          </div>

          {/* Dynamic Render Sandbox Panel */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-200 dark:border-slate-700 font-mono shadow-2xl relative">
            <div className="absolute top-4 right-4 bg-emerald-950 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Quote Sheet Preview</span>
            </div>

            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-4 text-center">
                <div className="text-amber-400 text-sm font-bold">📜 CRM MASTER CONTRACT INVOICE</div>
                <div className="text-[9px] text-slate-600 dark:text-slate-300 mt-1">UUID: PROP-2026-OX948B</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] border-b border-slate-200 dark:border-slate-700 pb-4 text-slate-600 dark:text-slate-300 ">
                <div>
                  <div className="text-slate-600 dark:text-slate-300 uppercase tracking-widest font-bold font-sans">ISSUED BY:</div>
                  <div className="text-slate-900 dark:text-white mt-1">Abdelghanem Enterprise Automation Ltd</div>
                  <div>Tenant Division: {selectedPropContact?.tenant?.toUpperCase() || "N/A"}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-300 uppercase tracking-widest font-bold font-sans">PROPOSAL TO CLIENT:</div>
                  <div className="text-slate-900 dark:text-white mt-1">{selectedPropContact?.name || "Client Name"}</div>
                  <div>{selectedPropContact?.company || "Company"}</div>
                  <div>{selectedPropContact?.email || "Email"}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-widest font-bold mb-2 font-sans">ESTIMATED SCOPE OF WORK:</div>
                <div className="text-[11px] text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                  {proposalNotes}
                </div>
              </div>

              <div className="text-[11px] space-y-2">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                  <span>Gross Job Estimate:</span>
                  <span className="text-slate-900 dark:text-white ">£{(selectedPropContact?.revenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1 text-teal-400">
                  <span>Contract Discount Rate:</span>
                  <span>-{proposalDiscount}%</span>
                </div>
                <div className="flex justify-between text-lg font-black text-amber-400 pt-2 font-sans">
                  <span>NET TOTAL ESTIMATE:</span>
                  <span>
                    £{((selectedPropContact?.revenue || 0) * (1 - (parseFloat(proposalDiscount) || 0) / 100)).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-[9px] text-center text-slate-600 dark:text-slate-300 "> System generated quote. To deliver to client, trigger PDF download link:
                <button onClick={() => { const gross = selectedPropContact?.revenue || 0; const disc = parseFloat(proposalDiscount) || 0; const net = gross * (1 - disc / 100); const content = `
                      <html><head><meta charset="utf-8"><title>Proposal</title>
                      <style> body { font-family: Arial, sans-serif; padding: 40px; color: #333; } h1 { text-align: center; color: #1e293b; font-size: 22px; }
                        .uuid { text-align: center; color: #888; font-size: 11px; margin-bottom: 30px; }
                        .section { border-top: 1px solid #ddd; padding: 15px 0; }
                        .grid { display: flex; justify-content: space-between; }
                        .col { width: 48%; }
                        .label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
                        .value { font-size: 14px; margin: 5px 0 15px; }
                        .total { font-size: 20px; font-weight: bold; color: #f59e0b; }
                      </style></head><body>
                      <h1>📜 CRM MASTER CONTRACT INVOICE</h1>
                      <div class="uuid">UUID: PROP-2026-${Date.now().toString(36).toUpperCase()}</div>
                      <div class="section grid">
                        <div class="col">
                          <div class="label">ISSUED BY:</div>
                          <div class="value">Abdelghanem Enterprise Automation Ltd</div>
                          <div class="value" style="font-size:11px;color:#64748b">Tenant Division: ${(selectedPropContact?.tenant || 'N/A').toUpperCase()}</div>
                        </div>
                        <div class="col">
                          <div class="label">PROPOSAL TO CLIENT:</div>
                          <div class="value">${selectedPropContact?.name || 'Client Name'}</div>
                          <div class="value">${selectedPropContact?.company || ''}</div>
                          <div class="value">${selectedPropContact?.email || ''}</div>
                        </div>
                      </div>
                      <div class="section">
                        <div class="label">ESTIMATED SCOPE OF WORK:</div>
                        <div class="value">${proposalNotes}</div>
                      </div>
                      <div class="section">
                        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee">
                          <span>Gross Job Estimate:</span><span>£${gross.toLocaleString()}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;color:#0d9488">
                          <span>Contract Discount Rate:</span><span>-${disc}%</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:20px;font-weight:bold;color:#f59e0b">
                          <span>NET TOTAL ESTIMATE:</span><span>£${net.toFixed(0)}</span>
                        </div>
                      </div>
                      <div style="text-align:center;color:#aaa;font-size:10px;margin-top:30px"> System generated quote. Valid for 30 days from issue date.<br> Abdelghanem Enterprise Automation - Premium CRM Suite
                      </div>
                    </body></html>`; const blob = new Blob([content], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Proposal-${selectedPropContact?.name || 'client'}-${Date.now()}.html`; a.click(); URL.revokeObjectURL(url);
                  }} className="mt-2.5 mx-auto bg-white dark:bg-slate-900/10 hover:bg-white/15 px-3 py-1.5 rounded text-slate-900 dark:text-white flex items-center gap-1 text-[10px] font-sans font-bold transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Signed PDF Copy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}