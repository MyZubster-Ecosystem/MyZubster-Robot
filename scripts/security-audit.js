#!/usr/bin/env node
/**
 * Security audit script - checks for known vulnerabilities in dependencies.
 * Run: node scripts/security-audit.js
 */
const { execSync } = require('child_process');

console.log('Running npm audit...\n');

try {
  const output = execSync('npm audit --json', { encoding: 'utf-8', timeout: 30000 });
  const audit = JSON.parse(output);
  
  const vulns = audit.vulnerabilities || {};
  const vulnList = Object.entries(vulns);
  
  if (vulnList.length === 0) {
    console.log('✅ No vulnerabilities found!');
    process.exit(0);
  }
  
  console.log(`Found ${vulnList.length} vulnerabilities:\n`);
  
  let critical = 0, high = 0, moderate = 0, low = 0;
  
  for (const [name, info] of vulnList) {
    const severity = info.severity || 'unknown';
    const via = Array.isArray(info.via) ? info.via.map(v => typeof v === 'string' ? v : v.title || v.name).join(', ') : info.via;
    const fixAvailable = info.fixAvailable ? 'YES' : 'NO';
    
    console.log(`[${severity.toUpperCase()}] ${name}`);
    console.log(`  Via: ${via}`);
    console.log(`  Fix available: ${fixAvailable}`);
    console.log(`  Range: ${info.range || 'N/A'}\n`);
    
    if (severity === 'critical') critical++;
    else if (severity === 'high') high++;
    else if (severity === 'moderate') moderate++;
    else if (severity === 'low') low++;
  }
  
  console.log('--- Summary ---');
  console.log(`Critical: ${critical}`);
  console.log(`High: ${high}`);
  console.log(`Moderate: ${moderate}`);
  console.log(`Low: ${low}`);
  
  if (critical > 0 || high > 0) {
    console.log('\n⚠️  Critical or high vulnerabilities found! Run `npm audit fix` to resolve.');
    process.exit(1);
  }
} catch (error) {
  console.error('npm audit failed:', error.message);
  process.exit(1);
}
