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

function renameWithRetry(src, dest, retries = 5, delay = 200) {
  for (let i = 0; i < retries; i++) {
    try {
      fs.renameSync(src, dest);
      return;
    } catch (err) {
      if (err.code === 'EPERM' && i < retries - 1) {
        console.warn(`Rename EPERM warning, retrying in ${delay}ms... (${i + 1}/${retries})`);
        const start = Date.now();
        while (Date.now() - start < delay) {}
      } else {
        throw err;
      }
    }
  }
}

try {
  const nextDir = path.join(__dirname, '../.next');
  if (fs.existsSync(nextDir)) {
    console.log('Cleaning .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
  }

  if (fs.existsSync(appApiDir)) {
    console.log('Moving api directory to backup...');
    renameWithRetry(appApiDir, backupApiDir);
    apiMoved = true;
  }

  if (fs.existsSync(appAuthDir)) {
    console.log('Moving auth callback directory to backup...');
    renameWithRetry(appAuthDir, backupAuthDir);
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
      renameWithRetry(backupApiDir, appApiDir);
      console.log('API directory restored successfully.');
    } catch (restoreError) {
      console.error('CRITICAL: Failed to restore API directory:', restoreError);
    }
  }

  if (authMoved) {
    console.log('Restoring auth callback directory from backup...');
    try {
      renameWithRetry(backupAuthDir, appAuthDir);
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
