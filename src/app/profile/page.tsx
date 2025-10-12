'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Users,
  Plus,
  Trash2,
  Shield,
  Settings,
  Bell,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  status: 'active' | 'pending'
  added_at: string
}

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const { subscription, isEnterprise } = useSubscription()

  // Profile state
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [logo, setLogo] = useState<string | null>(null)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(true)

  // Team management (Enterprise only)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member')

  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'notifications' | 'team' | 'security'>('profile')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
        toast.success('Logo uploaded')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    // TODO: Save profile to Supabase
    toast.success('Profile updated successfully!')
  }

  const handleAddTeamMember = () => {
    if (!newMemberEmail) {
      toast.error('Please enter an email address')
      return
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail,
      role: newMemberRole,
      status: 'pending',
      added_at: new Date().toISOString()
    }

    setTeamMembers([...teamMembers, newMember])
    setNewMemberEmail('')
    setShowAddMember(false)
    toast.success(`Invitation sent to ${newMemberEmail}`)
  }

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id))
    toast.success('Team member removed')
  }

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(isEnterprise ? [{ id: 'team', label: 'Team Management', icon: Users }] : []),
    { id: 'security', label: 'Security', icon: Lock }
  ]

  return (
    <ProtectedLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile & Settings</h1>
          <p className="text-gray-600 text-lg">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Info Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Info Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Company Information</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo
                      </label>
                      <div className="flex items-center gap-4">
                        {logo && (
                          <img src={logo} alt="Company logo" className="w-20 h-20 object-contain border border-gray-300 rounded-lg" />
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium cursor-pointer hover:bg-gray-200 transition-colors">
                          <Upload className="w-4 h-4" />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Business St"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP
                        </label>
                        <input
                          type="text"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates about your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive product updates and promotions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingEmails}
                        onChange={(e) => setMarketingEmails(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-500">Get weekly analytics summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyReports}
                        onChange={(e) => setWeeklyReports(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Team Management Tab (Enterprise Only) */}
            {activeTab === 'team' && isEnterprise && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Team Management</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Manage team members and their permissions
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Member
                    </button>
                  </div>

                  {showAddMember && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-3">Invite Team Member</h3>
                      <div className="space-y-3">
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="teammate@company.com"
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as any)}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="viewer">Viewer - Can view only</option>
                          <option value="member">Member - Can create and edit</option>
                          <option value="admin">Admin - Full access</option>
                        </select>
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddTeamMember}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                          >
                            Send Invite
                          </button>
                          <button
                            onClick={() => setShowAddMember(false)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {teamMembers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No team members yet</p>
                      <p className="text-sm text-gray-500">Add your first team member to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : member.role === 'member'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {member.role}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {member.status}
                            </span>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Change Password</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Update your password to keep your account secure
                    </p>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium hover:bg-gray-200">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
