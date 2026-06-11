const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appApiDir = path.join(__dirname, '../src/app/api');
const backupApiDir = path.join(__dirname, '../src/api_backup');
const appAuthDir = path.join(__dirname, '../src/app/auth');
const backupAuthDir = path.join(__dirname, '../src/auth_backup');

console.log('--- Starting Mobile Build Script ---');

let apiMoved = false;
let authMoved = false;

try {
  const nextDir = path.join(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    console.log('Cleaning .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
  }

  if (fs.existsSync(appApiDir)) {
    console.log('Moving api directory to backup...');
    fs.renameSync(appApiDir, backupApiDir);
    apiMoved = true;
  }

  if (fs.existsSync(appAuthDir)) {
    console.log('Moving auth callback directory to backup...');
    fs.renameSync(appAuthDir, backupAuthDir);
    authMoved = true;
  }

  console.log('Running: cross-env EXPORT_MOBILE=true next build');
  execSync('npx cross-env EXPORT_MOBILE=true next build', { stdio: 'inherit' });

} catch (error) {
  console.error('Build failed:', error);
  process.exitCode = 1;
} finally {
  if (apiMoved) {
    console.log('Restoring api directory from backup...');
    try {
      fs.renameSync(backupApiDir, appApiDir);
      console.log('API directory restored successfully.');
    } catch (restoreError) {
      console.error('CRITICAL: Failed to restore API directory:', restoreError);
    }
  }

  if (authMoved) {
    console.log('Restoring auth callback directory from backup...');
    try {
      fs.renameSync(backupAuthDir, appAuthDir);
      console.log('Auth directory restored successfully.');
    } catch (restoreError) {
      console.error('CRITICAL: Failed to restore Auth directory:', restoreError);
    }
  }
}

if (process.exitCode !== 1) {
  try {
    console.log('Running: npx cap sync');
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log('Mobile build and sync completed successfully!');
  } catch (syncError) {
    console.error('Capacitor sync failed:', syncError);
    process.exitCode = 1;
  }
}
