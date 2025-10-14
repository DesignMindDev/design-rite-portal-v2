'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Cpu, AlertTriangle, CheckCircle, Clock, TrendingUp,
  RefreshCw, ArrowLeft, Zap, XCircle, Activity
} from 'lucide-react';
import MetricCard from '../../components/dashboard/MetricCard';
import TimeSeriesChart from '../../components/dashboard/TimeSeriesChart';

interface ProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  pendingProjects: number;
  failedProjects: number;
  avgAnalysisTime: number;
  projectsByStatus: Record<string, number>;
}

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

interface ErrorAnalysis {
  errorType: string;
  count: number;
  percentage: number;
  examples: string[];
}

interface TimeSeriesData {
  date: string;
  projects: number;
  analyses: number;
  failures: number;
  avgExecutionTime: number;
}

interface RecentProject {
  id: string;
  project_name: string;
  customer_id: string;
  analysis_status: string;
  created_at: string;
  analysis_completed_at: string | null;
  analysis_error: string | null;
  execution_time: number | null;
}

interface RecentOperation {
  id: string;
  project_id: string;
  operation: string;
  success: boolean;
  execution_time_ms: number;
  error_message: string | null;
  created_at: string;
}

interface AnalyticsData {
  projectMetrics: ProjectMetrics;
  aiPerformance: AIPerformanceMetrics;
  errorAnalysis: ErrorAnalysis[];
  timeSeriesData: TimeSeriesData[];
  recentProjects: RecentProject[];
  recentOperations: RecentOperation[];
}

export default function SpatialStudioAdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorAnalysis | null>(null);

  const timeRangeLabels = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/spatial-analytics?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Spatial analytics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Box className="w-8 h-8 text-purple-600" />
              Spatial Studio Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              3D floor plan AI analysis performance and debugging
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-white rounded-lg border border-gray-300 p-1">
              {(['24h', '7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Failed to load analytics</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading or Content */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Project Overview Metrics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total Projects"
                value={data.projectMetrics.totalProjects}
                icon={<Box className="w-6 h-6" />}
                color="blue"
                description={timeRangeLabels[timeRange]}
              />
              <MetricCard
                title="Completed"
                value={data.projectMetrics.completedProjects}
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
              />
              <MetricCard
                title="Pending"
                value={data.projectMetrics.pendingProjects}
                icon={<Clock className="w-6 h-6" />}
                color="yellow"
              />
              <MetricCard
                title="Failed"
                value={data.projectMetrics.failedProjects}
                icon={<XCircle className="w-6 h-6" />}
                color="red"
              />
              <MetricCard
                title="Avg Analysis Time"
                value={formatDuration(data.projectMetrics.avgAnalysisTime)}
                icon={<Activity className="w-6 h-6" />}
                color="purple"
                description="Per project"
              />
            </div>
          </section>

          {/* AI Performance Metrics */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total AI Analyses"
                value={data.aiPerformance.totalAnalyses}
                icon={<Cpu className="w-6 h-6" />}
                color="blue"
              />
              <MetricCard
                title="Success Rate"
                value={`${data.aiPerformance.successRate}%`}
                icon={<CheckCircle className="w-6 h-6" />}
                color={data.aiPerformance.successRate > 90 ? 'green' : data.aiPerformance.successRate > 75 ? 'yellow' : 'red'}
                description={data.aiPerformance.successRate > 90 ? 'Excellent' : data.aiPerformance.successRate > 75 ? 'Good' : 'Needs attention'}
              />
              <MetricCard
                title="Failure Rate"
                value={`${data.aiPerformance.failureRate}%`}
                icon={<XCircle className="w-6 h-6" />}
                color={data.aiPerformance.failureRate < 10 ? 'green' : data.aiPerformance.failureRate < 25 ? 'yellow' : 'red'}
              />
              <MetricCard
                title="Retry Rate"
                value={`${data.aiPerformance.retryRate}%`}
                icon={<RefreshCw className="w-6 h-6" />}
                color={data.aiPerformance.retryRate < 15 ? 'green' : 'yellow'}
              />
              <MetricCard
                title="Avg Execution Time"
                value={`${data.aiPerformance.avgExecutionTime}ms`}
                icon={<Zap className="w-6 h-6" />}
                color="purple"
              />
            </div>
          </section>

          {/* Time Series Chart */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Over Time</h2>
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
              <TimeSeriesChart
                data={data.timeSeriesData}
                xKey="date"
                yKeys={['projects', 'analyses', 'failures']}
                colors={['#3B82F6', '#9333EA', '#EF4444']}
                height={300}
              />
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-sm text-gray-600">Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-sm text-gray-600">AI Analyses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm text-gray-600">Failures</span>
                </div>
              </div>
            </div>
          </section>

          {/* Operation Breakdown & Error Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operation Breakdown */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Operation Breakdown</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                {Object.entries(data.aiPerformance.operationBreakdown).map(([operation, stats]) => (
                  <div key={operation} className="pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-purple-600" />
                        {operation}
                      </h3>
                      <span className="text-sm font-medium text-purple-600">
                        {stats.count} ops
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Success:</span>
                        <span className="ml-2 font-medium text-green-600">{stats.successCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">{stats.failureCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Time:</span>
                        <span className="ml-2 font-medium">{stats.avgTime}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <span className="ml-2 font-medium">
                          {Math.round((stats.successCount / stats.count) * 100)}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(stats.successCount / stats.count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Error Analysis */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Error Analysis</h2>
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-3">
                {data.errorAnalysis.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">No errors in this time period!</p>
                  </div>
                ) : (
                  data.errorAnalysis.map((error) => (
                    <div
                      key={error.errorType}
                      className="pb-3 border-b border-gray-200 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          {error.errorType}
                        </h3>
                        <span className="text-sm font-medium text-red-600">
                          {error.count} ({error.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${error.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Recent Projects */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Projects</h2>
            <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentProjects.map((project, index) => (
                    <tr key={project.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {project.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.customer_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.analysis_status)}`}>
                          {project.analysis_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.execution_time ? `${project.execution_time}s` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(project.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent Operations Log */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent AI Operations</h2>
            <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Execution Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Error
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recentOperations.map((op, index) => (
                    <tr key={op.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {op.operation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {op.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {op.execution_time_ms}ms
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {op.error_message || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(op.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {/* Error Examples Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedError.errorType}</h2>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedError.count} occurrences ({selectedError.percentage}%)
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Example Errors:</h3>
              <div className="space-y-3">
                {selectedError.examples.map((example, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 p-3 rounded">
                    <p className="text-gray-900 text-sm font-mono">{example}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
