import React, { useState, useEffect } from 'react';
import { SmartPDFAttachment } from '../types';
import { FileUp, Eye, Sparkles, HardDrive, Trash2, Cpu, CheckCircle, Pencil, X, AlertTriangle, Building, MapPin, DollarSign, FileText, Upload, Database, Loader2, BrainCircuit, Clock, Tag
} from 'lucide-react';
import { fetchLiveDocuments, uploadLiveDocument, updateLiveDocument, deleteLiveDocument, initLiveWebSocket 
} from '../lib/api'; export default function PdfIntake() { const [attachments, setAttachments] = useState<SmartPDFAttachment[]>([]); const [selectedPdf, setSelectedPdf] = useState<SmartPDFAttachment | null>(null); const [isUploading, setIsUploading] = useState(false); const [uploadProgress, setUploadProgress] = useState(0); const [loading, setLoading] = useState(true); const [editingDoc, setEditingDoc] = useState<SmartPDFAttachment | null>(null); const [editFileName, setEditFileName] = useState(''); const [editClientName, setEditClientName] = useState(''); const [editAddress, setEditAddress] = useState(''); const [editTotalAmount, setEditTotalAmount] = useState(''); const [editItems, setEditItems] = useState(''); const [editConfidence, setEditConfidence] = useState(''); const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null); const loadData = async () => { try { const loaded = await fetchLiveDocuments(); setAttachments(loaded); if (loaded.length > 0) { if (!selectedPdf) { setSelectedPdf(loaded[0]);
        } else { const fresh = loaded.find(a => a.id === selectedPdf.id); setSelectedPdf(fresh || loaded[0]);
        }
      } else { setSelectedPdf(null);
      }
    } catch (err) { console.error("Failed to load attachments:", err);
    } finally { setLoading(false);
    }
  };
  useEffect(() => { loadData(); const ws = initLiveWebSocket((message) => { if (message.type === "PDF_PARSING_STATUS") setUploadProgress(message.progress || 50); if (message.type === "DOCUMENT_CREATED" || message.type === "DOCUMENT_UPDATED" || message.type === "DOCUMENT_DELETED") loadData();
    }); return () => ws.close();
  }, []); const simulateNewPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files || e.target.files.length === 0) return; const file = e.target.files[0]; setIsUploading(true); setUploadProgress(15); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Queuing "${file.name}" for Gemini parsing... 🧠`, type: 'info' } 
    })); const progressInterval = setInterval(() => { setUploadProgress(prev => { if (prev >= 90) { clearInterval(progressInterval); return 90; }
  return prev + 15; });
    }, 300); try { const created = await uploadLiveDocument(file); clearInterval(progressInterval); setUploadProgress(100); setTimeout(async () => { setIsUploading(false); await loadData(); setSelectedPdf(created); window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Gemini AI parsed document "${file.name}" successfully! 📊`, type: 'success' } 
        }));
      }, 500);
    } catch (err: any) { clearInterval(progressInterval); setIsUploading(false); alert("Upload failed: " + (err.message || err));
    }
  };
  const handleStartEditDoc = (doc: SmartPDFAttachment) => { setEditingDoc(doc); setEditFileName(doc.fileName); setEditClientName(doc.extractedData?.clientName || ''); setEditAddress(doc.extractedData?.address || ''); setEditTotalAmount(doc.extractedData?.totalAmount || ''); setEditItems((doc.extractedData?.items || []).join(', ')); setEditConfidence(String(doc.extractedData?.confidence || ''));
  };
  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    const targetId = editingDoc.id;
    const updatedPayload = { fileName: editFileName, extractedData: { ...editingDoc.extractedData, clientName: editClientName, address: editAddress, totalAmount: editTotalAmount, items: editItems.split(',').map(i => i.trim()).filter(Boolean), confidence: parseInt(editConfidence) || 0 } };
    
    // Optimistic UI Update
    setAttachments(prev => prev.map(a => a.id === targetId ? { ...a, ...updatedPayload } : a));
    setEditingDoc(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Document details saved for "${editFileName}"! ✏️`, type: 'success' } }));
    
    try {
      await updateLiveDocument(targetId, updatedPayload);
    } catch (err) {
      console.warn("Optimistic update network failure:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm.id;
    const deletedName = deleteConfirm.name;
    
    // Optimistic UI Deletion
    const updated = attachments.filter(a => a.id !== targetId);
    setAttachments(updated);
    if (selectedPdf && selectedPdf.id === targetId) setSelectedPdf(updated[0] || null);
    setDeleteConfirm(null);
    window.dispatchEvent(new CustomEvent('crm_show_toast', { detail: { message: `Document "${deletedName}" removed from ledger! 🗑️`, type: 'warning' } }));
    
    try {
      await deleteLiveDocument(targetId);
    } catch (err) {
      console.warn("Optimistic delete network failure:", err);
    }
  };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 /50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delete Document</h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors mb-6">Permanently delete <strong className="text-slate-900 dark:text-white">{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700 /50">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 rounded-xl from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-bold transition-all flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Premium Dark Gradient (matches AdminPanel) */}
      <div className="relative overflow-hidden rounded-2xl from-white dark:from-slate-900 via-slate-50 dark:via-slate-800 to-white dark:to-slate-900 p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 /50">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600 dark:bg-indigo-500 text-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-black/5 dark:shadow-white/5 ring-2 ring-white/10">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AI Smart PDF Intake</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors mt-0.5">Programmatic extraction for tenders, quotes & engineering surveys</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal - Premium Dark */}
      {editingDoc && (
        <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl animate-scale-in">
          <form onSubmit={handleSaveEditDoc} className="space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 /50">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Pencil className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /> {editingDoc.fileName}</span>
              <button type="button" onClick={() => setEditingDoc(null)} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">File Name</label>
                <input type="text" required className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editFileName} onChange={e => setEditFileName(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Client Name</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editClientName} onChange={e => setEditClientName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Address</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Total Amount</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editTotalAmount} onChange={e => setEditTotalAmount(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Items</label>
              <textarea className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm h-20 focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editItems} onChange={e => setEditItems(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5 block">Confidence %</label>
              <input type="number" min="0" max="100" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /50 text-slate-900 dark:text-white text-sm focus:border-black dark:border-white/50 focus:ring-1 focus:ring-black dark:ring-white/20 outline-none transition-all" value={editConfidence} onChange={e => setEditConfidence(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 px-5 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-500 text-white hover: text-white text-sm font-bold transition-all shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Save Changes
              </button>
              <button type="button" onClick={() => setEditingDoc(null)} className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700 /50">Discard</button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Upload & List */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Upload Zone - Premium Dark */}
          <div className="relative overflow-hidden rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-8 cursor-pointer group text-center hover:border-black dark:border-white/30 transition-all duration-300">
            <input type="file" accept=".pdf" onChange={simulateNewPdfUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={isUploading} />
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white/20 to-cyan-500/20 border border-black dark:border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-7 h-7 text-neutral-500 dark:text-neutral-400" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white block">Drop PDF or click to upload</span>
            <span className="text-xs text-neutral-600 dark:text-neutral-400 transition-colors mt-1.5 block">Engineering quotes, tenders, surveys — up to 10MB</span>

            {isUploading && (
              <div className="absolute inset-0 bg-white dark:bg-slate-900 backdrop-blur-sm rounded-2xl flex flex-col justify-center items-center px-8 z-20">
                <Loader2 className="w-10 h-10 text-neutral-500 dark:text-neutral-400 animate-spin mb-4" />
                <span className="text-sm font-bold text-slate-900 dark:text-white mb-3">AI Processing Document...</span>
                <div className="w-full max-w-xs bg-slate-50 dark:bg-slate-900/50 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 text-white to-cyan-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Document Ledger */}
          <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 /50 mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors">Document Ledger</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-neutral-600 dark:text-neutral-400 transition-colors border border-slate-200 dark:border-slate-700 /50">{attachments.length} files</span>
            </div>

            <div className="space-y-1">
              {attachments.map(att => (
                <div key={att.id} onClick={() => setSelectedPdf(att)} className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${ selectedPdf?.id === att.id 
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white/10 border border-black dark:border-white/20' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl from-rose-500/20 to-pink-500/20 flex items-center justify-center shrink-0 border border-rose-500/10">
                      <FileText className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{att.fileName}</div>
                      <p className="text-[10px] font-mono text-neutral-600 dark:text-neutral-400 transition-colors mt-0.5 flex items-center gap-2">
                        <span>{att.fileSize}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3 inline" />
                        <span>{att.uploadedAt}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/10 flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {att.extractedData?.confidence || 95}%
                    </span>
                    <button onClick={e => { e.stopPropagation(); handleStartEditDoc(att); }} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-neutral-500 dark:text-neutral-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: att.id, name: att.fileName }); }} className="btn-ghost text-neutral-600 dark:text-neutral-400 transition-colors hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {attachments.length === 0 && (
                <div className="text-center py-12 text-neutral-600 dark:text-neutral-400 transition-colors">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Extraction Details */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl from-white dark:from-slate-900 to-slate-50 dark:to-slate-800 border border-slate-200 dark:border-slate-700 /50 p-6 shadow-xl min-h-[500px] flex flex-col">
            {selectedPdf ? (
              <>
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-700 /50 mb-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors">AI Extraction Result</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">{selectedPdf.fileName}</h3>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/10 shrink-0 ml-3">
                    {selectedPdf.extractedData?.confidence || 95}% confidence
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {/* Client */}
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white/10 flex items-center justify-center shrink-0"><Building className="w-4 h-4 text-neutral-500 dark:text-neutral-400" /></div>
                    <div><span className="text-[9px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors block mb-0.5">Client</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedPdf.extractedData?.clientName || 'N/A'}</span></div>
                  </div>
                  {/* Site */}
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-cyan-400" /></div>
                    <div><span className="text-[9px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors block mb-0.5">Site</span><span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedPdf.extractedData?.address || 'N/A'}</span></div>
                  </div>
                  {/* Total Amount */}
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><DollarSign className="w-4 h-4 text-emerald-400" /></div>
                    <div><span className="text-[9px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors block mb-0.5">Total Value</span><span className="text-lg font-bold text-emerald-400">{selectedPdf.extractedData?.totalAmount || 'N/A'}</span></div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                    {selectedPdf.extractedData?.boilerModel && (
                      <div><span className="text-[8px] uppercase font-bold text-rose-400 block mb-0.5">Boiler Spec</span><span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedPdf.extractedData.boilerModel}</span></div>
                    )}
                    {selectedPdf.extractedData?.screedThickness && (
                      <div><span className="text-[8px] uppercase font-bold text-teal-400 block mb-0.5">Screed Depth</span><span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedPdf.extractedData.screedThickness}</span></div>
                    )}
                    {selectedPdf.extractedData?.wiringStandard && (
                      <div className="col-span-2 pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 /50"><span className="text-[8px] uppercase font-bold text-amber-400 block mb-0.5">Wiring Standard</span><span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedPdf.extractedData.wiringStandard}</span></div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30">
                    <span className="text-[9px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors block mb-3">Line Items</span>
                    <ul className="space-y-2">
                      {selectedPdf.extractedData?.items?.map((item, id) => (
                        <li key={id} className="text-[11px] text-neutral-600 dark:text-neutral-400 transition-colors flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Push Button */}
                <button onClick={async () => { try { const { createLiveContact, createLiveDeal } = await import('../lib/api'); if (selectedPdf?.extractedData?.clientName) { await createLiveContact({ name: selectedPdf.extractedData.clientName, company: selectedPdf.extractedData.clientName, email: `${selectedPdf.extractedData.clientName.toLowerCase().replace(/\\s/g,'')}@email.com`, phone: '07700 900550', status: 'Lead', revenue: parseInt(selectedPdf.extractedData.totalAmount?.replace(/[^0-9]/g,'') || '0') || 1000, tenant: selectedPdf.extractedData.boilerModel ? 'full_home_renovation' : selectedPdf.extractedData.screedThickness ? 'extension' : 'kitchen_renovation' }); await createLiveDeal({ title: `Work Bundle - ${selectedPdf.extractedData.clientName}`, company: selectedPdf.extractedData.clientName, value: parseInt(selectedPdf.extractedData.totalAmount?.replace(/[^0-9]/g,'') || '0') || 1000, stage: 'Lead', tenant: selectedPdf.extractedData.boilerModel ? 'full_home_renovation' : selectedPdf.extractedData.screedThickness ? 'extension' : 'kitchen_renovation' }); alert('✅ Pushed to CRM!');
                    }
                  } catch (err) { alert('Error: ' + err); }
                }} className="w-full mt-4 px-5 py-3 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-600 dark:bg-indigo-500 text-white hover: text-white text-sm font-bold transition-all shadow-lg shadow-black/5 dark:shadow-white/5 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Push to CRM Pipeline
                </button>

                <div className="text-[10px] text-center pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 /50 font-mono text-neutral-600 dark:text-neutral-400 transition-colors"> Powered by Gemini 3.5 Flash Extraction
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 /30 flex items-center justify-center mb-4">
                  <Eye className="w-7 h-7 text-neutral-600 dark:text-neutral-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 transition-colors">Select a document</span>
                <span className="text-[11px] text-neutral-600 dark:text-neutral-400 transition-colors mt-1">View parsed extraction data here</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}