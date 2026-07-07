import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User, CheckCircle2, RefreshCw, KeyRound, Building2, Crown, Flame, Layers, Zap } from 'lucide-react';
import { TenantType, UserRole } from '../types';
import { loginToServer } from '../lib/api'; interface LoginScreenProps { onLoginSuccess: (tenant: TenantType, role: UserRole, userName: string, avatar: string, email: string) => void;
} 
export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) { 
  const [selectedTenant, setSelectedTenant] = useState<TenantType | 'all'>('all'); // default to 'all' for Super Admin 
  const [email, setEmail] = useState('admin@crms.com'); 
  const [password, setPassword] = useState('admin123'); 
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(true);
  
  // 2FA state
  const [showTwoFactor, setShowTwoFactor] = useState(false); const [twoFactorCode, setTwoFactorCode] = useState(''); const [captchaVerified, setCaptchaVerified] = useState(false); const [captchaLoading, setCaptchaLoading] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  // Auto-fill presets for easy validation of SaaS features
  const handlePresetSelect = (tenant: TenantType | 'all', emailVal: string, roleName: string) => { setSelectedTenant(tenant); setEmail(emailVal); setPassword('admin123'); setError('');
  };
  const handleSignIn = (e: React.FormEvent) => { e.preventDefault(); if (!captchaVerified) { setError('Please complete the security hCaptcha verification first.'); return;
    } setError(''); setLoading(true); setTimeout(() => { setLoading(false);
      // If code is correct or we simulate 2FA 
      setShowTwoFactor(true);
    }, 1000);
  };
  const handleVerify2FA = async (e: React.FormEvent) => { e.preventDefault(); if (twoFactorCode.length < 4) { setError('Please enter a valid 2FA code (e.g. 1234)'); return;
    } setLoading(true); setError(''); try { const result = await loginToServer(email, password, selectedTenant); onLoginSuccess( result.tenantId as TenantType, result.user.role as UserRole, result.user.name, result.user.avatar, result.user.email
      );
    } catch (err: any) { setError(err.message || 'Authentication failed. Please verify your credentials or network connections.');
    } finally { setLoading(false);
    }
  };
  const triggerMockCaptcha = () => { setCaptchaLoading(true); setTimeout(() => { setCaptchaLoading(false); setCaptchaVerified(true); setError('');
    }, 800);
  };
  return (
    <div id="login-container" className="min-h-screen relative flex items-center justify-center bg-[#F8F9FA] overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Enterprise geometric background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4F46E5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-96 from-[#4F46E5]/5 to-transparent pointer-events-none" />

      {/* Main visual Card */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/60 flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Brand Panel - sleek pink-orange gradients & app features summary */}
        <div className="w-full md:w-5/12 from-[#1A1A1A] via-[#2D2D2D] to-[#111111] p-8 text-slate-900 dark:text-white flex flex-col justify-between relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4F46E5_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl from-[#4F46E5] to-[#06B6D4] flex items-center justify-center text-slate-900 dark:text-white shadow-lg">
                <Crown className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Abdelghanem Enterprise</span>
            </div>

            <h2 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-white /95 mb-4"> AI-Powered <br />CRM & Dispatch Control
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors leading-relaxed mb-6"> Connect Full Home Renovation, Kitchen, Bathroom, Granny Flat, Extension, Multi Unit, and New Luxe Homes into one multi-tenant automation ecosystem.
            </p>
          </div>

          <div>
            {/* Quick Demo Credentials Switcher Card */}
            <div className="bg-white dark:bg-slate-900/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold block mb-2"> Demo Enterprise Presets:
              </span>
              <div className="space-y-2 text-xs">
                <button onClick={() => handlePresetSelect('all', 'admin@crms.com', 'Super Admin')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Super Admin Panel</span>
                  <span className="text-[10px] text-amber-200 select-all">admin@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('full_home_renovation', 'full_home@crms.com', 'Full Home Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Full Home Renovation</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">full_home@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('kitchen_renovation', 'kitchen@crms.com', 'Kitchen Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Kitchen Renovation</span>
                  <span className="text-[10px] text-amber-300">kitchen@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('bathroom_renovation', 'bathroom@crms.com', 'Bathroom Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Bathroom Renovation</span>
                  <span className="text-[10px] text-cyan-300">bathroom@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('granny_flat', 'granny_flat@crms.com', 'Granny Flat Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Granny Flat</span>
                  <span className="text-[10px] text-violet-300">granny_flat@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('extension', 'extension@crms.com', 'Extension Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Extension</span>
                  <span className="text-[10px] text-emerald-300">extension@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('multi_unit', 'multi_unit@crms.com', 'Multi Unit Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">Multi Unit</span>
                  <span className="text-[10px] text-blue-300">multi_unit@crms.com</span>
                </button>
                <button onClick={() => handlePresetSelect('new_luxe_homes', 'new_luxe@crms.com', 'Luxe Homes Manager')} className="w-full flex justify-between items-center py-1.5 px-2 bg-white dark:bg-slate-900/5 hover:bg-white/10 rounded transition border border-white/5 text-left"
                >
                  <span className="font-medium">New Luxe Homes</span>
                  <span className="text-[10px] text-slate-400">new_luxe@crms.com</span>
                </button>
              </div>
            </div>
            <div className="mt-4 text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors text-center"> All demo accounts password: <code className="text-slate-900 dark:text-white px-1 font-mono">admin123</code>
            </div>
          </div>
        </div>

        {/* Right Auth Panel - glassmorphic, interactive and elegant */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center">
          
          {!showTwoFactor ? (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors">Select operational tenant unit to begin workspace dispatch</p>
              </div>

              {error && (
                <div id="auth-error" className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Tenant Selection Grid (Horizontal cards) */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest block mb-2"> Select Associated Tenant Business
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSelectedTenant('all')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'all'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Super Admin Panel</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">All Modules</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('full_home_renovation')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'full_home_renovation'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Full Home</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Renovation</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('kitchen_renovation')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'kitchen_renovation'
                        ? 'border-[#06B6D4] bg-[#06B6D4]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#06B6D4]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#06B6D4] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Kitchen</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Renovation</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('bathroom_renovation')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'bathroom_renovation'
                        ? 'border-[#06B6D4] bg-[#06B6D4]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#06B6D4]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs">Bathroom</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Renovation</div>
                    </div>
                  </button>
                  
                  <button type="button" onClick={() => setSelectedTenant('granny_flat')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'granny_flat'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Granny Flat</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Construction</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('extension')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'extension'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Extension</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Building</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('multi_unit')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'multi_unit'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">Multi Unit</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Development</div>
                    </div>
                  </button>

                  <button type="button" onClick={() => setSelectedTenant('new_luxe_homes')} className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition ${ selectedTenant === 'new_luxe_homes'
                        ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-slate-900 dark:text-white font-semibold ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 dark:border-slate-700 hover:border-neutral-300 bg-white dark:bg-slate-900 text-neutral-600 dark:text-neutral-400 transition-colors'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#4F46E5] flex-shrink-0" />
                    <div>
                      <div className="text-xs">New Luxe Homes</div>
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Premium Builds</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Login Credentials block */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Floating-label style email element */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition text-sm text-slate-900 dark:text-white placeholder:text-neutral-400" placeholder="Enter email address"
                  />
                </div>

                {/* Floating-label style password element with eye visibility toggle */}
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400 transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition text-sm text-slate-900 dark:text-white placeholder:text-neutral-400" placeholder="Enter password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-slate-200 dark:border-slate-700 text-[#4F46E5] focus:ring-[#4F46E5] w-4 h-4 cursor-pointer"
                    />
                    <span>Remember this machine</span>
                  </label>
                  <a href="#forgot" className="font-semibold text-[#4F46E5] hover:text-[#4338CA] transition"> Forgot Password?
                  </a>
                </div>

                {/* hCaptcha mock verification module as mandated */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button type="button" onClick={triggerMockCaptcha} disabled={captchaVerified || captchaLoading} className={`w-5 h-5 rounded flex items-center justify-center border transition ${ captchaVerified 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : 'bg-white dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-neutral-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {captchaLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-600 dark:text-neutral-400 transition-colors" />
                      ) : captchaVerified ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : null}
                    </button>
                    <div>
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 transition-colors font-medium">Verify through hCaptcha secure gate</span>
                      <p className="text-[10px] text-neutral-600 dark:text-neutral-400 transition-colors">Strict bot and telemetry defense</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 transition-colors tracking-wider">hCaptcha</span>
                    <div className="text-[8px] text-neutral-600 dark:text-neutral-400 transition-colors">Privacy • Terms</div>
                  </div>
                </div>

                {/* Highly polished Sign-In button with hover gradients & active/loading states */}
                <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-xl from-[#4F46E5] to-[#06B6D4] hover:opacity-95 text-slate-900 dark:text-white font-semibold text-sm shadow-md hover:shadow-[#4F46E5]/10 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Opening Secure Channel...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In to CRM Panel</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // 2FA Verification UI as requested
            <div>
              <div className="mb-6">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4 text-black dark:text-white shadow-sm animate-bounce">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                <p className="text-xs text-center text-neutral-600 dark:text-neutral-400 transition-colors mt-1"> Enter the 4-digit code sent to your registered authenticator device configured under Tenant ID.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 transition-colors uppercase tracking-widest text-center block mb-2"> Enter Verification Code
                  </label>
                  <input type="text" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center tracking-[12px] text-2xl font-bold py-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent transition" placeholder="1234" required
                  />
                  <span className="text-[10px] text-center text-neutral-600 dark:text-neutral-400 transition-colors block mt-2"> Tip: Enter any 4 numbers (e.g. <strong className="text-neutral-600 dark:text-neutral-400 transition-colors">1234</strong>) to simulate success
                  </span>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowTwoFactor(false)} className="w-1/2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-400 transition-colors font-medium text-xs transition"
                  > Back to Login
                  </button>
                  <button type="submit" className="w-1/2 py-3 px-4 rounded-xl from-[#4F46E5] to-[#06B6D4] hover:opacity-95 text-slate-900 dark:text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify & Enter
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
