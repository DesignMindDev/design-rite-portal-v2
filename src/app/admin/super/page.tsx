'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Shield, Activity, TrendingUp, ArrowLeft, RefreshCw, Edit, Key, Trash2, X, Save, DollarSign, Cpu, Clock, AlertCircle, CheckCircle, Box, MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import MetricCard from '@/components/dashboard/MetricCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import FunnelChart from '@/components/dashboard/FunnelChart';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company: string;
  created_at: string;
  last_login: string | null;
  status: string;
}

interface OperationsData {
  realtime: {
    activeSessions: number;
    todayLeads: number;
    todayDemos: number;
    todayProjects: number;
    aiApiCalls: number;
  };
  systemHealth: {
    apiResponseTime: number;
    errorRate: number;
    uploadSuccessRate: number;
    totalApiCalls: number;
    totalErrors: number;
  };
  userEngagement: {
    activeUsers: number;
    totalSessions: number;
    avgSessionDuration: number;
    avgMessagesPerSession: number;
    toolUsageRate: number;
    totalWebEvents: number;
  };
  revenue: {
    mrr: number;
    trialStarts: number;
    conversions: number;
    conversionRate: number;
    averageRevenuePerCustomer: number;
  };
  aiPerformance: {
    totalApiCalls: number;
    operationStats: Record<string, { total: number; success: number; avgTime: number }>;
    providerBreakdown: Record<string, number>;
    estimatedCost: number;
  };
  leadPipeline: {
    totalLeads: number;
    statusBreakdown: Record<string, number>;
    gradeBreakdown: Record<string, number>;
    funnel: {
      leads: number;
      demosBooked: number;
      demosBookedRate: number;
      trialsStarted: number;
      trialsStartedRate: number;
      customers: number;
      customersRate: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export default function UserManagementPage() {
  const { user, loading: authLoading, userRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    employees: 0,
    customers: 0,
    activeToday: 0
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Operations dashboard state
  const [operationsData, setOperationsData] = useState<OperationsData | null>(null);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsExpanded, setOperationsExpanded] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Check if user is super_admin
  const isSuperAdmin = userRole?.role === 'super_admin';

  // Debug logging
  useEffect(() => {
    console.log('[UserManagement] Auth state:', {
      authLoading,
      user: user?.email,
      userRole: userRole?.role,
      isSuperAdmin
    });
  }, [authLoading, user, userRole, isSuperAdmin]);

  // Redirect if not super_admin - but ONLY after role is loaded
  useEffect(() => {
    // Wait for both auth and role to finish loading
    if (!authLoading && userRole) {
      if (!user || !isSuperAdmin) {
        console.log('[UserManagement] ⚠️ ACCESS DENIED:', {
          user: user?.email,
          userRole: userRole?.role,
          isSuperAdmin,
          redirecting: 'to /dashboard'
        });
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, isSuperAdmin, userRole, router]);

  // Fetch users
  useEffect(() => {
    if (user && isSuperAdmin) {
      fetchUsers();
      fetchOperationsData();
    }
  }, [user, isSuperAdmin]);

  // Fetch operations data when time range changes
  useEffect(() => {
    if (user && isSuperAdmin && operationsExpanded) {
      fetchOperationsData();
    }
  }, [timeRange]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get the authenticated session
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('[UserManagement] No session found');
        toast.error('Session expired. Please sign in again.');
        return;
      }

      console.log('[UserManagement] Fetching users via API...');

      // Call the admin users API endpoint
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const result = await response.json();

      console.log('[UserManagement] API response:', {
        usersCount: result.users?.length || 0,
        stats: result.stats
      });

      setUsers(result.users || []);
      setStats(result.stats || {
        totalUsers: 0,
        employees: 0,
        customers: 0,
        activeToday: 0
      });

    } catch (error) {
      console.error('[UserManagement] Unexpected error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationsData = async () => {
    try {
      setOperationsLoading(true);
      const response = await fetch(`/api/admin/operations?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error('Failed to fetch operations data');
      }

      const result = await response.json();
      setOperationsData(result);
    } catch (error) {
      console.error('[Operations] Load error:', error);
      toast.error('Failed to load operations data');
    } finally {
      setOperationsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'developer':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'contractor':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'user':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const { supabase } = await import('@/lib/supabase');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          company: editingUser.company
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: editingUser.role })
        .eq('user_id', editingUser.id);

      if (roleError) throw roleError;

      toast.success('User updated successfully!');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleModulePermissions = (userId: string) => {
    setSelectedUserId(userId);
    setShowModuleModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      // Call admin API to delete user
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Show loading while auth or role is loading
  if (authLoading || !userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    );
  }

  // Only render if user is super_admin
  if (!user || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Mission Control
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage employees and customers</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all disabled:opacity-50"
                title="Refresh user list"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/admin/super/create-user"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-5 h-5" />
                Create New User
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Operations Dashboard Section */}
        <div className="mb-8">
          <button
            onClick={() => setOperationsExpanded(!operationsExpanded)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 shadow-lg transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8" />
              <div className="text-left">
                <h2 className="text-2xl font-bold">Operations Dashboard</h2>
                <p className="text-blue-100 text-sm">Real-time platform metrics and analytics</p>
              </div>
            </div>
            {operationsExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </button>

          {operationsExpanded && (
            <div className="mt-6 space-y-6">
              {/* Time Range Selector */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2 bg-white rounded-lg border border-gray-300 p-1">
                  {(['24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={fetchOperationsData}
                  disabled={operationsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${operationsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {operationsLoading && !operationsData ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : operationsData ? (
                <div className="space-y-6">
                  {/* Real-time Activity Metrics */}
                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Activity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <MetricCard
                        title="Active Sessions"
                        value={operationsData.realtime.activeSessions}
                        icon={<MessageSquare className="w-6 h-6" />}
                        color="blue"
                        description="Last 60 minutes"
                      />
                      <MetricCard
                        title="New Leads"
                        value={operationsData.realtime.todayLeads}
                        icon={<Users className="w-6 h-6" />}
                        color="green"
                        description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      />
                      <MetricCard
                        title="Demo Bookings"
                        value={operationsData.realtime.todayDemos}
                        icon={<Calendar className="w-6 h-6" />}
                        color="purple"
                        description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      />
                      <MetricCard
                        title="Spatial Projects"
                        value={operationsData.realtime.todayProjects}
                        icon={<Box className="w-6 h-6" />}
                        color="yellow"
                        description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      />
                      <MetricCard
                        title="AI API Calls"
                        value={operationsData.realtime.aiApiCalls}
                        icon={<Cpu className="w-6 h-6" />}
                        color="red"
                        description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      />
                    </div>
                  </section>

                  {/* System Health */}
                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">System Health</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Avg API Response"
                        value={`${operationsData.systemHealth.apiResponseTime}ms`}
                        icon={<Clock className="w-6 h-6" />}
                        color={operationsData.systemHealth.apiResponseTime < 1000 ? 'green' : operationsData.systemHealth.apiResponseTime < 3000 ? 'yellow' : 'red'}
                        description="Average execution time"
                      />
                      <MetricCard
                        title="Error Rate"
                        value={`${(operationsData.systemHealth.errorRate * 100).toFixed(2)}%`}
                        icon={<AlertCircle className="w-6 h-6" />}
                        color={operationsData.systemHealth.errorRate < 0.05 ? 'green' : operationsData.systemHealth.errorRate < 0.1 ? 'yellow' : 'red'}
                        description={`${operationsData.systemHealth.totalErrors} of ${operationsData.systemHealth.totalApiCalls} calls`}
                      />
                      <MetricCard
                        title="Upload Success Rate"
                        value={`${operationsData.systemHealth.uploadSuccessRate}%`}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color={operationsData.systemHealth.uploadSuccessRate > 95 ? 'green' : operationsData.systemHealth.uploadSuccessRate > 85 ? 'yellow' : 'red'}
                        description="Spatial Studio uploads"
                      />
                      <MetricCard
                        title="Total API Calls"
                        value={operationsData.systemHealth.totalApiCalls}
                        icon={<Activity className="w-6 h-6" />}
                        color="blue"
                        description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                      />
                    </div>
                  </section>

                  {/* User Engagement & Revenue */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Engagement */}
                    <section>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">User Engagement</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                          title="Active Users"
                          value={operationsData.userEngagement.activeUsers}
                          icon={<Users className="w-5 h-5" />}
                          color="blue"
                        />
                        <MetricCard
                          title="Total Sessions"
                          value={operationsData.userEngagement.totalSessions}
                          icon={<MessageSquare className="w-5 h-5" />}
                          color="purple"
                        />
                        <MetricCard
                          title="Avg Session Duration"
                          value={`${Math.round(operationsData.userEngagement.avgSessionDuration / 60)}m`}
                          icon={<Clock className="w-5 h-5" />}
                          color="green"
                          description="Minutes per session"
                        />
                        <MetricCard
                          title="Tool Usage Rate"
                          value={`${operationsData.userEngagement.toolUsageRate}%`}
                          icon={<Box className="w-5 h-5" />}
                          color="yellow"
                          description="Leads using tools"
                        />
                      </div>
                    </section>

                    {/* Revenue Metrics */}
                    <section>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Revenue Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                          title="Monthly Recurring Revenue"
                          value={`$${operationsData.revenue.mrr.toLocaleString()}`}
                          icon={<DollarSign className="w-5 h-5" />}
                          color="green"
                        />
                        <MetricCard
                          title="Trial Starts"
                          value={operationsData.revenue.trialStarts}
                          icon={<Users className="w-5 h-5" />}
                          color="blue"
                          description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                        />
                        <MetricCard
                          title="Conversions"
                          value={operationsData.revenue.conversions}
                          icon={<TrendingUp className="w-5 h-5" />}
                          color="purple"
                          description={timeRange === '24h' ? 'Last 24 Hours' : timeRange === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                        />
                        <MetricCard
                          title="Conversion Rate"
                          value={`${operationsData.revenue.conversionRate}%`}
                          icon={<CheckCircle className="w-5 h-5" />}
                          color="green"
                          description="Trial to customer"
                        />
                      </div>
                    </section>
                  </div>

                  {/* Lead Pipeline Funnel */}
                  <section>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Lead Conversion Funnel</h3>
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                      <FunnelChart
                        stages={[
                          { name: 'Leads', count: operationsData.leadPipeline.funnel.leads },
                          { name: 'Demos Booked', count: operationsData.leadPipeline.funnel.demosBooked, rate: operationsData.leadPipeline.funnel.demosBookedRate },
                          { name: 'Trials Started', count: operationsData.leadPipeline.funnel.trialsStarted, rate: operationsData.leadPipeline.funnel.trialsStartedRate },
                          { name: 'Customers', count: operationsData.leadPipeline.funnel.customers, rate: operationsData.leadPipeline.funnel.customersRate }
                        ]}
                      />
                    </div>
                  </section>

                  {/* AI Performance & Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AI Performance */}
                    <section>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">AI Performance</h3>
                      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <MetricCard
                            title="Total API Calls"
                            value={operationsData.aiPerformance.totalApiCalls}
                            color="blue"
                          />
                          <MetricCard
                            title="Estimated Cost"
                            value={`$${operationsData.aiPerformance.estimatedCost}`}
                            color="yellow"
                          />
                        </div>

                        {/* Provider Breakdown */}
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Provider Usage</h4>
                          <div className="space-y-2">
                            {Object.entries(operationsData.aiPerformance.providerBreakdown).map(([provider, count]) => (
                              <div key={provider} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{provider}</span>
                                <span className="font-semibold">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Recent Activity Feed */}
                    <section>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="bg-white p-6 rounded-lg border-2 border-gray-200 max-h-[600px] overflow-y-auto">
                        <ActivityFeed activities={operationsData.recentActivity.map(a => ({ ...a, type: a.type as 'lead' | 'demo' | 'spatial' | 'ai_session' }))} />
                      </div>
                    </section>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.employees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Users</h2>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No users found</p>
              <Link
                href="/admin/super/create-user"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create First User
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{userItem.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{userItem.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userItem.role)}`}>
                          {getRoleLabel(userItem.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{userItem.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          userItem.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {userItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600 text-sm">
                          {userItem.last_login ? new Date(userItem.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600 text-sm">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleModulePermissions(userItem.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Module permissions"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (read-only)
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  value={editingUser.company}
                  onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="contractor">Contractor</option>
                  <option value="developer">Developer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveUser}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Permissions Modal */}
      {showModuleModal && selectedUserId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Module Permissions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage access to specific modules for this user
                </p>
              </div>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Module permissions are coming soon! This feature will allow you to grant/revoke access to specific features like Analytics, AI Tools, Document Management, and more.
              </p>
            </div>

            <div className="text-center py-8">
              <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Module Permission System
              </h3>
              <p className="text-gray-600 mb-4">
                The module permissions database schema has been created.<br />
                UI integration is in progress.
              </p>
              <button
                onClick={() => setShowModuleModal(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
