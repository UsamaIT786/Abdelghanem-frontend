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
  // Hex color class replacements for strict monochrome
  // Backgrounds
  { regex: /bg-\[#4F46E5\]\/[0-9]+/g, replacement: 'bg-neutral-200 dark:bg-neutral-800' },
  { regex: /bg-\[#06B6D4\]\/[0-9]+/g, replacement: 'bg-neutral-200 dark:bg-neutral-800' },
  { regex: /bg-\[#4F46E5\]/g, replacement: 'bg-black dark:bg-white' },
  { regex: /bg-\[#06B6D4\]/g, replacement: 'bg-black dark:bg-white' },
  { regex: /from-\[#4F46E5\]\/[0-9]+/g, replacement: 'bg-neutral-100 dark:bg-neutral-900' },
  { regex: /from-\[#4F46E5\] to-\[#06B6D4\]/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /to-\[#06B6D4\]\/[0-9]+/g, replacement: '' },
  { regex: /from-\[#4F46E5\]/g, replacement: 'bg-black dark:bg-white text-white dark:text-black' },
  { regex: /to-\[#06B6D4\]/g, replacement: '' },

  // Text
  { regex: /text-\[#4F46E5\]/g, replacement: 'text-black dark:text-white' },
  { regex: /text-\[#4338CA\]/g, replacement: 'text-black dark:text-white' },
  { regex: /text-\[#06B6D4\]/g, replacement: 'text-black dark:text-white' },
  { regex: /hover:text-\[#4F46E5\]/g, replacement: 'hover:text-neutral-700 dark:hover:text-neutral-300' },
  { regex: /hover:text-\[#4338CA\]/g, replacement: 'hover:text-neutral-700 dark:hover:text-neutral-300' },

  // Borders & Rings
  { regex: /border-\[#4F46E5\]\/[0-9]+/g, replacement: 'border-neutral-300 dark:border-neutral-700' },
  { regex: /border-\[#4F46E5\]/g, replacement: 'border-black dark:border-white' },
  { regex: /border-\[#06B6D4\]/g, replacement: 'border-black dark:border-white' },
  { regex: /ring-\[#4F46E5\]/g, replacement: 'ring-black dark:ring-white' },
  { regex: /ring-\[#06B6D4\]/g, replacement: 'ring-black dark:ring-white' },
  { regex: /hover:shadow-\[#4F46E5\]\/[0-9]+/g, replacement: 'hover:shadow-neutral-400 dark:hover:shadow-neutral-600' },
  
  // Custom Gradients in Login Screen
  { regex: /bg-\[radial-gradient\(#4F46E5_1px,transparent_1px\)\]/g, replacement: 'bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)]' }
];

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
    changedCount++;
  }
});

console.log(`Refactored ${changedCount} files.`);
