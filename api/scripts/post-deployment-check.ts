#!/usr/bin/env node
import { ALERT_TYPES, AlertSeverity } from '@api/constants/alerting';
import { API_PATHS } from '@api/test-utils/api-paths';
import { alertingService } from '@api/services/alerting';

interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const CHECK_TIMEOUT = 10000; // 10 seconds

async function checkEndpoint(path: string, options: RequestInit = {}): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        endpoint: path,
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        endpoint: path,
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      endpoint: path,
      status: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHealth(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Check basic health endpoint
  results.push(await checkEndpoint(API_PATHS.HEALTH));

  // Check readiness
  results.push(await checkEndpoint(API_PATHS.HEALTH_READY));

  // Check liveness
  results.push(await checkEndpoint(API_PATHS.HEALTH_LIVE));

  // Check metrics endpoint
  results.push(await checkEndpoint('/health/metrics'));

  // Check API documentation
  results.push(await checkEndpoint('/documentation'));

  return results;
}

async function checkCriticalEndpoints(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // Check auth endpoints (should return 400 without proper payload)
  const authCheck = await checkEndpoint(API_PATHS.AUTH_MAGIC_LINK_SEND, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  // We expect 400 (bad request) not 500 (server error)
  if (authCheck.error?.includes('500')) {
    authCheck.status = 'unhealthy';
  } else if (authCheck.error?.includes('400') || authCheck.error?.includes('422')) {
    authCheck.status = 'healthy';
    authCheck.error = undefined;
  }

  results.push(authCheck);

  return results;
}

async function runPostDeploymentChecks(): Promise<void> {
  console.log('🔍 Running post-deployment checks...\n');
  console.log(`API URL: ${API_BASE_URL}\n`);

  // Health checks
  console.log('📊 Health Checks:');
  const healthResults = await checkHealth();

  healthResults.forEach((result) => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${icon} ${result.endpoint}${time}${error}`);
  });

  // Critical endpoints
  console.log('\n🔐 Critical Endpoints:');
  const criticalResults = await checkCriticalEndpoints();

  criticalResults.forEach((result) => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${icon} ${result.endpoint}${time}${error}`);
  });

  // Summary
  const allResults = [...healthResults, ...criticalResults];
  const unhealthyCount = allResults.filter((r) => r.status === 'unhealthy').length;
  const unknownCount = allResults.filter((r) => r.status === 'unknown').length;
  const totalCount = allResults.length;
  const healthyCount = totalCount - unhealthyCount - unknownCount;

  console.log('\n📋 Summary:');
  console.log(`✅ Healthy: ${healthyCount}/${totalCount}`);
  if (unknownCount > 0) {
    console.log(`⚠️  Unknown: ${unknownCount}/${totalCount}`);
  }
  if (unhealthyCount > 0) {
    console.log(`❌ Unhealthy: ${unhealthyCount}/${totalCount}`);
  }

  // Calculate average response time
  const responseTimes = allResults
    .filter((r) => r.responseTime !== undefined)
    .map((r) => r.responseTime!);

  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    );
    console.log(`\n⏱️  Average Response Time: ${avgResponseTime}ms`);
  }

  // Send alerts if there are issues
  if (unhealthyCount > 0 || unknownCount > 0) {
    const failedEndpoints = allResults
      .filter((r) => r.status !== 'healthy')
      .map((r) => `${r.endpoint} (${r.error})`)
      .join(', ');

    await alertingService.alert({
      type: ALERT_TYPES.DEPLOYMENT_HEALTH,
      severity: unhealthyCount > 0 ? 'critical' : ('high' as AlertSeverity),
      message: `Post-deployment health check failed: ${unhealthyCount} unhealthy, ${unknownCount} unknown`,
      context: {
        failedEndpoints,
        apiUrl: API_BASE_URL,
        timestamp: new Date().toISOString(),
      },
    });

    // Ensure alerts are sent before exiting
    alertingService.flushQueue();

    console.error('\n❌ Post-deployment checks failed!');
    process.exit(1);
  }

  console.log('\n✅ All post-deployment checks passed!');
}

// Run if called directly
if (require.main === module) {
  runPostDeploymentChecks().catch((error) => {
    console.error('Fatal error during post-deployment checks:', error);
    process.exit(1);
  });
}

export { runPostDeploymentChecks };
