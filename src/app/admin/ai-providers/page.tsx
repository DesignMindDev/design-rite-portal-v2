'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, Brain, CheckCircle, AlertCircle, Settings, Plus, Edit, Trash2, Play, Activity, Server, Zap, MessageSquare, Bot, Code, Search, Database, Palette, FileText, Share2, Eye } from 'lucide-react'

interface AIProvider {
  id: string
  name: string
  provider_type: 'anthropic' | 'openai' | 'google' | 'xai'
  api_key: string
  endpoint: string
  model: string
  priority: number
  enabled: boolean
  max_tokens: number
  timeout_seconds: number
  use_case: 'general' | 'chatbot' | 'assessment' | 'search' | 'analysis' | 'creative-vision' | 'creative-writing' | 'creative-social'
  description?: string
  created_at: string
  updated_at: string
}

interface HealthCheck {
  id: string
  provider_id: string
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms?: number
  error_message?: string
  checked_at: string
}

interface AISettings {
  health_check_interval_minutes: number
  auto_failover_enabled: boolean
  fallback_to_static_responses: boolean
}

interface ChatbotConfig {
  assistant_id?: string
  thread_management: boolean
  auto_initialize: boolean
  fallback_enabled: boolean
  max_conversation_length: number
  response_timeout_ms: number
}

interface AIProvidersData {
  providers: AIProvider[]
  health_checks: HealthCheck[]
  settings: AISettings
  chatbot_config?: ChatbotConfig
}

export default function AIProvidersAdmin() {
  const [data, setData] = useState<AIProvidersData>({ providers: [], health_checks: [], settings: { health_check_interval_minutes: 5, auto_failover_enabled: true, fallback_to_static_responses: true } })
  const [loading, setLoading] = useState(true)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [newProvider, setNewProvider] = useState<Partial<AIProvider>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('demo-estimator')
  const [filterUseCase, setFilterUseCase] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading AI providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProvider = async (provider: Partial<AIProvider>, isEdit = false) => {
    try {
      // Set use_case based on active tab
      let finalProvider = { ...provider }
      if (activeTab === 'demo-estimator') {
        finalProvider.use_case = 'general'
      } else if (!isEdit && !finalProvider.use_case) {
        // For new providers in assistant tabs, set use_case to the tab name
        if (activeTab !== 'chatbot' && activeTab !== 'health' && activeTab !== 'settings') {
          finalProvider.use_case = activeTab as any
        }
      }

      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEdit ? 'update' : 'create',
          provider: finalProvider
        })
      })

      if (response.ok) {
        loadData()
        setEditingProvider(null)
        setNewProvider({})
      }
    } catch (error) {
      console.error('Error saving provider:', error)
    }
  }

  const deleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI provider?')) return

    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          provider: { id }
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error deleting provider:', error)
    }
  }

  const testConnection = async (provider: AIProvider) => {
    setTesting(provider.id)
    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          provider
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        loadData()
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      alert('Connection test failed')
    } finally {
      setTesting(null)
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'anthropic': return <Brain className="w-5 h-5" />
      case 'openai': return <Zap className="w-5 h-5" />
      case 'google': return <Server className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const getUseCaseIcon = (useCase: string) => {
    switch (useCase) {
      case 'chatbot': return <MessageSquare className="w-4 h-4" />
      case 'assessment': return <CheckCircle className="w-4 h-4" />
      case 'search': return <Search className="w-4 h-4" />
      case 'analysis': return <Database className="w-4 h-4" />
      case 'creative-vision': return <Eye className="w-4 h-4" />
      case 'creative-writing': return <FileText className="w-4 h-4" />
      case 'creative-social': return <Share2 className="w-4 h-4" />
      default: return <Bot className="w-4 h-4" />
    }
  }

  const getUseCaseColor = (useCase: string) => {
    switch (useCase) {
      case 'chatbot': return 'bg-blue-500/20 text-blue-400'
      case 'assessment': return 'bg-green-500/20 text-green-400'
      case 'search': return 'bg-yellow-500/20 text-yellow-400'
      case 'analysis': return 'bg-purple-500/20 text-purple-400'
      case 'creative-vision': return 'bg-pink-500/20 text-pink-400'
      case 'creative-writing': return 'bg-orange-500/20 text-orange-400'
      case 'creative-social': return 'bg-cyan-500/20 text-cyan-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400'
      case 'degraded': return 'text-yellow-400'
      case 'down': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getLatestHealthCheck = (providerId: string) => {
    return data.health_checks
      .filter(hc => hc.provider_id === providerId)
      .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime())[0]
  }

  // Get dynamic tabs based on AI providers
  const getDynamicTabs = () => {
    const baseTabs = [
      { id: 'demo-estimator', name: 'Demo AI Estimator', icon: <Zap className="w-4 h-4" /> },
      { id: 'chatbot', name: 'Chatbot', icon: <MessageSquare className="w-4 h-4" /> }
    ]

    // Add dynamic tabs for each unique use case (except general and chatbot)
    const useCases = [...new Set(data.providers
      .filter(p => p.use_case && p.use_case !== 'general' && p.use_case !== 'chatbot')
      .map(p => p.use_case)
    )]

    const dynamicTabs = useCases.map(useCase => ({
      id: useCase,
      name: useCase.charAt(0).toUpperCase() + useCase.slice(1) + ' Assistant',
      icon: getUseCaseIcon(useCase)
    }))

    const endTabs = [
      { id: 'health', name: 'Health', icon: <Activity className="w-4 h-4" /> },
      { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> }
    ]

    return [...baseTabs, ...dynamicTabs, ...endTabs]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading AI Providers...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Link
              href="/admin"
              className="absolute left-4 top-8 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Admin
            </Link>
            <Brain className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">AI Provider Management</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Manage multiple AI providers with automatic failover, health monitoring, and performance optimization
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-2 inline-flex flex-wrap gap-1">
            {getDynamicTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="inline mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Demo AI Estimator Tab */}
        {activeTab === 'demo-estimator' && (
          <div className="space-y-8">
            {/* Add New Provider */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-purple-400" />
                Add Demo AI Estimator Provider
              </h2>
              <p className="text-gray-300 mb-6">Manage AI providers for the estimate options page (/estimate-options) with priority-based failover capabilities.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Provider Name (e.g., 'Claude Primary')"
                  value={newProvider.name || ''}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <select
                  value={newProvider.provider_type || ''}
                  onChange={(e) => setNewProvider({...newProvider, provider_type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select Provider Type</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="xai">xAI (Grok)</option>
                </select>
                {/* Force general use case for demo estimator */}
                <input
                  type="hidden"
                  value="general"
                  onChange={(e) => setNewProvider({...newProvider, use_case: 'general' as any})}
                />
                <div className="col-span-2">
                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      <strong>Purpose:</strong> These providers power the estimate options (Quick Estimate, AI Discovery, etc.) with automatic failover based on priority ranking.
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newProvider.description || ''}
                  onChange={(e) => setNewProvider({...newProvider, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={newProvider.provider_type === 'openai' ? 'Assistant ID (asst_xxx)' : 'API Key'}
                  value={newProvider.api_key || ''}
                  onChange={(e) => setNewProvider({...newProvider, api_key: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Model Name"
                  value={newProvider.model || ''}
                  onChange={(e) => setNewProvider({...newProvider, model: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Priority (1=highest)"
                  value={newProvider.priority || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setNewProvider({...newProvider, priority: value === '' ? 0 : parseInt(value)})
                  }}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={newProvider.enabled !== false}
                      onChange={(e) => setNewProvider({...newProvider, enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enabled
                  </label>
                  <button
                    onClick={() => saveProvider(newProvider)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Provider
                  </button>
                </div>
              </div>
            </div>

            {/* Demo AI Estimator Providers List */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-purple-400" />
                  Demo AI Estimator Providers
                </h2>
                <div className="text-sm text-gray-400">
                  Priority-based failover for /estimate-options
                </div>
              </div>
              <div className="space-y-4">
                {data.providers
                  .filter(provider => provider.use_case === 'general' || !provider.use_case)
                  .sort((a, b) => a.priority - b.priority)
                  .map((provider) => {
                  const healthCheck = getLatestHealthCheck(provider.id)
                  return (
                    <div key={provider.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getProviderIcon(provider.provider_type)}
                            <div>
                              <h3 className="text-white font-semibold">{provider.name}</h3>
                              <p className="text-gray-400 text-sm">Priority: {provider.priority} • {provider.model}</p>
                              {provider.description && (
                                <p className="text-gray-500 text-xs">{provider.description}</p>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getUseCaseColor(provider.use_case || 'general')}`}>
                            {getUseCaseIcon(provider.use_case || 'general')}
                            {provider.use_case || 'general'}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm ${
                            provider.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {provider.enabled ? 'Enabled' : 'Disabled'}
                          </div>
                          {healthCheck && (
                            <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(healthCheck.status)}`}>
                              <div className={`w-2 h-2 rounded-full ${healthCheck.status === 'healthy' ? 'bg-green-400' : healthCheck.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                              {healthCheck.status}
                              {healthCheck.response_time_ms && ` (${healthCheck.response_time_ms}ms)`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => testConnection(provider)}
                            disabled={testing === provider.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {testing === provider.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingProvider(provider)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProvider(provider.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Assistant Tabs */}
        {getDynamicTabs()
          .filter(tab => !['demo-estimator', 'chatbot', 'health', 'settings'].includes(tab.id))
          .map(tab => tab.id)
          .includes(activeTab) && (
          <div className="space-y-8">
            {/* Add New Assistant Provider */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {getUseCaseIcon(activeTab)}
                Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Assistant Provider
              </h2>
              <p className="text-gray-300 mb-6">
                Manage AI providers specifically for {activeTab} functionality with specialized Assistant IDs.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={`Provider Name (e.g., '${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Specialist')`}
                  value={newProvider.name || ''}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <select
                  value={newProvider.provider_type || ''}
                  onChange={(e) => setNewProvider({...newProvider, provider_type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select Provider Type</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="google">Google (Gemini)</option>
                  <option value="xai">xAI (Grok)</option>
                </select>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newProvider.description || ''}
                  onChange={(e) => setNewProvider({...newProvider, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder={newProvider.provider_type === 'openai' ? 'Assistant ID (asst_xxx)' : 'API Key'}
                  value={newProvider.api_key || ''}
                  onChange={(e) => setNewProvider({...newProvider, api_key: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Model Name"
                  value={newProvider.model || ''}
                  onChange={(e) => setNewProvider({...newProvider, model: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Priority (1=highest)"
                  value={newProvider.priority || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setNewProvider({...newProvider, priority: value === '' ? 0 : parseInt(value)})
                  }}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={newProvider.enabled !== false}
                      onChange={(e) => setNewProvider({...newProvider, enabled: e.target.checked})}
                      className="mr-2"
                    />
                    Enabled
                  </label>
                  <button
                    onClick={() => saveProvider(newProvider)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Provider
                  </button>
                </div>
              </div>
            </div>

            {/* Assistant Providers List */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {getUseCaseIcon(activeTab)}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Assistant Providers
                </h2>
              </div>
              <div className="space-y-4">
                {data.providers
                  .filter(provider => provider.use_case === activeTab)
                  .sort((a, b) => a.priority - b.priority)
                  .map((provider) => {
                    const healthCheck = getLatestHealthCheck(provider.id)
                    return (
                      <div key={provider.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.provider_type)}
                              <div>
                                <h3 className="text-white font-semibold">{provider.name}</h3>
                                <p className="text-gray-400 text-sm">Priority: {provider.priority} • {provider.model}</p>
                                {provider.description && (
                                  <p className="text-gray-500 text-xs">{provider.description}</p>
                                )}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              provider.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {provider.enabled ? 'Active' : 'Inactive'}
                            </div>
                            {healthCheck && (
                              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(healthCheck.status)}`}>
                                <div className={`w-2 h-2 rounded-full ${healthCheck.status === 'healthy' ? 'bg-green-400' : healthCheck.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                                {healthCheck.status}
                                {healthCheck.response_time_ms && ` (${healthCheck.response_time_ms}ms)`}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => testConnection(provider)}
                              disabled={testing === provider.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {testing === provider.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingProvider(provider)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProvider(provider.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {data.providers.filter(provider => provider.use_case === activeTab).length === 0 && (
                  <div className="text-center py-8">
                    {getUseCaseIcon(activeTab)}
                    <h3 className="text-gray-400 text-lg font-medium mb-2 mt-4">No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Providers</h3>
                    <p className="text-gray-500 mb-4">Create an AI provider for {activeTab} functionality.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chatbot Configuration Tab */}
        {activeTab === 'chatbot' && (
          <div className="space-y-8">
            {/* Current Chatbot Configuration */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-400" />
                Chatbot Configuration
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">OpenAI Assistant ID</label>
                    <input
                      type="text"
                      placeholder="asst_..."
                      value={data.chatbot_config?.assistant_id || 'asst_bqlPjRKyztWpplupYhCimIzS'}
                      onChange={(e) => setData({
                        ...data,
                        chatbot_config: {...(data.chatbot_config || {}), assistant_id: e.target.value}
                      })}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Response Timeout (ms)</label>
                    <input
                      type="number"
                      value={data.chatbot_config?.response_timeout_ms || 30000}
                      onChange={(e) => setData({
                        ...data,
                        chatbot_config: {...(data.chatbot_config || {}), response_timeout_ms: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Max Conversation Length</label>
                    <input
                      type="number"
                      value={data.chatbot_config?.max_conversation_length || 50}
                      onChange={(e) => setData({
                        ...data,
                        chatbot_config: {...(data.chatbot_config || {}), max_conversation_length: parseInt(e.target.value)}
                      })}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={data.chatbot_config?.thread_management ?? true}
                        onChange={(e) => setData({
                          ...data,
                          chatbot_config: {...(data.chatbot_config || {}), thread_management: e.target.checked}
                        })}
                        className="mr-3"
                      />
                      Thread Management
                    </label>
                    <p className="text-gray-400 text-sm ml-6">Maintain conversation context across sessions</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={data.chatbot_config?.auto_initialize ?? true}
                        onChange={(e) => setData({
                          ...data,
                          chatbot_config: {...(data.chatbot_config || {}), auto_initialize: e.target.checked}
                        })}
                        className="mr-3"
                      />
                      Auto Initialize Threads
                    </label>
                    <p className="text-gray-400 text-sm ml-6">Automatically create conversation threads when opened</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={data.chatbot_config?.fallback_enabled ?? true}
                        onChange={(e) => setData({
                          ...data,
                          chatbot_config: {...(data.chatbot_config || {}), fallback_enabled: e.target.checked}
                        })}
                        className="mr-3"
                      />
                      Fallback Responses
                    </label>
                    <p className="text-gray-400 text-sm ml-6">Use help-assistant API when OpenAI fails</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    // Save chatbot configuration
                    fetch('/api/admin/ai-providers', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'update_chatbot_config',
                        config: data.chatbot_config
                      })
                    }).then(() => {
                      alert('Chatbot configuration saved!')
                      loadData()
                    })
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Save Chatbot Configuration
                </button>
              </div>
            </div>

            {/* Chatbot-Specific Providers */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-400" />
                Chatbot AI Providers
              </h2>

              <div className="space-y-4">
                {data.providers
                  .filter(provider => provider.use_case === 'chatbot')
                  .sort((a, b) => a.priority - b.priority)
                  .map((provider) => {
                    const healthCheck = getLatestHealthCheck(provider.id)
                    return (
                      <div key={provider.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.provider_type)}
                              <div>
                                <h3 className="text-white font-semibold">{provider.name}</h3>
                                <p className="text-gray-400 text-sm">Priority: {provider.priority} • {provider.model}</p>
                                {provider.description && (
                                  <p className="text-gray-500 text-xs">{provider.description}</p>
                                )}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              provider.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {provider.enabled ? 'Active' : 'Inactive'}
                            </div>
                            {healthCheck && (
                              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getStatusColor(healthCheck.status)}`}>
                                <div className={`w-2 h-2 rounded-full ${healthCheck.status === 'healthy' ? 'bg-green-400' : healthCheck.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                                {healthCheck.status}
                                {healthCheck.response_time_ms && ` (${healthCheck.response_time_ms}ms)`}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => testConnection(provider)}
                              disabled={testing === provider.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {testing === provider.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingProvider(provider)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {data.providers.filter(provider => provider.use_case === 'chatbot').length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-gray-400 text-lg font-medium mb-2">No Chatbot Providers</h3>
                    <p className="text-gray-500 mb-4">Create an AI provider with "Chatbot Assistant" use case to manage chatbot functionality.</p>
                    <button
                      onClick={() => {
                        setNewProvider({use_case: 'chatbot'})
                        setActiveTab('providers')
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Chatbot Provider
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    fetch('/api/chat/init', { method: 'POST' })
                      .then(res => res.json())
                      .then(data => alert(`Test thread created: ${data.threadId}`))
                      .catch(err => alert('Failed to create test thread'))
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Test Thread Creation
                </button>
                <button
                  onClick={() => window.open('/admin/chatbot', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  View Analytics
                </button>
                <button
                  onClick={() => {
                    fetch('/api/chat/message/route.ts')
                      .then(() => alert('Chatbot API is accessible'))
                      .catch(() => alert('Chatbot API check failed'))
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Test API Health
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Health Monitoring</h2>
            <div className="space-y-4">
              {data.health_checks.slice(0, 20).map((check) => {
                const provider = data.providers.find(p => p.id === check.provider_id)
                return (
                  <div key={check.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${check.status === 'healthy' ? 'bg-green-400' : check.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                        <div>
                          <h3 className="text-white font-semibold">{provider?.name}</h3>
                          <p className="text-gray-400 text-sm">{new Date(check.checked_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${getStatusColor(check.status)}`}>
                          {check.status.toUpperCase()}
                        </div>
                        {check.response_time_ms && (
                          <div className="text-gray-400 text-sm">{check.response_time_ms}ms</div>
                        )}
                        {check.error_message && (
                          <div className="text-red-400 text-sm max-w-xs truncate">{check.error_message}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-black/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">System Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">Health Check Interval (minutes)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data.settings.health_check_interval_minutes}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setData({...data, settings: {...data.settings, health_check_interval_minutes: value === '' ? 0 : parseInt(value)}})
                  }}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={data.settings.auto_failover_enabled}
                    onChange={(e) => setData({...data, settings: {...data.settings, auto_failover_enabled: e.target.checked}})}
                    className="mr-2"
                  />
                  Auto Failover Enabled
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={data.settings.fallback_to_static_responses}
                    onChange={(e) => setData({...data, settings: {...data.settings, fallback_to_static_responses: e.target.checked}})}
                    className="mr-2"
                  />
                  Fallback to Static Responses
                </label>
              </div>
              <button
                onClick={() => saveProvider(data.settings, true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Edit AI Provider</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({...editingProvider, name: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  {editingProvider.provider_type === 'openai' ? 'Assistant ID' : 'API Key'}
                </label>
                <input
                  type={editingProvider.provider_type === 'openai' ? 'text' : 'password'}
                  value={editingProvider.api_key}
                  onChange={(e) => setEditingProvider({...editingProvider, api_key: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder={editingProvider.provider_type === 'openai' ? 'asst_xxx' : 'Enter API key or use configured_from_env'}
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Priority</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editingProvider.priority}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setEditingProvider({...editingProvider, priority: value === '' ? 0 : parseInt(value)})
                  }}
                  className="w-full px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={editingProvider.enabled}
                    onChange={(e) => setEditingProvider({...editingProvider, enabled: e.target.checked})}
                    className="mr-2"
                  />
                  Enabled
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => saveProvider(editingProvider, true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex-1"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingProvider(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}