'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import {
  Search, Filter, Download, RefreshCw, TrendingUp, TrendingDown,
  Users, DollarSign, Calendar, AlertCircle, CheckCircle, XCircle,
  Edit, Trash2, Mail, Clock, Building, Phone, MessageSquare,
  ExternalLink, Database, Globe, ChevronDown, ChevronUp
} from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface V4Lead {
  id: string;
  source: string;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
  message?: string;
  form_data?: any;
  status: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PortalLead {
  id: string;
  type: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  details?: string;
  status: string;
  created_at: string;
}

type CombinedLead = {
  id: string;
  source: 'v4' | 'portal';
  type: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  message?: string;
  status: string;
  created_at: string;
  raw_data: V4Lead | PortalLead;
};

export default function UnifiedLeadsPage() {
  const { user, userRole, isEmployee } = useAuth();
  const [leads, setLeads] = useState<CombinedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<CombinedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'source'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = useState<CombinedLead | null>(null);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    v4: 0,
    portal: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    lost: 0
  });

  // Check if user is authorized (super_admin, admin, manager, or developer)
  const isAuthorized = isEmployee && userRole && ['super_admin', 'admin', 'manager', 'developer'].includes(userRole.role);

  // Fetch leads from both sources
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch V4 leads
      const { data: v4Leads, error: v4Error } = await supabase
        .from('v4_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (v4Error) {
        console.error('Error fetching V4 leads:', v4Error);
      }

      // For now, we'll just use V4 leads since Portal leads table doesn't exist yet
      // In production, you would also fetch from a 'portal_leads' table

      const combinedLeads: CombinedLead[] = [];

      // Process V4 leads
      if (v4Leads) {
        v4Leads.forEach(lead => {
          combinedLeads.push({
            id: lead.id,
            source: 'v4',
            type: lead.source,
            email: lead.email,
            name: lead.full_name,
            company: lead.company,
            phone: lead.phone,
            message: lead.message,
            status: lead.status,
            created_at: lead.created_at,
            raw_data: lead
          });
        });
      }

      setLeads(combinedLeads);
      setFilteredLeads(combinedLeads);
      calculateStats(combinedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (leadsData: CombinedLead[]) => {
    const newStats = {
      total: leadsData.length,
      v4: leadsData.filter(l => l.source === 'v4').length,
      portal: leadsData.filter(l => l.source === 'portal').length,
      new: leadsData.filter(l => l.status === 'new').length,
      contacted: leadsData.filter(l => l.status === 'contacted').length,
      converted: leadsData.filter(l => l.status === 'converted').length,
      lost: leadsData.filter(l => l.status === 'lost').length
    };
    setStats(newStats);
  };

  // Filter and sort leads
  useEffect(() => {
    let filtered = [...leads];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'source':
          aValue = a.source;
          bValue = b.source;
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sourceFilter, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    if (isAuthorized) {
      fetchLeads();
    }
  }, [fetchLeads, isAuthorized]);

  // Toggle lead expansion
  const toggleLeadExpansion = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  // Update lead status
  const updateLeadStatus = async (leadId: string, source: 'v4' | 'portal', newStatus: string) => {
    try {
      if (source === 'v4') {
        const { error } = await supabase
          .from('v4_leads')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', leadId);

        if (error) {
          console.error('Error updating lead status:', error);
          return;
        }
      }
      // Handle portal leads update when implemented

      // Refresh leads
      await fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // Export leads to CSV
  const exportToCSV = () => {
    const csv = [
      ['Source', 'Type', 'Email', 'Name', 'Company', 'Phone', 'Status', 'Created At'],
      ...filteredLeads.map(lead => [
        lead.source,
        lead.type,
        lead.email,
        lead.name || '',
        lead.company || '',
        lead.phone || '',
        lead.status,
        new Date(lead.created_at).toLocaleString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Unified Leads Dashboard</h1>
        <p className="text-gray-600">Manage leads from all sources in one place</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Leads</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            V4: {stats.v4} | Portal: {stats.portal}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">New Leads</p>
              <p className="text-2xl font-bold">{stats.new}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Converted</p>
              <p className="text-2xl font-bold">{stats.converted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Lost</p>
              <p className="text-2xl font-bold">{stats.lost}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, name, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option value="v4">V4 Platform</option>
            <option value="portal">Portal</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'source')}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="source">Sort by Source</option>
          </select>

          {/* Actions */}
          <button
            onClick={() => fetchLeads()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleLeadExpansion(lead.id)}>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          lead.source === 'v4'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {lead.source === 'v4' ? <Globe className="h-3 w-3 mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                          {lead.source.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">{lead.type}</td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium">{lead.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {lead.company && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            {lead.company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateLeadStatus(lead.id, lead.source, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            lead.status === 'new' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                            lead.status === 'contacted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            lead.status === 'converted' ? 'bg-green-50 text-green-800 border-green-200' :
                            'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          {expandedLeads.has(lead.id) ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                      </td>
                    </tr>
                    {expandedLeads.has(lead.id) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-2">
                            {lead.message && (
                              <div>
                                <span className="font-medium text-sm">Message:</span>
                                <p className="text-sm text-gray-600 mt-1">{lead.message}</p>
                              </div>
                            )}
                            {lead.raw_data && 'form_data' in lead.raw_data && lead.raw_data.form_data && (
                              <div>
                                <span className="font-medium text-sm">Additional Data:</span>
                                <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded">
                                  {JSON.stringify(lead.raw_data.form_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}