const fs = require('fs');

// 1. Update server.ts
let serverPath = 'c:/Users/PC/Downloads/Abdelghanem-Project-main (1)/Abdelghanem-Project-main/server.ts';
let serverCode = fs.readFileSync(serverPath, 'utf8');

serverCode = serverCode.replace(
  /if \(campaign\.platform === "Meta" \|\| campaign\.platform === "Facebook" \|\| campaign\.platform === "Instagram"\) \{[\s\S]*?\} else if \(campaign\.platform === "Google"\) \{[\s\S]*?\}/,
  `if (campaign.platform === "Meta" || campaign.platform === "Facebook" || campaign.platform === "Instagram") {
      platformTarget = "meta_social";
    } else if (campaign.platform === "seo_google_ads_wordpress" || campaign.platform === "Scenario B+C" || campaign.platform === "WordPress" || campaign.platform === "Google") {
      platformTarget = "seo_google_ads_wordpress";
    }`
);

serverCode = serverCode.replace(
  /\} else if \(platformTarget === "wordpress_seo"\) \{[\s\S]*?\} else if \(platformTarget === "google_ads"\) \{[\s\S]*?\}/,
  `} else if (platformTarget === "seo_google_ads_wordpress") {
      const generatedTags = generateAutoTags(campaign.generatedCopy || "");
      const cleanTags = generatedTags.map(t => t.replace('#', ''));
      
      let headline = campaign.title || "Professional Services";
      if (headline.length > 30) headline = headline.substring(0, 27) + "...";
      let description = campaign.generatedCopy || "";
      if (description.length > 90) description = description.substring(0, 87) + "...";

      contentObj = {
        title: campaign.title || "Professional Services Landing Page",
        excerpt: campaign.generatedCopy ? campaign.generatedCopy.slice(0, 160) + "..." : "Expert services delivered.",
        body_markdown: \`## \${campaign.title}\\n\\n\${campaign.generatedCopy || ""}\`,
        tags: campaign.blogTags && campaign.blogTags.length > 0 ? campaign.blogTags : cleanTags,
        budget: Number(campaign.budget) || 50.00,
        target_country: campaign.targetCountry || "AU",
        ad_headline: headline,
        ad_description: description,
        keywords: campaign.keywords || ["home renovations sydney", "luxury renovations sydney", "renovation company sydney"],
        image_style: "premium modern Sydney home renovation, architectural editorial photography"
      };
    }`
);

serverCode = serverCode.replace(
  /workspace_id: platformTarget === 'meta_social' \? 'work_luxe_01' : \(campaign\.tenant \|\| "heating"\),/,
  `workspace_id: (platformTarget === 'meta_social' || platformTarget === 'seo_google_ads_wordpress') ? 'work_luxe_01' : (campaign.tenant || "heating"),`
);

serverCode = serverCode.replace(
  /const n8nPayload = \{[\s\S]*?content: contentObj\n    \};/,
  `const n8nPayload: any = {
      campaign_id: campaign.id || \`camp_\${platformTarget.slice(0, 2)}_\${Date.now()}\`,
      workspace_id: (platformTarget === 'meta_social' || platformTarget === 'seo_google_ads_wordpress') ? 'work_luxe_01' : (campaign.tenant || "heating"),
      platform_target: platformTarget,
      campaign_name: campaign.title,
      content: contentObj
    };
    if (platformTarget === "seo_google_ads_wordpress") {
      n8nPayload.business_name = "Luxe Homes and Renovations";
      n8nPayload.business_url = "https://luxehr.com.au/";
      n8nPayload.location_name = "Sydney,New South Wales,Australia";
      n8nPayload.language_code = "en";
    }`
);

serverCode = serverCode.replace(
  /if \(\!platform_target \|\| \!\["meta_social", "wordpress_seo", "google_ads", "facebook", "seo_blog"\]\.includes\(platform_target\)\) \{/,
  `if (!platform_target || !["meta_social", "seo_google_ads_wordpress", "wordpress_seo", "google_ads", "facebook", "seo_blog"].includes(platform_target)) {`
);

serverCode = serverCode.replace(
  /const platformFriendly: Record<string, string> = \{[\s\S]*?seo_blog: "SEO Blog"\n  \};/,
  `const platformFriendly: Record<string, string> = {
    meta_social: "Meta",
    seo_google_ads_wordpress: "Scenario B+C",
    google_ads: "Google",
    wordpress_seo: "SEO Blog",
    facebook: "Meta",
    seo_blog: "SEO Blog"
  };`
);

fs.writeFileSync(serverPath, serverCode);

// 2. Update AiMarketing.tsx
let aiPath = 'c:/Users/PC/Downloads/Abdelghanem-Project-main (1)/Abdelghanem-Project-main/src/components/AiMarketing.tsx';
let aiCode = fs.readFileSync(aiPath, 'utf8');

aiCode = aiCode.replace(
  /type ScenarioId = 'A' \| 'B' \| 'C';/,
  `type ScenarioId = 'A' | 'BC';`
);

aiCode = aiCode.replace(
  /const SCENARIO_MAP = \{[\s\S]*?\} as const;/,
  `const SCENARIO_MAP = { A: { id: 'A' as ScenarioId, label: 'Meta Social Post', sub: 'Facebook + Instagram simultaneously', bgClass: 'bg-black dark:bg-white text-white dark:text-black ', badgeBg: 'bg-neutral-100 dark:bg-neutral-9000 text-black dark:text-white', borderActive: 'border-black dark:border-white bg-neutral-100 dark:bg-neutral-900', n8nTarget: 'meta_social', platform: 'Meta', description: 'Creates a post on BOTH Facebook and Instagram at the same time. AI writes a dual-platform caption with media image and destination link.', placeholder: 'Promote 10-year boiler warranties and 0% interest finance for new boiler installs. Drive inquiries for heating works.',
  }, BC: { id: 'BC' as ScenarioId, label: 'Scenario B+C: Full Funnel', sub: 'DataForSEO + WordPress + Google Ads', bgClass: 'from-violet-600 to-rose-600', badgeBg: 'bg-indigo-100 text-indigo-700', borderActive: 'border-indigo-500 bg-indigo-50', n8nTarget: 'seo_google_ads_wordpress', platform: 'seo_google_ads_wordpress', description: 'Unified full funnel strategy handling SEO landing pages and Google Ads together.', placeholder: 'Create a full funnel campaign for Sydney home renovations...',
  }
} as const;`
);

aiCode = aiCode.replace(
  /function ScenarioPill\(\{ platform \}: \{ platform: string \}\) \{[\s\S]*?return <span className="text-\[8px\] bg-slate-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 transition-colors px-1\.5 py-0\.5 rounded font-bold uppercase">\{platform\}<\/span>;\n\}/,
  `function ScenarioPill({ platform }: { platform: string }) { if (platform === 'Meta' || platform === 'Facebook' || platform === 'Instagram') return <span className="text-[8px] bg-neutral-100 dark:bg-neutral-9000 text-black dark:text-white px-1.5 py-0.5 rounded font-bold uppercase">A · Meta</span>; if (platform === 'seo_google_ads_wordpress' || platform === 'Scenario B+C') return <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">BC · Full Funnel</span>; return <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-400 transition-colors px-1.5 py-0.5 rounded font-bold uppercase">{platform}</span>;
}`
);

aiCode = aiCode.replace(
  /const isWP = campaign\.platform === 'WordPress' \|\| campaign\.platform === 'SEO Blog';[\s\S]*?const isGoogle = campaign\.platform === 'Google';/,
  `const isFullFunnel = campaign.platform === 'seo_google_ads_wordpress' || campaign.platform === 'Scenario B+C';`
);

aiCode = aiCode.replace(
  /\} else if \(isWP\) \{[\s\S]*?\} else if \(isGoogle\) \{[\s\S]*?\}\n  return \(/,
  `} else if (isFullFunnel) { 
      let h = campaign.title || ''; 
      if (h.length > 30) h = h.substring(0, 27) + '...'; 
      let d = campaign.generatedCopy || ''; 
      if (d.length > 90) d = d.substring(0, 87) + '...'; 
      const tags = generateAutoTags(campaign.generatedCopy || '');
      const cleanTags = tags.map(t => t.replace('#', ''));
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
          tags: campaign.blogTags && campaign.blogTags.length > 0 ? campaign.blogTags : cleanTags,
          budget: campaign.budget || 50, 
          target_country: campaign.targetCountry || 'AU', 
          ad_headline: h, 
          ad_description: d,
          keywords: ["home renovations sydney", "luxury renovations sydney", "renovation company sydney"],
          image_style: "premium modern Sydney home renovation, architectural editorial photography"
        }
      };
    }
  return (`
);

aiCode = aiCode.replace(
  /const ScIcon = activeScenario === 'A' \? FacebookIcon : activeScenario === 'B' \? LayoutTemplate : Search;/,
  `const ScIcon = activeScenario === 'A' ? FacebookIcon : Rocket;`
);

aiCode = aiCode.replace(
  /\} else if \(activeScenario === 'B'\) \{ extras\.blogTags = blogTagsRaw\.split\('\,'\)\.map\(\(t: string\) => t\.trim\(\)\)\.filter\(Boolean\); if \(wpDomain\) extras\.destinationLink = wpDomain;\n      \} else if \(activeScenario === 'C'\) \{ extras\.budget = Number\(budget\) \|\| 50; extras\.targetCountry = targetCountry \|\| 'AU';\n      \}/,
  `} else if (activeScenario === 'BC') { 
        extras.blogTags = blogTagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean); 
        if (wpDomain) extras.destinationLink = wpDomain;
        extras.budget = Number(budget) || 50; 
        extras.targetCountry = targetCountry || 'AU';
      }`
);

aiCode = aiCode.replace(
  /const Icon = s\.id === 'A' \? FacebookIcon : s\.id === 'B' \? LayoutTemplate : Search;/,
  `const Icon = s.id === 'A' ? FacebookIcon : Rocket;`
);

aiCode = aiCode.replace(
  /\{\/\* Scenario B: DataForSEO \+ WordPress fields \*\/\}(.|\n)*?\{\/\* Scenario C: Google Ads fields \*\/\}(.|\n)*?<\/div>\n            \)}/,
  `{/* Scenario BC: Unified Full Funnel fields */}
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
            )}`
);

fs.writeFileSync(aiPath, aiCode);


// 3. Update AutomationControlCenter.tsx
let accPath = 'c:/Users/PC/Downloads/Abdelghanem-Project-main (1)/Abdelghanem-Project-main/src/components/AutomationControlCenter.tsx';
let accCode = fs.readFileSync(accPath, 'utf8');

accCode = accCode.replace(
  /type PlatformBranch = 'facebook' \| 'google_ads' \| 'seo_blog';/,
  `type PlatformBranch = 'facebook' | 'seo_google_ads_wordpress';`
);

accCode = accCode.replace(
  /<button onClick=\{\(\) => setActiveTab\('google_ads'\)\}(.|\n)*?<button onClick=\{\(\) => setActiveTab\('seo_blog'\)\}(.|\n)*?<\/button>/,
  `<button onClick={() => setActiveTab('seo_google_ads_wordpress')} className={\`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all \${ activeTab === 'seo_google_ads_wordpress'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-md shadow-black/5 dark:shadow-white/5'
                  : 'text-neutral-600 dark:text-neutral-400 transition-colors hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900/40'
              }\`}
            >
              <Sparkles className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
              <span>Scenario B+C: Full Funnel</span>
            </button>`
);

accCode = accCode.replace(
  /\} else if \(activeTab === 'google_ads'\) \{([\s\S]*?)\} else if \(activeTab === 'seo_blog'\) \{([\s\S]*?)\}\n\n    setIsExecuting/,
  `} else if (activeTab === 'seo_google_ads_wordpress') { 
      if (!googleHeadline.trim() || !googleDescription.trim() || !seoTitle.trim() || !seoBodyText.trim()) { 
        addLogEntry('Validation Error: Required fields missing for full funnel.', 'error'); 
        alert('Please fill in Headline, Description, SEO Title, and Body text.'); 
        return;
      }
      
      const generatedTags = generateAutoTags(seoBodyText);
      const cleanTags = generatedTags.map(t => t.replace('#', ''));
      
      payloadContent = { 
        title: seoTitle, 
        excerpt: seoExcerpt || seoBodyText.substring(0, 150) + '...', 
        body_markdown: seoBodyText, 
        tags: seoMetaTags && seoMetaTags.length > 0 ? seoMetaTags : cleanTags,
        budget: Number(googleBudget), 
        target_country: googleCountry, 
        ad_headline: googleHeadline, 
        ad_description: googleDescription,
        keywords: googleKeywords,
        image_style: "premium modern Sydney home renovation, architectural editorial photography"
      };
      targetPlatform = 'seo_google_ads_wordpress';
    } 

    setIsExecuting`
);

accCode = accCode.replace(
  /const finalPayload = \{[\s\S]*?content: payloadContent\n    \};/,
  `const finalPayload: any = { 
      campaign_id: \`camp_full_\${Date.now().toString().slice(-4)}\`, 
      workspace_id: "work_luxe_01", 
      platform_target: targetPlatform, 
      campaign_name: campaignName, 
      content: payloadContent
    };
    if (targetPlatform === 'seo_google_ads_wordpress') {
      finalPayload.business_name = "Luxe Homes and Renovations";
      finalPayload.business_url = "https://luxehr.com.au/";
      finalPayload.location_name = "Sydney,New South Wales,Australia";
      finalPayload.language_code = "en";
    }`
);

accCode = accCode.replace(
  /\{\/\* BRANCH 2: GOOGLE ADS CORE MANAGER \*\/\}(.|\n)*?\{\/\* BRANCH 3: AI SEO ENGINE MATRIX \*\/\}(.|\n)*?<\/div>\n            \)}/,
  `{/* BRANCH 2: SCENARIO B+C FULL FUNNEL */}
            {activeTab === 'seo_google_ads_wordpress' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">Google Ads Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Granular Budget (USD Daily) </label>
                      <input type="number" value={googleBudget} onChange={(e) => setGoogleBudget(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5" min="1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Target Country </label>
                      <select value={googleCountry} onChange={(e) => setGoogleCountry(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5">
                        <option value="AU">Australia (AU)</option>
                        <option value="UK">United Kingdom (UK)</option>
                        <option value="US">United States (US)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Ad Search Headline </label>
                      <input type="text" value={googleHeadline} onChange={(e) => setGoogleHeadline(e.target.value)} maxLength={30} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Ad Long Description </label>
                      <input type="text" value={googleDescription} onChange={(e) => setGoogleDescription(e.target.value)} maxLength={90} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Keywords Array Builder </label>
                    <div className="flex gap-2">
                      <input type="text" value={googleKeywordInput} onChange={(e) => setGoogleKeywordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())} className="flex-1 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2" />
                      <button type="button" onClick={addKeyword} className="bg-black dark:bg-white text-white dark:text-black/30 border px-4 py-2 rounded-xl text-xs font-semibold">Add</button>
                    </div>
                  </div>
                </div>

                <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800">
                  <h3 className="font-bold text-violet-800 dark:text-violet-300 mb-2">WordPress SEO Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Article Editorial Title </label>
                      <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Meta Excerpt </label>
                      <input type="text" value={seoExcerpt} onChange={(e) => setSeoExcerpt(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-colors mb-1.5"> Article Body Text (Markdown Ready) </label>
                    <textarea value={seoBodyText} onChange={(e) => setSeoBodyText(e.target.value)} rows={6} className="w-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 font-mono" />
                  </div>
                </div>
              </div>
            )}`
);

fs.writeFileSync(accPath, accCode);
