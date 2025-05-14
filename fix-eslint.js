#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running ESLint fix script...');

try {
  // Run ESLint with --fix option to automatically fix some issues
  console.log('Attempting to automatically fix issues...');
  execSync('npx eslint --fix "**/*.{ts,tsx}"', { stdio: 'inherit' });
  console.log('ESLint fix complete.');
} catch (error) {
  console.error('Error running ESLint fix:', error);
} 