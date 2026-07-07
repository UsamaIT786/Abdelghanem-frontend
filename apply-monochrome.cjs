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
  // Primary Backgrounds
  { regex: /bg-indigo-[567]00/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /bg-purple-[567]00/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /bg-blue-[567]00/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /hover:bg-indigo-[567]00/g, replacement: 'hover:bg-neutral-800 dark:hover:bg-neutral-200' },
  { regex: /hover:bg-purple-[567]00/g, replacement: 'hover:bg-neutral-800 dark:hover:bg-neutral-200' },
  { regex: /hover:bg-blue-[567]00/g, replacement: 'hover:bg-neutral-800 dark:hover:bg-neutral-200' },
  
  // Secondary / Soft Backgrounds
  { regex: /bg-indigo-[51]0/g, replacement: 'bg-neutral-100 dark:bg-neutral-900' },
  { regex: /bg-purple-[51]0/g, replacement: 'bg-neutral-100 dark:bg-neutral-900' },
  { regex: /bg-blue-[51]0/g, replacement: 'bg-neutral-100 dark:bg-neutral-900' },
  { regex: /bg-indigo-[12]00/g, replacement: 'bg-neutral-200 dark:bg-neutral-800' },
  { regex: /bg-purple-[12]00/g, replacement: 'bg-neutral-200 dark:bg-neutral-800' },
  { regex: /bg-blue-[12]00/g, replacement: 'bg-neutral-200 dark:bg-neutral-800' },

  // Text Colors
  { regex: /text-indigo-[567]00/g, replacement: 'text-black dark:text-white' },
  { regex: /text-purple-[567]00/g, replacement: 'text-black dark:text-white' },
  { regex: /text-blue-[567]00/g, replacement: 'text-black dark:text-white' },
  { regex: /hover:text-indigo-[567]00/g, replacement: 'hover:text-neutral-600 dark:hover:text-neutral-300' },
  { regex: /hover:text-purple-[567]00/g, replacement: 'hover:text-neutral-600 dark:hover:text-neutral-300' },
  
  // Border Colors
  { regex: /border-indigo-[23]00/g, replacement: 'border-neutral-200 dark:border-neutral-700' },
  { regex: /border-indigo-[567]00/g, replacement: 'border-black dark:border-white' },
  { regex: /border-purple-[567]00/g, replacement: 'border-black dark:border-white' },
  { regex: /border-blue-[567]00/g, replacement: 'border-black dark:border-white' },
  { regex: /hover:border-indigo-[567]00/g, replacement: 'hover:border-neutral-800 dark:hover:border-neutral-200' },
  { regex: /focus:border-indigo-[567]00/g, replacement: 'focus:border-black dark:focus:border-white' },

  // Ring Colors
  { regex: /ring-indigo-[567]00/g, replacement: 'ring-black dark:ring-white' },
  { regex: /focus:ring-indigo-[567]00/g, replacement: 'focus:ring-black dark:focus:ring-white' },

  // Gradients
  { regex: /bg-gradient-to-[a-z]+/g, replacement: '' }, // Just remove it, fallback to default bg or other classes will apply
  { regex: /from-indigo-[0-9]{2,3}/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' }, 
  { regex: /from-purple-[0-9]{2,3}/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /from-blue-[0-9]{2,3}/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /to-blue-[0-9]{2,3}/g, replacement: '' },
  { regex: /to-indigo-[0-9]{2,3}/g, replacement: '' },
  { regex: /to-purple-[0-9]{2,3}/g, replacement: '' },
  { regex: /via-indigo-[0-9]{2,3}/g, replacement: '' },
  { regex: /via-purple-[0-9]{2,3}/g, replacement: '' },
  { regex: /bg-clip-text/g, replacement: '' },
  { regex: /text-transparent/g, replacement: '' },

  // Shadows
  { regex: /shadow-indigo-[567]00\/[0-9]{2}/g, replacement: 'shadow-black/5 dark:shadow-white/5' }
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  // Clean up extra spaces inside className=" ... "
  content = content.replace(/className="([^"]+)"/g, function(match, classes) {
    return 'className="' + classes.replace(/\s{2,}/g, ' ').trim() + '"';
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
    changedCount++;
  }
});

console.log(`Refactored ${changedCount} files.`);
