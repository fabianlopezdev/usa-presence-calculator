#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  warning?: boolean;
}

const checks: CheckResult[] = [];

function runCheck(name: string, fn: () => void, warning = false): void {
  try {
    console.log(`Checking ${name}...`);
    fn();
    checks.push({ name, passed: true, message: 'OK', warning });
    console.log(`✅ ${name}: OK`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    checks.push({ name, passed: false, message, warning });
    console.error(`${warning ? '⚠️' : '❌'} ${name}: ${message}`);
  }
}

function checkEnvironmentVariables(): void {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!existsSync(envExamplePath)) {
    throw new Error('.env.example file not found');
  }

  const envExample = readFileSync(envExamplePath, 'utf-8');
  const requiredVars = envExample
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean);

  if (!existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const env = readFileSync(envPath, 'utf-8');
  const definedVars = new Set(
    env
      .split('\n')
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split('=')[0].trim())
      .filter(Boolean),
  );

  const missingVars = requiredVars.filter((varName) => !definedVars.has(varName));

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
}

function checkDatabaseMigrations(): void {
  try {
    const output = execSync('pnpm db:status', { encoding: 'utf-8' });
    if (output.includes('pending')) {
      throw new Error('Database has pending migrations');
    }
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 1) {
      throw new Error('Database migrations check failed');
    }
    throw error;
  }
}

function checkTypeScript(): void {
  try {
    execSync('pnpm typecheck', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('TypeScript errors found');
  }
}

function checkLinting(): void {
  try {
    execSync('pnpm lint', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('ESLint errors found');
  }
}

function checkTests(): void {
  try {
    execSync('pnpm test:ci', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Tests failed');
  }
}

function checkDependencies(): void {
  try {
    const output = execSync('pnpm ls --depth=0', { encoding: 'utf-8' });
    if (output.includes('UNMET')) {
      throw new Error('Unmet peer dependencies found');
    }
  } catch (error) {
    throw new Error('Dependency check failed');
  }
}

function checkBuild(): void {
  try {
    execSync('pnpm build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Build failed');
  }
}

function checkDiskSpace(): void {
  try {
    const output = execSync('df -h .', { encoding: 'utf-8' });
    const lines = output.split('\n');
    const dataLine = lines[1];
    const match = dataLine.match(/(\d+)%/);

    if (match) {
      const usagePercent = parseInt(match[1], 10);
      if (usagePercent > 90) {
        throw new Error(`Disk usage is at ${usagePercent}%`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Disk usage')) {
      throw error;
    }
    // Ignore df command errors on different platforms
  }
}

function runPreDeploymentChecks(): void {
  console.log('🚀 Running pre-deployment checks...\n');

  // Critical checks
  runCheck('Environment Variables', checkEnvironmentVariables);
  runCheck('Database Migrations', checkDatabaseMigrations);
  runCheck('TypeScript Compilation', checkTypeScript);
  runCheck('ESLint', checkLinting);
  runCheck('Tests', checkTests);
  runCheck('Dependencies', checkDependencies);
  runCheck('Build', checkBuild);

  // Warning checks
  runCheck('Disk Space', checkDiskSpace, true);

  console.log('\n📋 Summary:');
  const failures = checks.filter((c) => !c.passed && !c.warning);
  const warnings = checks.filter((c) => !c.passed && c.warning);
  const passed = checks.filter((c) => c.passed);

  if (passed.length > 0) {
    console.log(`✅ Passed: ${passed.length}`);
  }
  if (warnings.length > 0) {
    console.log(`⚠️  Warnings: ${warnings.length}`);
    warnings.forEach((w) => console.log(`   - ${w.name}: ${w.message}`));
  }
  if (failures.length > 0) {
    console.log(`❌ Failed: ${failures.length}`);
    failures.forEach((f) => console.log(`   - ${f.name}: ${f.message}`));
  }

  if (failures.length > 0) {
    console.error('\n❌ Pre-deployment checks failed!');
    process.exit(1);
  }

  console.log('\n✅ All critical pre-deployment checks passed!');
  if (warnings.length > 0) {
    console.log('⚠️  Please review warnings before deploying.');
  }
}

// Run if called directly
if (require.main === module) {
  runPreDeploymentChecks();
}

export { runPreDeploymentChecks };
