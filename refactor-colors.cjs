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

// Define regex replacements
const replacements = [
  // Backgrounds
  { regex: /bg-slate-900/g, replacement: 'bg-white dark:bg-slate-900' },
  { regex: /bg-slate-800\/40/g, replacement: 'bg-slate-50 dark:bg-slate-800/40' },
  { regex: /bg-slate-800\/70/g, replacement: 'bg-slate-100 dark:bg-slate-800/70' },
  { regex: /bg-slate-800\/50/g, replacement: 'bg-slate-50 dark:bg-slate-800/50' },
  { regex: /bg-slate-800\/30/g, replacement: 'bg-slate-50 dark:bg-slate-800/30' },
  { regex: /bg-slate-800/g, replacement: 'bg-slate-50 dark:bg-slate-800' },
  { regex: /bg-slate-700\/50/g, replacement: 'bg-slate-100 dark:bg-slate-700/50' },
  { regex: /bg-slate-700/g, replacement: 'bg-slate-100 dark:bg-slate-700' },
  { regex: /bg-slate-600/g, replacement: 'bg-slate-200 dark:bg-slate-600' },
  { regex: /hover:bg-slate-700\/50/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-700/50' },
  { regex: /hover:bg-slate-700/g, replacement: 'hover:bg-slate-200 dark:hover:bg-slate-700' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { regex: /hover:bg-slate-600\/50/g, replacement: 'hover:bg-slate-200 dark:hover:bg-slate-600/50' },
  { regex: /hover:bg-slate-600/g, replacement: 'hover:bg-slate-200 dark:hover:bg-slate-600' },
  
  // Gradients (from/to)
  { regex: /from-slate-900/g, replacement: 'from-white dark:from-slate-900' },
  { regex: /to-slate-900/g, replacement: 'to-white dark:to-slate-900' },
  { regex: /to-slate-800/g, replacement: 'to-slate-50 dark:to-slate-800' },
  { regex: /via-slate-800/g, replacement: 'via-slate-50 dark:via-slate-800' },
  { regex: /from-slate-800/g, replacement: 'from-slate-50 dark:from-slate-800' },

  // Borders
  { regex: /border-slate-800/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { regex: /border-slate-700\/50/g, replacement: 'border-slate-200 dark:border-slate-700/50' },
  { regex: /border-slate-700\/30/g, replacement: 'border-slate-200 dark:border-slate-700/30' },
  { regex: /border-slate-700/g, replacement: 'border-slate-200 dark:border-slate-700' },
  { regex: /border-slate-600/g, replacement: 'border-slate-300 dark:border-slate-600' },
  { regex: /border-slate-600\/50/g, replacement: 'border-slate-300 dark:border-slate-600/50' },
  { regex: /hover:border-slate-600\/50/g, replacement: 'hover:border-slate-300 dark:hover:border-slate-600/50' },
  { regex: /hover:border-slate-600/g, replacement: 'hover:border-slate-300 dark:hover:border-slate-600' },
  { regex: /hover:border-slate-500/g, replacement: 'hover:border-slate-400 dark:hover:border-slate-500' },
  { regex: /focus:border-slate-600/g, replacement: 'focus:border-indigo-500 dark:focus:border-slate-600' },

  // Text
  // Text white might be tricky if it's on a primary colored button (e.g. bg-indigo-600 text-white)
  // We'll replace text-white only if it's not immediately preceded by bg-indigo, bg-rose, etc.
  // Actually, standard text-white should usually be dark text in light mode UNLESS it's on a colored button.
  // A safer approach is to replace text-white with `text-slate-900 dark:text-white` but maybe skip it in Buttons or manually fix them.
  // We'll replace text-slate-xxx first
  { regex: /text-slate-200/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-400/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-slate-500/g, replacement: 'text-slate-500 dark:text-slate-500' },
  
  // Hover Text
  { regex: /hover:text-slate-300/g, replacement: 'hover:text-slate-900 dark:hover:text-slate-300' },
  { regex: /hover:text-slate-400/g, replacement: 'hover:text-slate-700 dark:hover:text-slate-400' },
  { regex: /hover:text-white/g, replacement: 'hover:text-slate-900 dark:hover:text-white' },

  // Rings / Highlights
  { regex: /ring-slate-700/g, replacement: 'ring-slate-200 dark:ring-slate-700' },
  { regex: /ring-slate-800/g, replacement: 'ring-slate-200 dark:ring-slate-800' },
  { regex: /divide-slate-800/g, replacement: 'divide-slate-200 dark:divide-slate-800' },
  { regex: /divide-slate-700/g, replacement: 'divide-slate-200 dark:divide-slate-700' }
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    // Avoid double-replacing if the script is run multiple times
    // For example, if it already contains `dark:bg-slate-900`, we shouldn't replace `bg-slate-900` again.
    // A quick hack: first temporarily change to a placeholder
    // But since it's a one-off, we'll just check if the class is preceded by `dark:` or `hover:dark:`
    // To do this simply, we'll just replace it globally, then fix the ones that got double darked.
    content = content.replace(regex, replacement);
  });

  // Fix `text-white` specifically for general typography, but we have to be careful
  // We'll replace text-white only if it's NOT inside a button or badge class that sets background
  // Actually, since there are so many, let's just do `text-slate-900 dark:text-white` and then manually fix primary buttons.
  content = content.replace(/(?<!(?:bg-[a-z]+-\d+\s+|from-[a-z]+-\d+\s+|to-[a-z]+-\d+\s+))text-white/g, 'text-slate-900 dark:text-white');

  // Fix the double replacements that might have occurred:
  content = content.replace(/dark:bg-white dark:bg-slate-900/g, 'dark:bg-slate-900');
  content = content.replace(/dark:text-slate-[0-9]+ dark:text-slate-[0-9]+/g, function(match) {
    // return just the second part
    return match.split(' ')[1];
  });
  content = content.replace(/dark:bg-slate-[0-9]+ dark:bg-slate-[0-9]+/g, function(match) {
    return match.split(' ')[1];
  });
  content = content.replace(/dark:border-slate-[0-9]+ dark:border-slate-[0-9]+/g, function(match) {
    return match.split(' ')[1];
  });

  // some general fixes for "dark:text-slate-900 dark:text-white"
  content = content.replace(/dark:text-slate-900 dark:text-white/g, 'dark:text-white');
  content = content.replace(/text-slate-900 dark:text-slate-900 dark:text-white/g, 'text-slate-900 dark:text-white');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
    changedCount++;
  }
});

console.log(`Refactored ${changedCount} files.`);
