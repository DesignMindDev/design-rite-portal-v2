'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ChevronDown } from 'lucide-react';

type Permission =
  | 'can_manage_team'
  | 'can_manage_blog'
  | 'can_manage_videos'
  | 'can_manage_settings'
  | 'can_create_users'
  | 'can_edit_users'
  | 'can_delete_users'
  | 'can_assign_permissions'
  | 'can_view_activity'
  | 'can_export_data'
  | 'can_view_analytics'
  | 'can_access_admin_panel'
  | 'can_manage_integrations'
  | 'can_view_revenue'
  | 'can_view_quick_stats'
  | 'can_view_user_list'
  | 'can_view_recent_activity';

interface DashboardStats {
  totalUsers: number;
  activeNow: number;
  quotesToday: number;
  aiSessionsToday: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company: string;
  status: string;
  last_login: string | null;
  login_count: number;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  resource_type: string | null;
  timestamp: string;
  success: boolean;
  user_name: string;
  user_email: string;
  ip_address: string | null;
}

export default function SuperAdminDashboard() {
  const { user, profile, loading: authLoading, isEmployee } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [permissions, setPermissions] = useState<Record<Permission, boolean> | null>(null);

  useEffect(() => {
    // Don't do anything while loading
    if (authLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!user) {
      router.push('/auth');
      return;
    }

    // Check if employee (admin or super_admin)
    if (!isEmployee) {
      router.push('/dashboard');
      return;
    }

    // Fetch data only once when authenticated and authorized
    fetchDashboardData();
  }, [user, authLoading, isEmployee, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setStats(data.stats);
      setUsers(data.users);
      setRecentActivity(data.recentActivity);

      // Fetch user permissions
      if (user?.id) {
        const permResponse = await fetch(`/api/admin/get-permissions?userId=${user.id}`);
        if (permResponse.ok) {
          const permData = await permResponse.json();
          setPermissions(permData.permissions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'user':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'guest':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'suspended':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'deleted':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export_${type}_${Date.now()}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleSuspendUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to suspend ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/suspend-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      alert('User suspended successfully');
      fetchDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Suspend failed:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const handleUnsuspendUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Reactivate ${userEmail}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            id: userId,
            status: 'active'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate user');
      }

      alert('User reactivated successfully');
      fetchDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Reactivate failed:', error);
      alert('Failed to reactivate user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`⚠️ Are you sure you want to DELETE ${userEmail}?\n\nThis will mark the user as deleted (soft delete).`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      alert('User deleted successfully');
      fetchDashboardData(); // Refresh the data
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-purple-600/20 px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Logged in as: {profile?.full_name || user?.email}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {/* Export Dropdown */}
            {permissions?.can_export_data && (
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border border-purple-600/30 rounded-lg shadow-xl z-10">
                    <button
                      onClick={() => {
                        handleExport('users');
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-900/20 transition-colors border-b border-purple-600/10"
                    >
                      <div className="font-semibold text-white">Users</div>
                      <div className="text-xs text-gray-400">All user data (CSV)</div>
                    </button>
                    <button
                      onClick={() => {
                        handleExport('activity');
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-900/20 transition-colors border-b border-purple-600/10"
                    >
                      <div className="font-semibold text-white">Activity Logs</div>
                      <div className="text-xs text-gray-400">90 days (CSV)</div>
                    </button>
                    <button
                      onClick={() => {
                        alert('Quote export coming soon!');
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-purple-900/20 transition-colors border-b border-purple-600/10 opacity-50"
                    >
                      <div className="font-semibold text-white">Quotes</div>
                      <div className="text-xs text-gray-400">This month (Coming soon)</div>
                    </button>
                    {isEmployee && (
                      <button
                        onClick={() => {
                          handleExport('database');
                          setShowExportDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-900/20 transition-colors"
                      >
                        <div className="font-semibold text-white">Database Backup</div>
                        <div className="text-xs text-gray-400">Full backup (JSON)</div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {isEmployee && (
              <Link
                href="/admin/super/permissions"
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded transition-colors"
              >
                Manage Permissions
              </Link>
            )}

            <Link
              href="/admin"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              Content Admin
            </Link>
            <Link
              href="/"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              Back to Platform
            </Link>
            <Link
              href="/admin/login"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {permissions?.can_view_quick_stats && (
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              const userListSection = document.getElementById('user-list');
              userListSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-6 hover:border-purple-400 hover:bg-[#252525] transition-all cursor-pointer text-left group"
          >
            <div className="text-3xl font-bold text-purple-400 group-hover:scale-110 transition-transform">{stats.totalUsers}</div>
            <div className="text-gray-400 group-hover:text-gray-300">Total Users</div>
            <div className="text-xs text-purple-400/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to view list →</div>
          </button>

          <Link
            href="/admin/super/activity"
            className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-6 hover:border-green-400 hover:bg-[#252525] transition-all cursor-pointer block group"
          >
            <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform">{stats.activeNow}</div>
            <div className="text-gray-400 group-hover:text-gray-300">Active (24h)</div>
            <div className="text-xs text-green-400/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">View activity logs →</div>
          </Link>

          <Link
            href="/admin/assessments"
            className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-6 hover:border-blue-400 hover:bg-[#252525] transition-all cursor-pointer block group"
          >
            <div className="text-3xl font-bold text-blue-400 group-hover:scale-110 transition-transform">{stats.quotesToday}</div>
            <div className="text-gray-400 group-hover:text-gray-300">Quotes Today</div>
            <div className="text-xs text-blue-400/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">View all quotes →</div>
          </Link>

          <Link
            href="/admin/ai-analytics"
            className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-6 hover:border-yellow-400 hover:bg-[#252525] transition-all cursor-pointer block group"
          >
            <div className="text-3xl font-bold text-yellow-400 group-hover:scale-110 transition-transform">{stats.aiSessionsToday}</div>
            <div className="text-gray-400 group-hover:text-gray-300">AI Sessions Today</div>
            <div className="text-xs text-yellow-400/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">View AI analytics →</div>
          </Link>
        </div>
      </div>
      )}

      {/* User Management */}
      {permissions?.can_view_user_list && (
      <div id="user-list" className="px-8 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">User Management</h2>
          <Link
            href="/admin/super/create-user"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors"
          >
            + Create New User
          </Link>
        </div>

        <div className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-900/20">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Company</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Role</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Last Login</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-purple-600/10 hover:bg-purple-900/10 transition-colors">
                    <td className="px-6 py-4">{user.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-400">{user.company || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/super/edit-user/${user.id}`}
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href="/admin/super/activity"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Activity
                        </Link>
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleSuspendUser(user.id, user.email)}
                            className="text-yellow-400 hover:text-yellow-300 text-sm"
                          >
                            Suspend
                          </button>
                        )}
                        {user.status === 'suspended' && (
                          <button
                            onClick={() => handleUnsuspendUser(user.id, user.email)}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Reactivate
                          </button>
                        )}
                        {isEmployee && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Recent Activity */}
      {permissions?.can_view_recent_activity && (
      <div className="px-8 py-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity (Live Feed)</h2>
        <div className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-purple-600/10 pb-3 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${activity.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {activity.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-white font-medium">{activity.user_name}</span>
                    {' '}
                    <span className="text-gray-400">{formatActionName(activity.action)}</span>
                    {activity.resource_type && (
                      <span className="text-gray-500"> ({activity.resource_type})</span>
                    )}
                  </div>
                  {activity.ip_address && (
                    <div className="text-gray-500 text-xs mt-1">IP: {activity.ip_address}</div>
                  )}
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center text-gray-500 py-8">No recent activity</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Data Exports */}
      {permissions?.can_export_data && (
      <div className="px-8 py-6 pb-12">
        <h2 className="text-xl font-bold mb-4">Data Exports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('users')}
            className="bg-[#1A1A1A] border border-purple-600/30 hover:border-purple-600/60 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-lg font-bold">📥 Export All Users</div>
            <div className="text-gray-400 text-sm">CSV format with all user details</div>
          </button>
          <button
            onClick={() => alert('Quote export coming soon!')}
            className="bg-[#1A1A1A] border border-purple-600/30 hover:border-purple-600/60 rounded-lg p-4 text-left transition-colors opacity-50 cursor-not-allowed"
          >
            <div className="text-lg font-bold">📥 Export All Quotes (This Month)</div>
            <div className="text-gray-400 text-sm">Complete quote data and BOMs (Coming soon)</div>
          </button>
          <button
            onClick={() => handleExport('activity')}
            className="bg-[#1A1A1A] border border-purple-600/30 hover:border-purple-600/60 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-lg font-bold">📥 Export Activity Logs</div>
            <div className="text-gray-400 text-sm">Complete audit trail (last 90 days)</div>
          </button>
          <button
            onClick={() => handleExport('database')}
            className="bg-[#1A1A1A] border border-purple-600/30 hover:border-purple-600/60 rounded-lg p-4 text-left transition-colors"
          >
            <div className="text-lg font-bold">📥 Export Database Backup</div>
            <div className="text-gray-400 text-sm">Full JSON backup of all data (Super Admin only)</div>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
