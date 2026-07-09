import React, { useState, useEffect } from 'react';
import { AdCampaign } from '../types';
import { Sparkles, Trash2, ShieldCheck, Globe, AlertTriangle, Pencil, X, Rocket, Loader2, Check, Search, FileText, Tag, DollarSign, ChevronRight, Send, Zap, Activity, Image as ImageIcon, Instagram, LayoutTemplate, Upload
} from 'lucide-react';
import { fetchLiveCampaigns, generateLiveCampaign, updateLiveCampaign, approveLiveCampaign, deleteLiveCampaign, initLiveWebSocket, analyzeImageTags
} from '../lib/api'; type ScenarioId = 'A' | 'BC';

// Facebook icon (not in lucide, so inline SVG)
const FacebookIcon = () => (
  <svg className="w-4 h-4 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
); const SCENARIO_MAP = { A: { id: 'A' as ScenarioId, label: 'Meta Social Post', sub: 'Facebook + Instagram simultaneously', bgClass: 'bg-indigo-600 dark:bg-indigo-500 text-white ', badgeBg: 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white', borderActive: 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900', n8nTarget: 'meta_social', platform: 'Meta', description: 'Creates a post on BOTH Facebook and Instagram at the same time. AI writes a dual-platform caption with media image and destination link.', placeholder: 'Promote 10-year boiler warranties and 0% interest finance for new boiler installs. Drive inquiries for heating works.',
  }, BC: { id: 'BC' as ScenarioId, label: 'Scenario B+C: Full Funnel', sub: 'DataForSEO + WordPress + Google Ads', bgClass: 'bg-gradient-to-r from-violet-600 to-rose-600', badgeBg: 'bg-indigo-100 text-indigo-700', borderActive: 'border-indigo-500 bg-indigo-50', n8nTarget: 'seo_google_ads_wordpress', platform: 'seo_google_ads_wordpress', description: 'Unified full funnel strategy handling SEO landing pages and Google Ads together.', placeholder: 'Create a full funnel campaign for Sydney home renovations...',
  }
} as const; const TENANTS = [
  { value: 'full_home_renovation', label: 'Full Home Renovation' },
  { value: 'kitchen_renovation', label: 'Kitchen Renovation' },
  { value: 'bathroom_renovation', label: 'Bathroom Renovation' },
  { value: 'granny_flat', label: 'Granny Flat' },
  { value: 'extension', label: 'Extension' },
  { value: 'multi_unit', label: 'Multi Unit' },
  { value: 'new_luxe_homes', label: 'New Luxe Homes' },
] as const; function StatusBadge({ status }: { status: string }) { const cfg: Record<string, string> = { Live: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400', Approved: 'bg-teal-100 text-teal-700',
    'Pending Approval': 'bg-amber-100 text-amber-700', Draft: 'bg-slate-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 transition-colors ', Published: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-extrabold ${cfg[status] || 'bg-slate-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 transition-colors'}`}>
      {status === 'Live' ? '● Live' : status}
    </span>
  );
}
  function ScenarioPill({ platform }: { platform: string }) { if (platform === 'Meta' || platform === 'Facebook' || platform === 'Instagram') return <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white px-1.5 py-0.5 rounded font-bold uppercase">A · Meta</span>; if (platform === 'seo_google_ads_wordpress' || platform === 'Scenario B+C') return <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">BC · Full Funnel</span>; return <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 transition-colors px-1.5 py-0.5 rounded font-bold uppercase">{platform}</span>;
}
  function PayloadPreview({ campaign }: { campaign: AdCampaign }) { 
    const [payloadMode, setPayloadMode] = useState<'final' | 'ui'>('final');
    const isMeta = campaign.platform === 'Meta' || campaign.platform === 'Facebook' || campaign.platform === 'Instagram'; 
    const isFullFunnel = campaign.platform === 'seo_google_ads_wordpress' || campaign.platform === 'Scenario B+C'; 
    let payload: any = {};
    let uiPayload: any = {};

    if (isMeta) { 
      const finalMessage = campaign.generatedCopy || '';
      
      payload = { 
        campaign_id: campaign.id, 
        workspace_id: 'work_luxe_01', 
        platform_target: 'meta_social', 
        campaign_name: campaign.title, 
        content: { 
          message: finalMessage, 
          media_url: campaign.mediaUrl || "", 
          link: campaign.destinationLink || 'https://luxehr.com.au'
        }
      };
      uiPayload = {
        message: finalMessage,
        media_url: campaign.mediaUrl || "",
        link: campaign.destinationLink || 'https://luxehr.com.au'
      };
    } else if (isFullFunnel) { 
      let h = campaign.title || ''; 
      if (h.length > 30) h = h.substring(0, 27) + '...'; 
      let d = campaign.generatedCopy || ''; 
      if (d.length > 90) d = d.substring(0, 87) + '...'; 
      payload = { 
        campaign_id: campaign.id, 
        workspace_id: 'work_luxe_01', 
        platform_target: 'seo_google_ads_wordpress', 
        campaign_name: campaign.title, 
        business_name: "Luxe Homes and Renovations",
        business_url: "https://luxehr.com.au/",
        location_name: "Sydney,New South Wales,Australia",
        language_code: "en",
        content: { 
          title: campaign.title, 
          excerpt: (campaign.generatedCopy || '').slice(0, 60) + '...', 
          body_markdown: '## Introduction...', 
          tags: campaign.blogTags && campaign.blogTags.length > 0 ? campaign.blogTags : [],
          budget: campaign.budget || 50, 
          target_country: campaign.targetCountry || 'AU', 
          ad_headline: h, 
          ad_description: d,
          keywords: ["home renovations sydney", "luxury renovations sydney", "renovation company sydney"],
          image_style: "premium modern Sydney home renovation, architectural editorial photography"
        }
      };
      uiPayload = {
        title: campaign.title,
        excerpt: (campaign.generatedCopy || '').slice(0, 60) + '...',
        body_markdown: '## Introduction...',
        tags: campaign.blogTags && campaign.blogTags.length > 0 ? campaign.blogTags : [],
        budget: campaign.budget || 50,
        target_country: campaign.targetCountry || 'AU',
        ad_headline: h,
        ad_description: d,
        keywords: ["home renovations sydney", "luxury renovations sydney", "renovation company sydney"],
        image_style: "premium modern Sydney home renovation, architectural editorial photography",
        business_name: "Luxe Homes and Renovations",
        business_url: "https://luxehr.com.au/",
        location_name: "Sydney,New South Wales,Australia",
        language_code: "en"
      };
    }
  return (
    <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-none p-3 font-mono text-[10px] text-black dark:text-white overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2 border-b-2 border-black dark:border-white pb-2">
        <div className="font-sans text-[9px] uppercase tracking-wider font-bold">Payload Preview</div>
        <div className="flex border-2 border-black dark:border-white">
          <button type="button" onClick={() => setPayloadMode('ui')} className={`px-2 py-0.5 text-[9px] font-bold uppercase ${payloadMode === 'ui' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-black dark:bg-black dark:text-white'}`}>UI Mode</button>
          <button type="button" onClick={() => setPayloadMode('final')} className={`px-2 py-0.5 text-[9px] font-bold uppercase border-l-2 border-black dark:border-white ${payloadMode === 'final' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white text-black dark:bg-black dark:text-white'}`}>Final n8n</button>
        </div>
      </div>
      <div className="overflow-auto max-h-36">
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(payloadMode === 'final' ? payload : uiPayload, null, 2)}</pre>
      </div>
    </div>
  );
} export default function AiMarketing() { const [campaigns, setCampaigns] = useState<AdCampaign[]>([]); const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null); const [loading, setLoading] = useState(true); const [activeScenario, setActiveScenario] = useState<ScenarioId>('A'); const sc = SCENARIO_MAP[activeScenario]; const ScIcon = activeScenario === 'A' ? FacebookIcon : Rocket; const [genTenant, setGenTenant] = useState<'full_home_renovation' | 'kitchen_renovation' | 'bathroom_renovation' | 'granny_flat' | 'extension' | 'multi_unit' | 'new_luxe_homes'>('full_home_renovation'); const [customGoal, setCustomGoal] = useState(SCENARIO_MAP.A.placeholder); const [campaignTitle, setCampaignTitle] = useState('');
  // Scenario A
  const [mediaUrl, setMediaUrl] = useState(''); const [destinationLink, setDestinationLink] = useState('');
  // Scenario B
  const [blogTagsRaw, setBlogTagsRaw] = useState('renovation, luxury, sydney'); const [wpDomain, setWpDomain] = useState('');
  // Scenario C
  const [budget, setBudget] = useState('50'); const [targetCountry, setTargetCountry] = useState('AU'); const [isGenerating, setIsGenerating] = useState(false); const [isPushing, setIsPushing] = useState(false); const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null); const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null); const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null); const [editTitle, setEditTitle] = useState(''); const [editCopy, setEditCopy] = useState(''); const [landingTitle, setLandingTitle] = useState('Expert Heating Services & Solutions'); const [landingSub, setLandingSub] = useState('Cut your fuel bills by 35% with state-of-the-art climate responsive home solutions.'); const [selectedTemplateColor, setSelectedTemplateColor] = useState('rose'); useEffect(() => { setCustomGoal(sc.placeholder); setCampaignTitle(''); setMediaUrl(''); setDestinationLink(''); setBlogTagsRaw('renovation, luxury, sydney'); setWpDomain(''); setBudget('50'); setTargetCountry('AU');
  }, [activeScenario]); useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t); }
  }, [toast]); const loadData = async () => { try { 
      const cached = localStorage.getItem('crm_campaigns');
      if (cached && !campaigns.length) setCampaigns(JSON.parse(cached));
      const loaded = await fetchLiveCampaigns(); setCampaigns(loaded); 
      localStorage.setItem('crm_campaigns', JSON.stringify(loaded));
      if (loaded.length > 0) { if (!selectedCampaign) setSelectedCampaign(loaded[0]); else { const fresh = loaded.find((c: AdCampaign) => c.id === selectedCampaign.id); setSelectedCampaign(fresh || loaded[0]);
        }
      } else setSelectedCampaign(null);
    } catch (err) { console.error('Failed to load campaigns:', err); } finally { setLoading(false); }
  };
  useEffect(() => { 
    loadData(); 
    const ws = initLiveWebSocket((msg: any) => { 
      if (['CAMPAIGN_CREATED', 'CAMPAIGN_UPDATED', 'CAMPAIGN_DELETED'].includes(msg.type)) loadData();
    }); 

    // Listen for automated background polling
    const handleHydration = () => loadData();
    window.addEventListener('crm_global_hydration_tick', handleHydration);

    return () => {
      ws.close();
      window.removeEventListener('crm_global_hydration_tick', handleHydration);
    };
  }, []); 

  const handleGenerate = async (e: React.FormEvent) => { e.preventDefault(); setIsGenerating(true); try { const extras: any = {};
  if (campaignTitle) extras.campaignTitle = campaignTitle; if (activeScenario === 'A') { if (mediaUrl) extras.mediaUrl = mediaUrl; if (destinationLink) extras.destinationLink = destinationLink;
      } else if (activeScenario === 'BC') { 
        extras.blogTags = blogTagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean); 
        if (wpDomain) extras.destinationLink = wpDomain;
        extras.budget = Number(budget) || 50; 
        extras.targetCountry = targetCountry || 'AU';
      }
  const created = await generateLiveCampaign(sc.platform, genTenant, customGoal, extras); 
      setCampaigns(prev => [created, ...prev]);
      setSelectedCampaign(created); 
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `AI Ad Campaign "${created.title || 'Untitled'}" generated successfully! 🪄`, type: 'success' } 
      }));
    } catch (err: any) { window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Generation failed: ' + (err.message || err), type: 'error' } 
      }));
    } finally { setIsGenerating(false); }
  };
  const executeApprove = async (id: string) => { setIsPushing(true); try { const approved = await approveLiveCampaign(id); setCampaigns(prev => prev.map(c => c.id === id ? approved : c)); if (selectedCampaign?.id === id) setSelectedCampaign(approved); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'n8n workflow triggered successfully! Campaign is Live. 🚀', type: 'success' } 
      }));
    } catch (err: any) { window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Workflow activation failed: ' + (err.message || err), type: 'error' } 
      }));
    } finally { setIsPushing(false); }
  };
  const executeDeleteConfirm = async () => { 
    if (!deleteConfirm) return; 
    const deletedName = deleteConfirm.name; 
    const targetId = deleteConfirm.id;
    // Optimistic Update
    const updated = campaigns.filter(c => c.id !== targetId); 
    setCampaigns(updated); 
    if (selectedCampaign?.id === targetId) setSelectedCampaign(updated[0] || null); 
    setDeleteConfirm(null); 
    try { 
      await deleteLiveCampaign(targetId); 
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Ad Campaign "${deletedName}" removed! 🗑️`, type: 'warning' } }));
    } catch (err: any) { 
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Deletion failed: ' + (err.message || err), type: 'error' } }));
    }
  };
  const handleSaveEdit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!editingCampaign) return; 
    const targetId = editingCampaign.id;
    // Optimistic Update
    setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, title: editTitle, generatedCopy: editCopy } : c));
    setEditingCampaign(null); 
    try { 
      await updateLiveCampaign(targetId, { title: editTitle, generatedCopy: editCopy }); 
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Campaign details updated! ✏️`, type: 'success' } }));
    } catch (err: any) { 
      window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Edit update failed: ' + (err.message || err), type: 'error' } }));
    }
  };
  const handleApplyToLanding = () => { if (!selectedCampaign) return; setLandingTitle(selectedCampaign.title); setLandingSub((selectedCampaign.generatedCopy || '').slice(0, 110) + '...'); if (selectedCampaign.tenant === 'full_home_renovation') setSelectedTemplateColor('rose'); if (selectedCampaign.tenant === 'kitchen_renovation') setSelectedTemplateColor('teal'); if (selectedCampaign.tenant === 'bathroom_renovation') setSelectedTemplateColor('amber'); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: 'Applied campaign copy to the landing page template! 🎨', type: 'success' } 
    }));
  };
  const inp = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-neutral-400'; const lbl = 'text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors tracking-wider block mb-1'; return (
    <div className="space-y-6">

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border space-y-4">
            <div className="flex items-center gap-3 text-rose-600"><AlertTriangle className="w-6 h-6" /><h3 className="font-bold text-lg">Confirm Deletion</h3></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors">Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">Cancel</button>
              <button onClick={executeDeleteConfirm} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Delete</button>
            </div>
          </div>
        </div>
      )}

      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSaveEdit} className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold flex items-center gap-2 text-slate-900 dark:text-white"><Pencil className="w-4 h-4 text-black dark:text-white" />Edit Campaign</span>
              <button type="button" onClick={() => setEditingCampaign(null)}><X className="w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors" /></button>
            </div>
            <div><label className={lbl}>Campaign Title</label><input className={inp} required value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div><label className={lbl}>Ad / Content Copy</label><textarea className={`${inp} h-28`} value={editCopy} onChange={e => setEditCopy(e.target.value)} /></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white to-pink-600 text-white font-bold text-xs py-2.5 rounded-lg shadow hover:opacity-95 transition"><Check className="w-3.5 h-3.5 inline mr-1" />Save Changes</button>
              <button type="button" onClick={() => setEditingCampaign(null)} className="px-4 py-2.5 border rounded-lg text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">Discard</button>
            </div>
          </form>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Marketing & n8n Workflow Hub</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>3 fixed n8n workflows. Pick a scenario, configure, generate with Gemini AI, then approve to trigger the live automation.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">n8n Connected</span>
        </div>
      </div>

      {/* 3 Fixed Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.values(SCENARIO_MAP) as (typeof SCENARIO_MAP[ScenarioId])[]).map(s => { const isActive = activeScenario === s.id; const Icon = s.id === 'A' ? FacebookIcon : Rocket; return (
            <button key={s.id} onClick={() => setActiveScenario(s.id)} className={`text-left p-4 rounded-xl border-2 transition-all duration-200 shadow-sm ${isActive ? s.borderActive + ' shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-neutral-300 hover:shadow'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl  ${s.bgClass} flex items-center justify-center flex-shrink-0 shadow`}>
                  <Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest ${s.badgeBg} px-1.5 py-0.5 rounded`}>Scenario {s.id}</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{s.label}</div>
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">{s.sub}</div>
                </div>
                <ChevronRight className={`w-4 h-4 mt-1 flex-shrink-0 transition-transform ${isActive ? 'text-neutral-600 dark:text-neutral-400 transition-colors rotate-90' : 'text-neutral-600 dark:text-neutral-400 transition-colors'}`} />
              </div>
              <p className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors mt-3 leading-relaxed">{s.description}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-neutral-600 dark:text-neutral-400 transition-colors" />
                <code className="text-[9px] text-neutral-600 dark:text-neutral-400 transition-colors font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">platform_target: "{s.n8nTarget}"</code>
              </div>
              {/* Platform icons for Scenario A */}
              {s.id === 'A' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[9px] text-black dark:text-white font-bold flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg> Facebook
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 transition-colors">+</span>
                  <span className="text-[9px] text-pink-500 font-bold flex items-center gap-1">
                    <Instagram className="w-3 h-3" /> Instagram
                  </span>
                  <span className="text-[9px] text-blue-400 font-bold">simultaneously</span>
                </div>
              )}
              {s.id === 'BC' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[9px] text-indigo-500 font-bold">DataForSEO + WP + Ads</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT: Generation form */}
        <div className="lg:col-span-2 border rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className={` ${sc.bgClass} px-5 py-4`}>
            <div className="flex items-center gap-2.5">
              <ScIcon />
              <div>
                <span className="text-slate-900 dark:text-white text-xs font-extrabold uppercase tracking-widest">Scenario {activeScenario}: {sc.label}</span>
                <p className="text-slate-900 dark:text-white /70 text-[9px] mt-0.5">{sc.sub}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="p-5 space-y-4">

            <div>
              <label className={lbl}>Campaign Title <span className="normal-case font-normal text-neutral-600 dark:text-neutral-400 transition-colors">(optional)</span></label>
              <input className={inp} placeholder={`e.g. ${sc.label} — Q3 Drive`} value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} />
            </div>

            <div>
              <label className={lbl}>Business Division</label>
              <select className={inp} value={genTenant} onChange={e => setGenTenant(e.target.value as any)}>
                {TENANTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Scenario A: Meta-specific fields */}
            {activeScenario === 'A' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                  </div>
                  <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider">Posts to Facebook & Instagram</p>
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-900/60 rounded-lg px-3 py-2 text-[10px] text-black dark:text-white leading-relaxed"> One approval triggers posts on <strong>both platforms simultaneously</strong>. The AI caption is optimised for both feeds.
                </div>
                <div>
                  <label className={lbl}>Media Image Upload <span className="font-normal normal-case text-neutral-600 dark:text-neutral-400 transition-colors">(auto-filled if blank)</span></label>
                  <div className="flex items-center gap-2">
                    <label className={`${inp} flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-100 dark:hover:bg-neutral-900 transition text-center`}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{mediaUrl && mediaUrl.startsWith('data:image') ? 'Photo Selected' : 'Select Photo to Upload'}</span>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64 = reader.result as string;
                            setMediaUrl(base64);
                            try {
                              const res = await analyzeImageTags(base64);
                              if (res && res.tags) {
                                const tagsString = res.tags.join(', ');
                                setCustomGoal(prev => {
                                  const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? '\n\n' : '';
                                  return prev + sep + 'Target Keywords: ' + tagsString;
                                });
                                window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `AI extracted keywords from image! 🏷️`, type: 'success' } }));
                              }
                            } catch (err) {
                              console.error("Image tag extraction failed", err);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} className="hidden" />
                    </label>
                    {mediaUrl && mediaUrl.startsWith('data:image') && (
                      <button type="button" onClick={() => setMediaUrl('')} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div><label className={lbl}>Destination Link <span className="font-normal normal-case text-neutral-600 dark:text-neutral-400 transition-colors">(auto-filled if blank)</span></label><input className={inp} placeholder="https://yoursite.co.uk" value={destinationLink} onChange={e => setDestinationLink(e.target.value)} /></div>
              </div>
            )}

            {/* Scenario BC: Unified Full Funnel fields */}
            {activeScenario === 'BC' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-3.5 h-3.5 text-indigo-600" />
                  <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Scenario B+C: Full Funnel</p>
                </div>
                <div className="bg-indigo-100/60 rounded-lg px-3 py-2 text-[10px] text-indigo-700 leading-relaxed">
                  Unified strategy mapping to seo_google_ads_wordpress pipeline.
                </div>
                <div>
                  <label className={lbl}>SEO Keyword Targets <span className="font-normal normal-case text-neutral-600 dark:text-neutral-400 transition-colors">(comma-separated)</span></label>
                  <input className={inp} placeholder="liquid screed, flooring contractor, london" value={blogTagsRaw} onChange={e => setBlogTagsRaw(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Daily Budget ($)</label><input className={inp} type="number" min="1" placeholder="50" value={budget} onChange={e => setBudget(e.target.value)} /></div>
                  <div>
                    <label className={lbl}>Target Country</label>
                    <select className={inp} value={targetCountry} onChange={e => setTargetCountry(e.target.value)}>
                      <option value="AU">Australia (AU)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="US">United States (US)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className={lbl}>AI Campaign Focus / Goal</label>
              <textarea className={`${inp} h-20 resize-none`} value={customGoal} onChange={e => setCustomGoal(e.target.value)} placeholder="Describe the campaign goal, key offers, or differentiators..." />
            </div>

            <button type="submit" disabled={isGenerating} className={`w-full  ${sc.bgClass} text-slate-900 dark:text-white font-bold text-xs py-3 rounded-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed`}>
              {isGenerating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating AI Copy...</span></>
                : <><Sparkles className="w-3.5 h-3.5" /><span>Generate & Draft Campaign</span></>
              }
            </button>
          </form>
        </div>

        {/* RIGHT: Approval + preview */}
        <div className="lg:col-span-3 space-y-4">

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 animate-bounce" />
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900">Human-in-the-Loop Approval Gate</span>
                <p className="text-[10px] text-amber-700 leading-snug">Review AI output carefully before approving. Approval triggers the n8n webhook and live automation.</p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase flex-shrink-0">Gate Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Campaign log */}
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-3 h-3" />Campaign Log</span>
                <span className="text-[9px] text-neutral-600 dark:text-neutral-400 transition-colors">{campaigns.length} records</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                {loading ? (
                  <div className="text-center py-10 text-xs text-neutral-600 dark:text-neutral-400 transition-colors flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-10 text-xs text-neutral-600 dark:text-neutral-400 transition-colors italic">No campaigns yet. Generate one on the left.</div>
                ) : campaigns.map((camp: AdCampaign) => (
                  <div key={camp.id} onClick={() => setSelectedCampaign(camp)} className={`px-3 py-2.5 cursor-pointer transition flex justify-between items-center group ${selectedCampaign?.id === camp.id ? 'bg-[#4F46E5]/8 border-l-2 border-[#4F46E5]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <ScenarioPill platform={camp.platform} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{camp.title}</h4>
                        <span className="text-[9px] text-neutral-600 dark:text-neutral-400 transition-colors">{camp.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StatusBadge status={camp.status} />
                      <button onClick={e => { e.stopPropagation(); setEditingCampaign(camp); setEditTitle(camp.title); setEditCopy(camp.generatedCopy); }} className="opacity-0 group-hover:opacity-100 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:text-white p-0.5 rounded transition"><Pencil className="w-3 h-3" /></button>
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: camp.id, name: camp.title }); }} className="opacity-0 group-hover:opacity-100 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-rose-600 p-0.5 rounded transition"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected campaign detail */}
            <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}>
              {selectedCampaign ? (
                <>
                  <div className="flex items-center justify-between">
                    <div><ScenarioPill platform={selectedCampaign.platform} /><h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{selectedCampaign.title}</h3></div>
                    <StatusBadge status={selectedCampaign.status} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border text-xs text-neutral-600 dark:text-neutral-400 transition-colors leading-relaxed max-h-20 overflow-y-auto whitespace-pre-wrap">
                    {selectedCampaign.generatedCopy}
                  </div>
                  {selectedCampaign.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedCampaign.hashtags.map((t: string) => <span key={t} className="text-[9px] bg-[#4F46E5]/10 text-[#4F46E5] px-1.5 py-0.5 rounded font-mono">#{t}</span>)}
                    </div>
                  )}
                  <PayloadPreview campaign={selectedCampaign} />
                  <div className="pt-1 space-y-1.5">
                    {selectedCampaign.status === 'Live' ? (
                      <>
                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />n8n Workflow Triggered — Campaign is Live
                        </div>
                        <button onClick={handleApplyToLanding} className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-black text-slate-900 dark:text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"><Globe className="w-3.5 h-3.5" />Apply to Landing Page</button>
                      </>
                    ) : selectedCampaign.status === 'Approved' ? (
                      <>
                        <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-xs font-bold">Locally Approved — n8n was unreachable</div>
                        <button onClick={() => executeApprove(selectedCampaign.id)} disabled={isPushing} className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1">
                          {isPushing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Retrying...</> : <><Send className="w-3.5 h-3.5" />Retry Push to n8n</>}
                        </button>
                        <button onClick={handleApplyToLanding} className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-black text-slate-900 dark:text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1"><Globe className="w-3.5 h-3.5" />Apply to Landing Page</button>
                      </>
                    ) : (
                      <button onClick={() => executeApprove(selectedCampaign.id)} disabled={isPushing} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2">
                        {isPushing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Triggering n8n Workflow...</span></>
                          : <><Rocket className="w-4 h-4" /><span>Approve & Trigger n8n Workflow</span></>
                        }
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-neutral-600 dark:text-neutral-400 transition-colors text-xs italic">
                  <Activity className="w-8 h-8 mb-3 opacity-30" />Select a campaign from the log to review and push to n8n.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Landing Page Customizer */}
      <div id="landing-page-generator-container" className="border rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-[#4F46E5] text-xs uppercase font-extrabold tracking-widest">Active Template Engine</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Programmatic Marketing Landing Page Customizer</h3>
          </div>
          <div className="flex gap-1.5">
            {['rose', 'teal', 'amber'].map(c => (
              <button key={c} onClick={() => setSelectedTemplateColor(c)} className={`w-4 h-4 rounded-full border bg-${c}-500 ${selectedTemplateColor === c ? 'ring-2 ring-[#4F46E5]' : ''}`} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div><label className={lbl}>Landing Title Head</label><input className={inp} value={landingTitle} onChange={e => setLandingTitle(e.target.value)} /></div>
            <div><label className={lbl}>Subhead Promo Copy</label><textarea className={`${inp} h-20`} value={landingSub} onChange={e => setLandingSub(e.target.value)} /></div>
            <button onClick={() => { const cMap: Record<string,any> = { rose:  { bg: '#1e293b', bb: '#7f1d1d60', bt: '#fca5a5', bd: '#7f1d1d', cta: '#e11d48' }, teal:  { bg: '#0f172a', bb: '#064e3b60', bt: '#6ee7b7', bd: '#064e3b', cta: '#0d9488' }, amber: { bg: '#0f172a', bb: '#7c2d1260', bt: '#fcd34d', bd: '#7c2d12', cta: '#d97706' },
                };
  const col = cMap[selectedTemplateColor] || cMap['rose']; const html = `<html><head><meta charset='utf-8'><title>${landingTitle}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:40px;background:${col.bg};color:#fff}.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:bold;background:${col.bb};color:${col.bt};border:1px solid ${col.bd}}h1{font-size:28px;margin:20px 0 10px}p{color:#94a3b8;font-size:14px;line-height:1.6;max-width:600px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}.cta{padding:8px 24px;border-radius:8px;font-weight:bold;background:${col.cta};color:#fff;border:none;cursor:pointer}</style></head><body><span class='badge'>Featured Special Offer</span><h1>${landingTitle}</h1><p>${landingSub}</p><div class='footer'><span style='color:#64748b'>Lead Intake Form Integrated</span><button class='cta'>Secure Quote Fast Callout</button></div></body></html>`; const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `landing-${selectedTemplateColor}-${Date.now()}.html`; a.click(); URL.revokeObjectURL(url);
              }} className="w-full py-2 from-[#4F46E5] to-[#06B6D4] hover:opacity-95 text-slate-900 dark:text-white font-bold text-xs rounded-lg transition"
            > Download Landing Page HTML
            </button>
          </div>
          <div className="col-span-2 bg-neutral-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white min-h-[200px] flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-20 ${selectedTemplateColor === 'rose' ? 'bg-rose-500' : selectedTemplateColor === 'teal' ? 'bg-teal-500' : 'bg-amber-500'}`} />
            <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-neutral-600 dark:text-neutral-400 transition-colors">
              <span>PUBLIC DOMAIN PREVIEW</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />Live SSL Active</span>
            </div>
            <div className="space-y-3 mt-4">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${selectedTemplateColor === 'rose' ? 'bg-rose-900/40 text-rose-300 border border-rose-800' : selectedTemplateColor === 'teal' ? 'bg-teal-900/40 text-teal-300 border border-teal-800' : 'bg-amber-900/40 text-amber-300 border border-amber-800'}`}> Featured Special Offer
              </span>
              <h1 className="text-lg font-bold leading-tight text-slate-900 dark:text-white max-w-xl">{landingTitle}</h1>
              <p className="text-neutral-600 dark:text-neutral-400 transition-colors text-xs max-w-lg leading-relaxed">{landingSub}</p>
            </div>
            <div className="flex justify-between items-center mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
              <span className="text-neutral-600 dark:text-neutral-400 transition-colors text-[10px]">Lead Intake Form Integrated</span>
              <button className={`py-1.5 px-4 rounded font-bold text-[11px] text-white ${selectedTemplateColor === 'rose' ? 'bg-rose-600' : selectedTemplateColor === 'teal' ? 'bg-teal-600' : 'bg-amber-600'}`}>Secure Quote Fast Callout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
