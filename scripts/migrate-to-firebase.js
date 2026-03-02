#!/usr/bin/env node

/**
 * Supabase to Firebase Migration Script
 * 
 * This script systematically converts all Supabase references to Firebase equivalents
 * Usage: node scripts/migrate-to-firebase.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = 'src';
const FILE_PATTERNS = [
  // Files that typically import from @lib/supabase
  { pattern: /import.*supabase.*from.*@lib\/supabase/g, replacement: 'import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from \'@lib/firebase\';' },
  { pattern: /import.*supabase.*from.*\.\.\/supabase/g, replacement: 'import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from \'../lib/firebase\';' },
  { pattern: /import.*supabase.*from.*\.\.\/\.\.\/lib\/supabase/g, replacement: 'import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from \'../../lib/firebase\';' },
  
  // API patterns to replace
  { pattern: /supabase\.from\(/g, replacement: 'collection(db, `' },
  { pattern: /supabase\.select\(/g, replacement: 'getDocs(query(collection(db, `' },
  { pattern: /supabase\.insert\(/g, replacement: 'addDoc(collection(db, `' },
  { pattern: /supabase\.update\(/g, replacement: 'updateDoc(doc(db, `' },
  { pattern: /supabase\.delete\(/g, replacement: 'deleteDoc(doc(db, `' },
  { pattern: /supabase\.eq\(/g, replacement: 'where(' },
  { pattern: /supabase\.neq\(/g, replacement: 'where(' },
  { pattern: /supabase\.in\(/g, replacement: 'where(' },
  { pattern: /supabase\.order\(/g, replacement: 'orderBy(' },
  { pattern: /supabase\.limit\(/g, replacement: 'limit(' },
  { pattern: /supabase\.ilike\(/g, replacement: 'where(' },
  { pattern: /supabase\.not\(/g, replacement: 'where(' },
  { pattern: /supabase\.is\(/g, replacement: 'where(' },
  { pattern: /supabase\.single\(/g, replacement: 'limit(1)' },
  { pattern: /supabase\.storage\.from\(/g, replacement: 'ref(storage, `' },
  { pattern: /supabase\.storage\.upload\(/g, replacement: 'uploadBytes(ref(storage, `' },
  { pattern: /supabase\.storage\.delete\(/g, replacement: 'deleteObject(ref(storage, `' },
  { pattern: /supabase\.storage\.list\(/g, replacement: 'ref(storage, `' },
  { pattern: /supabase\.storage\.getDownloadURL\(/g, replacement: 'getDownloadURL(ref(storage, `' },
  { pattern: /supabase\.functions\.invoke\(/g, replacement: 'httpsCallable(' }
];

function findFiles(dir, pattern) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  
  // Apply each pattern
  for (const { pattern, replacement } of FILE_PATTERNS) {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      modified = content.replace(regex, replacement);
      console.log(`  Applied: ${pattern} → ${replacement}`);
    }
  }
  
  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔄 Starting Supabase to Firebase migration...');
  
  const files = findFiles(SRC_DIR, /\.(ts|tsx|js|jsx|ts)$/);
  let processedCount = 0;
  
  for (const file of files) {
    if (processFile(file)) {
      processedCount++;
    }
  }
  
  console.log(`✅ Migration complete! Processed ${processedCount} files`);
  
  if (processedCount > 0) {
    console.log('\n📋 Summary of changes:');
    console.log('- Replaced all @lib/supabase imports with Firebase equivalents');
    console.log('- Converted Supabase API calls to Firebase equivalents');
    console.log('\n🎯 Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Test the application');
    console.log('3. Fix any remaining type issues manually');
  } else {
    console.log('No files needed processing');
  }
}

main();
