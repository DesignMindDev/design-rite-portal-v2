'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Mail, Building, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateUserPage() {
  const router = useRouter();
  const { isEmployee, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    role: 'user' as 'super_admin' | 'admin' | 'manager' | 'developer' | 'contractor' | 'user'
  });

  // Redirect if not employee
  if (!authLoading && !isEmployee) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success(`✅ ${formData.role === 'user' ? 'User' : 'Employee'} created successfully!`);

      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        company: '',
        role: 'user'
      });

      // Redirect to user list after a short delay
      setTimeout(() => {
        router.push('/admin/super');
      }, 1500);

    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'user', label: 'User', description: 'Standard customer access' },
    { value: 'contractor', label: 'Contractor', description: 'Limited employee access' },
    { value: 'developer', label: 'Developer', description: 'Technical employee access' },
    { value: 'manager', label: 'Manager', description: 'Team lead features' },
    { value: 'admin', label: 'Admin', description: 'Manage standard users' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full platform control' }
  ] as const;

  const isEmployeeRole = (role: string) => {
    return ['super_admin', 'admin', 'manager', 'developer', 'contractor'].includes(role);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="bg-[#1A1A1A] border-b border-purple-600/20 px-8 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/super"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin
          </Link>
          <div className="h-6 w-px bg-purple-600/20" />
          <h1 className="text-2xl font-bold">Create New User</h1>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-[#1A1A1A] border border-purple-600/30 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">User Information</h2>
              <p className="text-sm text-gray-400">Create a new user or employee account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black border border-purple-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="user@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black border border-purple-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-gray-500 mt-1">User will be able to change this password after first login</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-black border border-purple-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="John Doe"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Company (Optional)
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-black border border-purple-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="Design-Rite Inc."
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <Shield className="w-4 h-4 inline mr-2" />
                Role *
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.role === role.value
                        ? 'bg-purple-600/20 border-purple-400'
                        : 'bg-black border-purple-600/30 hover:border-purple-400/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{role.label}</span>
                        {isEmployeeRole(role.value) && (
                          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                            Employee
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> {isEmployeeRole(formData.role) ? (
                  <>
                    Creating an <strong>employee</strong> account. They will have access to admin features based on their role.
                  </>
                ) : (
                  <>
                    Creating a standard <strong>customer</strong> account. They will receive a 14-day trial with 3 assessments.
                  </>
                )}
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create {isEmployeeRole(formData.role) ? 'Employee' : 'User'}
                  </>
                )}
              </button>
              <Link
                href="/admin/super"
                className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
