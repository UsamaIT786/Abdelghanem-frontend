const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(directoryPath);

const replacements = [
  // 1. Sidebar labels & Text grays (App.tsx and general)
  // Replaces generic text-slate-500 dark:text-slate-400
  { regex: /text-slate-500 dark:text-slate-400/g, replacement: 'text-neutral-600 dark:text-neutral-400 transition-colors' },
  { regex: /text-slate-600 dark:text-slate-300/g, replacement: 'text-neutral-600 dark:text-neutral-400 transition-colors' },
  { regex: /text-slate-400 dark:text-slate-500/g, replacement: 'text-neutral-600 dark:text-neutral-400 transition-colors' },
  { regex: /text-slate-500/g, replacement: 'text-neutral-600 dark:text-neutral-400 transition-colors' },
  { regex: /text-slate-600/g, replacement: 'text-neutral-600 dark:text-neutral-400 transition-colors' },
  
  // 2. Hover states for links and interactive elements
  { regex: /hover:text-slate-[0-9]{3} dark:hover:text-[a-z-]+-[0-9]{3}/g, replacement: 'hover:text-black dark:hover:text-white' },
  { regex: /hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:bg-slate-700/g, replacement: 'hover:bg-neutral-100 dark:hover:bg-neutral-900' },
  { regex: /hover:bg-slate-100 dark:hover:bg-slate-800/g, replacement: 'hover:bg-neutral-100 dark:hover:bg-neutral-900' },
  { regex: /hover:text-slate-[0-9]{3} dark:hover:text-white/g, replacement: 'hover:text-black dark:hover:text-white' },
  { regex: /hover:text-slate-[0-9]{3}/g, replacement: 'hover:text-black dark:hover:text-white' },
  { regex: /hover:bg-slate-[0-9]{3}/g, replacement: 'hover:bg-neutral-100 dark:hover:bg-neutral-900' },
  
  // 3. SYSTEM CHANNEL LEDGER STATE fix in App.tsx
  { regex: /text-indigo-300/g, replacement: 'text-neutral-500 dark:text-neutral-400' },
  { regex: /text-indigo-400/g, replacement: 'text-neutral-500 dark:text-neutral-400' },
  
  // 4. Metric cards hover solidification
  { regex: /hover:border-slate-[0-9]{3}/g, replacement: 'hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors' },
  { regex: /hover:border-neutral-[0-9]{3} dark:hover:border-neutral-[0-9]{3}/g, replacement: 'hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors' }
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });
  
  // Clean up any double transition-colors that might occur
  content = content.replace(/transition-colors transition-colors/g, 'transition-colors');
  content = content.replace(/transition transition-colors/g, 'transition-all duration-200');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
    changedCount++;
  }
});

console.log(`Refactored ${changedCount} files.`);
