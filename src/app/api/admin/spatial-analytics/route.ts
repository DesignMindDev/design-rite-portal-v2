import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AIPerformanceMetrics {
  totalAnalyses: number;
  successRate: number;
  avgExecutionTime: number;
  failureRate: number;
  retryRate: number;
  operationBreakdown: Record<string, {
    count: number;
    avgTime: number;
    successCount: number;
    failureCount: number;
  }>;
}

interface ProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  pendingProjects: number;
  failedProjects: number;
  avgAnalysisTime: number;
  projectsByStatus: Record<string, number>;
}

interface TimeSeriesData {
  date: string;
  projects: number;
  analyses: number;
  failures: number;
  avgExecutionTime: number;
}

interface ErrorAnalysis {
  errorType: string;
  count: number;
  percentage: number;
  examples: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }

    // Fetch spatial projects
    const { data: projects, error: projectsError } = await supabase
      .from('spatial_projects')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (projectsError) {
      console.error('Error fetching spatial projects:', projectsError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Fetch AI analysis debug logs
    const { data: debugLogs, error: debugError } = await supabase
      .from('ai_analysis_debug')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (debugError) {
      console.error('Error fetching debug logs:', debugError);
      // Continue without debug logs - they may not exist yet
    }

    const projectData = (projects || []) as any[];
    const debugData = (debugLogs || []) as any[];

    // Calculate project metrics
    const projectMetrics = calculateProjectMetrics(projectData);

    // Calculate AI performance metrics
    const aiPerformance = calculateAIPerformance(debugData);

    // Analyze errors
    const errorAnalysis = analyzeErrors(debugData);

    // Generate time series data
    const timeSeriesData = generateTimeSeriesData(projectData, debugData, timeRange);

    // Get recent projects with analysis status
    const recentProjects = projectData.slice(-10).reverse().map(p => ({
      id: p.id,
      project_name: p.project_name,
      customer_id: p.customer_id,
      analysis_status: p.analysis_status || 'pending',
      created_at: p.created_at,
      analysis_completed_at: p.analysis_completed_at,
      analysis_error: p.analysis_error,
      execution_time: p.analysis_completed_at && p.analysis_started_at
        ? Math.round((new Date(p.analysis_completed_at).getTime() - new Date(p.analysis_started_at).getTime()) / 1000)
        : null
    }));

    // Get recent AI operations
    const recentOperations = debugData.slice(-20).reverse().map(log => ({
      id: log.id,
      project_id: log.project_id,
      operation: log.operation,
      success: !log.error_message,
      execution_time_ms: log.execution_time_ms,
      error_message: log.error_message,
      created_at: log.created_at
    }));

    return NextResponse.json({
      projectMetrics,
      aiPerformance,
      errorAnalysis,
      timeSeriesData,
      recentProjects,
      recentOperations
    });

  } catch (error) {
    console.error('Spatial analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateProjectMetrics(projects: any[]): ProjectMetrics {
  const total = projects.length;

  const statusCounts = projects.reduce((acc, project) => {
    const status = project.analysis_status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completed = statusCounts['completed'] || 0;
  const pending = statusCounts['pending'] || 0;
  const failed = statusCounts['failed'] || 0;

  // Calculate average analysis time for completed projects
  const completedProjects = projects.filter(p => p.analysis_status === 'completed');
  let avgAnalysisTime = 0;
  if (completedProjects.length > 0) {
    const totalTime = completedProjects.reduce((sum, p) => {
      if (p.analysis_started_at && p.analysis_completed_at) {
        const duration = new Date(p.analysis_completed_at).getTime() - new Date(p.analysis_started_at).getTime();
        return sum + duration;
      }
      return sum;
    }, 0);
    avgAnalysisTime = Math.round(totalTime / completedProjects.length / 1000); // Convert to seconds
  }

  return {
    totalProjects: total,
    completedProjects: completed,
    pendingProjects: pending,
    failedProjects: failed,
    avgAnalysisTime,
    projectsByStatus: statusCounts
  };
}

function calculateAIPerformance(debugLogs: any[]): AIPerformanceMetrics {
  const total = debugLogs.length;

  if (total === 0) {
    return {
      totalAnalyses: 0,
      successRate: 0,
      avgExecutionTime: 0,
      failureRate: 0,
      retryRate: 0,
      operationBreakdown: {}
    };
  }

  // Count successes and failures
  const successes = debugLogs.filter(log => !log.error_message).length;
  const failures = debugLogs.filter(log => log.error_message).length;
  const successRate = Math.round((successes / total) * 100);
  const failureRate = Math.round((failures / total) * 100);

  // Calculate retry rate (operations with same project_id and operation type)
  const operationKeys = debugLogs.map(log => `${log.project_id}_${log.operation}`);
  const uniqueOperations = new Set(operationKeys).size;
  const retryRate = total > uniqueOperations ? Math.round(((total - uniqueOperations) / total) * 100) : 0;

  // Calculate average execution time
  const totalExecutionTime = debugLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0);
  const avgExecutionTime = Math.round(totalExecutionTime / total);

  // Break down by operation type
  const operationBreakdown: Record<string, {
    count: number;
    avgTime: number;
    successCount: number;
    failureCount: number;
  }> = {};

  debugLogs.forEach(log => {
    const operation = log.operation;
    if (!operationBreakdown[operation]) {
      operationBreakdown[operation] = {
        count: 0,
        avgTime: 0,
        successCount: 0,
        failureCount: 0
      };
    }

    operationBreakdown[operation].count++;
    operationBreakdown[operation].avgTime += log.execution_time_ms || 0;
    if (log.error_message) {
      operationBreakdown[operation].failureCount++;
    } else {
      operationBreakdown[operation].successCount++;
    }
  });

  // Calculate averages
  Object.keys(operationBreakdown).forEach(operation => {
    const data = operationBreakdown[operation];
    data.avgTime = Math.round(data.avgTime / data.count);
  });

  return {
    totalAnalyses: total,
    successRate,
    avgExecutionTime,
    failureRate,
    retryRate,
    operationBreakdown
  };
}

function analyzeErrors(debugLogs: any[]): ErrorAnalysis[] {
  const errorLogs = debugLogs.filter(log => log.error_message);
  const total = errorLogs.length;

  if (total === 0) return [];

  // Group errors by type
  const errorGroups: Record<string, { count: number; examples: string[] }> = {};

  errorLogs.forEach(log => {
    const errorMsg = log.error_message || 'Unknown error';

    // Categorize error types
    let errorType = 'Other';
    if (errorMsg.toLowerCase().includes('timeout')) {
      errorType = 'Timeout';
    } else if (errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('429')) {
      errorType = 'Rate Limit';
    } else if (errorMsg.toLowerCase().includes('authentication') || errorMsg.toLowerCase().includes('401')) {
      errorType = 'Authentication';
    } else if (errorMsg.toLowerCase().includes('parsing') || errorMsg.toLowerCase().includes('json')) {
      errorType = 'Parsing Error';
    } else if (errorMsg.toLowerCase().includes('openai') || errorMsg.toLowerCase().includes('api')) {
      errorType = 'API Error';
    } else if (errorMsg.toLowerCase().includes('file') || errorMsg.toLowerCase().includes('upload')) {
      errorType = 'File Error';
    }

    if (!errorGroups[errorType]) {
      errorGroups[errorType] = { count: 0, examples: [] };
    }

    errorGroups[errorType].count++;
    if (errorGroups[errorType].examples.length < 3) {
      errorGroups[errorType].examples.push(errorMsg.substring(0, 100));
    }
  });

  return Object.entries(errorGroups)
    .map(([errorType, data]) => ({
      errorType,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      examples: data.examples
    }))
    .sort((a, b) => b.count - a.count);
}

function generateTimeSeriesData(projects: any[], debugLogs: any[], timeRange: string): TimeSeriesData[] {
  const dataPoints: Record<string, {
    projects: number;
    analyses: number;
    failures: number;
    totalExecutionTime: number;
    analysisCount: number;
  }> = {};

  // Determine date format based on time range
  const dateFormat = timeRange === '24h' ? 'hour' : 'day';

  // Process projects
  projects.forEach(project => {
    const date = new Date(project.created_at);
    let key: string;

    if (dateFormat === 'hour') {
      key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    } else {
      key = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    if (!dataPoints[key]) {
      dataPoints[key] = {
        projects: 0,
        analyses: 0,
        failures: 0,
        totalExecutionTime: 0,
        analysisCount: 0
      };
    }

    dataPoints[key].projects++;
  });

  // Process debug logs
  debugLogs.forEach(log => {
    const date = new Date(log.created_at);
    let key: string;

    if (dateFormat === 'hour') {
      key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    } else {
      key = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    if (!dataPoints[key]) {
      dataPoints[key] = {
        projects: 0,
        analyses: 0,
        failures: 0,
        totalExecutionTime: 0,
        analysisCount: 0
      };
    }

    dataPoints[key].analyses++;
    if (log.error_message) {
      dataPoints[key].failures++;
    }
    dataPoints[key].totalExecutionTime += log.execution_time_ms || 0;
    dataPoints[key].analysisCount++;
  });

  return Object.entries(dataPoints)
    .map(([date, data]) => ({
      date,
      projects: data.projects,
      analyses: data.analyses,
      failures: data.failures,
      avgExecutionTime: data.analysisCount > 0 ? Math.round(data.totalExecutionTime / data.analysisCount) : 0
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
}
