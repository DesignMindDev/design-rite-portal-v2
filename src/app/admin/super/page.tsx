'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Shield, Activity, TrendingUp, ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company: string;
  created_at: string;
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

  // Check if user is super_admin
  const isSuperAdmin = userRole?.role === 'super_admin';

  // Redirect if not super_admin
  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) {
      console.log('[UserManagement] Access denied - not super_admin:', { user: !!user, role: userRole?.role });
      router.push('/dashboard');
    }
  }, [user, authLoading, isSuperAdmin, userRole, router]);

  // Fetch users
  useEffect(() => {
    if (user && isSuperAdmin) {
      fetchUsers();
    }
  }, [user, isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Use the authenticated user's session instead of creating new client
      const { supabase: authenticatedSupabase } = await import('@/lib/supabase');

      console.log('[UserManagement] Fetching users...');

      // FIXED: Fetch profiles and roles separately, then combine in memory
      // This avoids the JOIN error between profiles and user_roles

      // Step 1: Fetch all profiles
      const { data: profiles, error: profilesError } = await authenticatedSupabase
        .from('profiles')
        .select('id, email, full_name, company, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('[UserManagement] Error fetching profiles:', profilesError);
        return;
      }

      console.log('[UserManagement] Fetched profiles:', profiles?.length || 0);

      // Step 2: Fetch all user roles
      const { data: userRoles, error: rolesError } = await authenticatedSupabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('[UserManagement] Error fetching roles:', rolesError);
        // Continue even if roles fail - we'll use 'user' as default
      }

      console.log('[UserManagement] Fetched roles:', userRoles?.length || 0);

      // Step 3: Combine profiles with their roles in memory
      const processedUsers: User[] = (profiles || []).map((profile: any) => {
        const userRole = userRoles?.find(r => r.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || 'N/A',
          role: userRole?.role || 'user',
          company: profile.company || 'N/A',
          created_at: profile.created_at
        };
      });

      console.log('[UserManagement] Processed users:', processedUsers.length);

      setUsers(processedUsers);

      // Calculate stats
      const employeeRoles = ['super_admin', 'admin', 'manager', 'developer', 'contractor'];
      const employeeCount = processedUsers.filter(u => employeeRoles.includes(u.role)).length;

      setStats({
        totalUsers: processedUsers.length,
        employees: employeeCount,
        customers: processedUsers.length - employeeCount,
        activeToday: 0 // We'll skip activity tracking for now
      });

      console.log('[UserManagement] Stats calculated:', {
        totalUsers: processedUsers.length,
        employees: employeeCount,
        customers: processedUsers.length - employeeCount
      });

    } catch (error) {
      console.error('[UserManagement] Unexpected error:', error);
    } finally {
      setLoading(false);
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

  if (authLoading || (user && !userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-8 py-8">
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
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{user.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
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
    </div>
  );
}
