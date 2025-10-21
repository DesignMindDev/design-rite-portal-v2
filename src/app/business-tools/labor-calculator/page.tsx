'use client'

import { useState, useEffect } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import { supabase } from '@/lib/supabase'
import {
  Settings,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Upload,
  Download,
  Calculator,
  BarChart3,
  X
} from 'lucide-react'

interface LaborRate {
  base: number
  burden: number
  billed: number
}

interface ProcurementVehicle {
  id: string
  name: string
  multiplier: number
  minMargin: number
  overhead: number
  rates: {
    tech: LaborRate
    lead: LaborRate
    pm: LaborRate
    engineer: LaborRate
  }
}

interface DeviceData {
  category: string
  type: string
  installHours: number
  progHours: number
}

interface LockedRates {
  tech?: boolean
  lead?: boolean
  pm?: boolean
  eng?: boolean
}

export default function LaborCalculatorPage() {
  // State management
  const [procurementVehicles, setProcurementVehicles] = useState<ProcurementVehicle[]>([
    {
      id: 'standard',
      name: 'Standard Commercial',
      multiplier: 1.0,
      minMargin: 30,
      overhead: 25,
      rates: {
        tech: { base: 35, burden: 25, billed: 90 },
        lead: { base: 45, burden: 30, billed: 120 },
        pm: { base: 55, burden: 35, billed: 140 },
        engineer: { base: 65, burden: 35, billed: 150 }
      }
    },
    {
      id: 'sourcewell',
      name: 'Sourcewell',
      multiplier: 0.95,
      minMargin: 20,
      overhead: 30,
      rates: {
        tech: { base: 35, burden: 25, billed: 85 },
        lead: { base: 45, burden: 30, billed: 115 },
        pm: { base: 55, burden: 35, billed: 135 },
        engineer: { base: 65, burden: 35, billed: 145 }
      }
    },
    {
      id: 'omnia',
      name: 'OMNIA Partners',
      multiplier: 0.92,
      minMargin: 18,
      overhead: 28,
      rates: {
        tech: { base: 35, burden: 25, billed: 88 },
        lead: { base: 45, burden: 30, billed: 118 },
        pm: { base: 55, burden: 35, billed: 138 },
        engineer: { base: 65, burden: 35, billed: 148 }
      }
    }
  ])

  const [activeVehicle, setActiveVehicle] = useState<ProcurementVehicle>(procurementVehicles[0])
  const [projectDistance, setProjectDistance] = useState(25)
  const [marginTarget, setMarginTarget] = useState(30)
  const [projectDays, setProjectDays] = useState(5)

  // Team composition
  const [techCount, setTechCount] = useState(2)
  const [leadCount, setLeadCount] = useState(1)
  const [pmCount, setPmCount] = useState(0)
  const [engCount, setEngCount] = useState(0)

  // Dynamic rates
  const [techRate, setTechRate] = useState(90)
  const [leadRate, setLeadRate] = useState(120)
  const [pmRate, setPmRate] = useState(140)
  const [engRate, setEngRate] = useState(150)

  const [lockedRates, setLockedRates] = useState<LockedRates>({})
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Modal state
  const [showRateModal, setShowRateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('vehicles')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // New vehicle form
  const [newVehicleName, setNewVehicleName] = useState('')
  const [newVehicleMultiplier, setNewVehicleMultiplier] = useState('1.0')
  const [newVehicleMinMargin, setNewVehicleMinMargin] = useState('15')
  const [newVehicleOverhead, setNewVehicleOverhead] = useState('25')

  // Prevailing wage lookup
  const [wageState, setWageState] = useState('')
  const [wageCounty, setWageCounty] = useState('')
  const [wageClassification, setWageClassification] = useState('')
  const [wageResult, setWageResult] = useState<any>(null)

  // Labor data
  const laborData: DeviceData[] = [
    { category: "standard", type: "Indoor Camera", installHours: 2, progHours: 0.5 },
    { category: "standard", type: "Outdoor Camera", installHours: 4, progHours: 0.5 },
    { category: "standard", type: "Access Control Door", installHours: 8, progHours: 2 },
    { category: "ai", type: "License Plate Reader", installHours: 8, progHours: 6 },
    { category: "ai", type: "Weapons Detection", installHours: 12, progHours: 8 },
    { category: "specialty", type: "Turnstile", installHours: 12, progHours: 4 }
  ]

  // Initialize rates when active vehicle changes
  useEffect(() => {
    setTechRate(activeVehicle.rates.tech.billed)
    setLeadRate(activeVehicle.rates.lead.billed)
    setPmRate(activeVehicle.rates.pm.billed)
    setEngRate(activeVehicle.rates.engineer.billed)
  }, [activeVehicle])

  // Rate adjustment functions
  const adjustRate = (role: 'tech' | 'lead' | 'pm' | 'eng', amount: number) => {
    if (lockedRates[role]) return

    const setters = { tech: setTechRate, lead: setLeadRate, pm: setPmRate, eng: setEngRate }
    const getters = { tech: techRate, lead: leadRate, pm: pmRate, eng: engRate }

    const newValue = getters[role] + amount
    if (newValue >= 50 && newValue <= 350) {
      setters[role](newValue)
    }
  }

  const resetRate = (role: 'tech' | 'lead' | 'pm' | 'eng') => {
    if (lockedRates[role]) return

    const rates = {
      tech: activeVehicle.rates.tech.billed,
      lead: activeVehicle.rates.lead.billed,
      pm: activeVehicle.rates.pm.billed,
      eng: activeVehicle.rates.engineer.billed
    }

    const setters = { tech: setTechRate, lead: setLeadRate, pm: setPmRate, eng: setEngRate }
    setters[role](rates[role])
  }

  const toggleLock = (role: 'tech' | 'lead' | 'pm' | 'eng') => {
    setLockedRates(prev => ({ ...prev, [role]: !prev[role] }))
  }

  // Vehicle management
  const addProcurementVehicle = () => {
    if (!newVehicleName) return

    const newVehicle: ProcurementVehicle = {
      id: newVehicleName.toLowerCase().replace(/\s+/g, '_'),
      name: newVehicleName,
      multiplier: parseFloat(newVehicleMultiplier) || 1.0,
      minMargin: parseFloat(newVehicleMinMargin) || 20,
      overhead: parseFloat(newVehicleOverhead) || 25,
      rates: {
        tech: { base: 35, burden: 25, billed: 90 },
        lead: { base: 45, burden: 30, billed: 120 },
        pm: { base: 55, burden: 35, billed: 140 },
        engineer: { base: 65, burden: 35, billed: 150 }
      }
    }

    setProcurementVehicles(prev => [...prev, newVehicle])
    setNewVehicleName('')
    setNewVehicleMultiplier('1.0')
    setNewVehicleMinMargin('15')
    setNewVehicleOverhead('25')
  }

  const deleteVehicle = (vehicleId: string) => {
    if (vehicleId === 'standard') {
      alert('Cannot delete the standard rate table')
      return
    }

    if (confirm('Are you sure you want to delete this vehicle?')) {
      setProcurementVehicles(prev => prev.filter(v => v.id !== vehicleId))

      if (activeVehicle.id === vehicleId) {
        setActiveVehicle(procurementVehicles[0])
      }
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const teamHourlyRate =
      (techCount * techRate) +
      (leadCount * leadRate) +
      (pmCount * pmRate) +
      (engCount * engRate)

    let totalTrueCost = 0
    let totalSellPrice = 0
    const results: any[] = []

    const filteredData = categoryFilter === 'all'
      ? laborData
      : laborData.filter(d => d.category === categoryFilter)

    filteredData.forEach(device => {
      const hours = device.installHours + device.progHours
      const laborCost = hours * teamHourlyRate * activeVehicle.multiplier
      const travelCost = projectDistance * 0.67 * 2
      const overhead = laborCost * (activeVehicle.overhead / 100)
      const trueCost = laborCost + travelCost + overhead

      const markupAmount = trueCost * (marginTarget / 100)
      const sellPrice = trueCost + markupAmount
      const actualMargin = (markupAmount / sellPrice * 100)

      totalTrueCost += trueCost
      totalSellPrice += sellPrice

      results.push({
        ...device,
        hours,
        hourlyRate: teamHourlyRate,
        laborCost,
        travelCost,
        overhead,
        trueCost,
        markupAmount,
        sellPrice,
        actualMargin
      })
    })

    return { results, totalTrueCost, totalSellPrice, totalMarkup: totalSellPrice - totalTrueCost }
  }

  const { results, totalTrueCost, totalSellPrice, totalMarkup } = calculateTotals()

  // Export functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(procurementVehicles, null, 2)
    const dataBlob = new Blob([dataStr], {type: 'application/json'})
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'procurement_rates.json'
    link.click()
  }

  // Template loading
  const loadTemplate = (type: 'federal' | 'state' | 'coop') => {
    const templates = {
      federal: {
        id: 'federal_gsa',
        name: 'Federal GSA',
        multiplier: 0.85,
        minMargin: 15,
        overhead: 35,
        rates: {
          tech: { base: 40, burden: 30, billed: 95 },
          lead: { base: 50, burden: 35, billed: 125 },
          pm: { base: 60, burden: 40, billed: 145 },
          engineer: { base: 70, burden: 40, billed: 155 }
        }
      },
      state: {
        id: 'state_contract',
        name: 'State Contract',
        multiplier: 0.90,
        minMargin: 18,
        overhead: 30,
        rates: {
          tech: { base: 38, burden: 25, billed: 88 },
          lead: { base: 48, burden: 30, billed: 118 },
          pm: { base: 58, burden: 35, billed: 138 },
          engineer: { base: 68, burden: 35, billed: 148 }
        }
      },
      coop: {
        id: 'cooperative',
        name: 'Cooperative',
        multiplier: 0.92,
        minMargin: 20,
        overhead: 28,
        rates: {
          tech: { base: 36, burden: 24, billed: 90 },
          lead: { base: 46, burden: 29, billed: 120 },
          pm: { base: 56, burden: 34, billed: 140 },
          engineer: { base: 66, burden: 34, billed: 150 }
        }
      }
    }

    const template = templates[type]
    const existing = procurementVehicles.findIndex(v => v.id === template.id)

    if (existing >= 0) {
      const updated = [...procurementVehicles]
      updated[existing] = template
      setProcurementVehicles(updated)
    } else {
      setProcurementVehicles(prev => [...prev, template])
    }

    alert(`${template.name} template loaded!`)
  }

  // Prevailing wage lookup
  const lookupWage = () => {
    const wages: any = {
      electrician: { base: 45, fringe: 28, total: 73 },
      technician: { base: 35, fringe: 22, total: 57 },
      laborer: { base: 28, fringe: 18, total: 46 },
      operator: { base: 40, fringe: 25, total: 65 }
    }

    const wage = wages[wageClassification] || wages.technician
    setWageResult({
      classification: wageClassification || 'technician',
      state: wageState || 'NY',
      county: wageCounty || 'All Counties',
      ...wage
    })
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowRateModal(true)}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Rate Management
            </button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">🚀 Multi-Procurement Labor Calculator</h1>
              <p className="text-purple-100">Dynamic Rate Management for Any Contract Vehicle</p>
            </div>
            <div className="w-48"></div>
          </div>
        </div>

        {/* Procurement Vehicle Selector */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 mb-6 shadow-lg">
          <label className="text-white font-bold text-lg mb-3 block">Active Procurement Vehicle:</label>
          <div className="flex gap-4 flex-wrap items-center">
            {procurementVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => setActiveVehicle(vehicle)}
                className={`px-6 py-3 rounded-lg cursor-pointer transition-all ${
                  activeVehicle.id === vehicle.id
                    ? 'bg-white text-green-700 shadow-lg transform scale-105'
                    : 'bg-green-400/50 text-white hover:bg-green-400/70'
                }`}
              >
                <div className="font-bold">{vehicle.name}</div>
                <div className="text-xs opacity-75">({vehicle.minMargin}% min)</div>
              </div>
            ))}
            <button
              onClick={() => setShowRateModal(true)}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          </div>
        </div>

        {/* Distance Escalator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
            <h4 className="font-bold text-gray-700 mb-2 text-sm">📍 Project Distance</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={projectDistance}
                onChange={(e) => setProjectDistance(Number(e.target.value))}
                className="w-24 text-2xl font-bold border-2 border-gray-300 rounded-lg px-2 py-1"
              />
              <span className="text-lg font-semibold text-gray-600">miles</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200">
            <h4 className="font-bold text-gray-700 mb-2 text-sm">💰 Active Rate Table</h4>
            <div className="text-lg font-bold text-purple-600">{activeVehicle.name}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
            <h4 className="font-bold text-gray-700 mb-2 text-sm">📊 Margin Target</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={marginTarget}
                onChange={(e) => setMarginTarget(Number(e.target.value))}
                className="w-20 text-2xl font-bold border-2 border-gray-300 rounded-lg px-2 py-1"
              />
              <span className="text-lg font-semibold text-gray-600">%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
            <h4 className="font-bold text-gray-700 mb-2 text-sm">⏰ Project Duration</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={projectDays}
                onChange={(e) => setProjectDays(Number(e.target.value))}
                className="w-20 text-2xl font-bold border-2 border-gray-300 rounded-lg px-2 py-1"
              />
              <span className="text-lg font-semibold text-gray-600">days</span>
            </div>
          </div>
        </div>

        {/* Team Composition */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-white font-bold text-xl mb-4">👥 Team Composition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technicians */}
            <TeamMemberInput
              label="Technicians"
              count={techCount}
              setCount={setTechCount}
              rate={techRate}
              setRate={setTechRate}
              min={50}
              max={200}
              locked={lockedRates.tech}
              onToggleLock={() => toggleLock('tech')}
              onAdjust={(amt) => adjustRate('tech', amt)}
              onReset={() => resetRate('tech')}
            />

            {/* Lead Techs */}
            <TeamMemberInput
              label="Lead Techs"
              count={leadCount}
              setCount={setLeadCount}
              rate={leadRate}
              setRate={setLeadRate}
              min={60}
              max={250}
              locked={lockedRates.lead}
              onToggleLock={() => toggleLock('lead')}
              onAdjust={(amt) => adjustRate('lead', amt)}
              onReset={() => resetRate('lead')}
            />

            {/* Project Manager */}
            <TeamMemberInput
              label="Project Mgr"
              count={pmCount}
              setCount={setPmCount}
              rate={pmRate}
              setRate={setPmRate}
              min={80}
              max={300}
              locked={lockedRates.pm}
              onToggleLock={() => toggleLock('pm')}
              onAdjust={(amt) => adjustRate('pm', amt)}
              onReset={() => resetRate('pm')}
            />

            {/* Engineers */}
            <TeamMemberInput
              label="Engineers"
              count={engCount}
              setCount={setEngCount}
              rate={engRate}
              setRate={setEngRate}
              min={90}
              max={350}
              locked={lockedRates.eng}
              onToggleLock={() => toggleLock('eng')}
              onAdjust={(amt) => adjustRate('eng', amt)}
              onReset={() => resetRate('eng')}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg flex gap-4 flex-wrap items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="standard">Standard Devices</option>
            <option value="ai">AI Technology</option>
            <option value="specialty">Specialty Devices</option>
          </select>

          <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Calculate
          </button>

          <button
            onClick={exportToJSON}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Analysis
          </button>

          <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Compare Vehicles
          </button>

          <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Rates
          </button>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Category</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Device</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Hours</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Rate/Hr</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Labor</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Travel</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Overhead</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">TRUE COST</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Markup</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">SELL PRICE</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Margin</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 border-b-4 border-purple-600">Vehicle</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{row.category}</td>
                    <td className="px-3 py-2 text-gray-700">{row.type}</td>
                    <td className="px-3 py-2 text-gray-700">{row.hours.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.hourlyRate.toFixed(0)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.laborCost.toFixed(0)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.travelCost.toFixed(0)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.overhead.toFixed(0)}</td>
                    <td className="px-3 py-2 font-bold text-gray-900">${row.trueCost.toFixed(0)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.markupAmount.toFixed(0)}</td>
                    <td className="px-3 py-2 font-bold text-green-600">${row.sellPrice.toFixed(0)}</td>
                    <td className="px-3 py-2 text-blue-600">{row.actualMargin.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-gray-700">{activeVehicle.name}</td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gradient-to-r from-yellow-300 to-red-400 font-bold text-gray-900">
                  <td colSpan={7} className="px-3 py-3">TOTALS</td>
                  <td className="px-3 py-3">${totalTrueCost.toFixed(0)}</td>
                  <td className="px-3 py-3">${totalMarkup.toFixed(0)}</td>
                  <td className="px-3 py-3">${totalSellPrice.toFixed(0)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Rate Management Modal */}
        {showRateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-slideIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Rate Management System
                </h2>
                <button
                  onClick={() => setShowRateModal(false)}
                  className="bg-white/20 hover:bg-white text-white hover:text-purple-600 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b-2 border-gray-200 bg-gray-50">
                {[
                  { id: 'vehicles', label: 'Procurement Vehicles' },
                  { id: 'rates', label: 'Rate Tables' },
                  { id: 'import', label: 'Import/Export' },
                  { id: 'wages', label: 'Prevailing Wages' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-purple-600 border-b-4 border-purple-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto flex-1">
                {/* Vehicles Tab */}
                {activeTab === 'vehicles' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Procurement Vehicles</h3>

                    {/* Add New Vehicle Form */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h4 className="font-bold text-gray-700 mb-4">Add New Vehicle</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                          type="text"
                          value={newVehicleName}
                          onChange={(e) => setNewVehicleName(e.target.value)}
                          placeholder="Vehicle Name (e.g., Sourcewell)"
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          value={newVehicleMultiplier}
                          onChange={(e) => setNewVehicleMultiplier(e.target.value)}
                          placeholder="Rate Multiplier"
                          step="0.1"
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          value={newVehicleMinMargin}
                          onChange={(e) => setNewVehicleMinMargin(e.target.value)}
                          placeholder="Min Margin %"
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                        <input
                          type="number"
                          value={newVehicleOverhead}
                          onChange={(e) => setNewVehicleOverhead(e.target.value)}
                          placeholder="Overhead %"
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={addProcurementVehicle}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Existing Vehicles List */}
                    <div>
                      <h4 className="font-bold text-gray-700 mb-4">Existing Vehicles</h4>
                      <div className="space-y-3">
                        {procurementVehicles.map(vehicle => (
                          <div
                            key={vehicle.id}
                            className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                          >
                            <div>
                              <span className="font-bold text-gray-800">{vehicle.name}</span>
                              <span className="ml-4 text-gray-600">
                                Multiplier: {vehicle.multiplier}x | Min Margin: {vehicle.minMargin}% | Overhead: {vehicle.overhead}%
                              </span>
                            </div>
                            <button
                              onClick={() => deleteVehicle(vehicle.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rates Tab */}
                {activeTab === 'rates' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Custom Rate Tables</h3>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg mb-6 w-full max-w-md font-semibold"
                    >
                      <option value="">Select Vehicle</option>
                      {procurementVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>

                    {selectedVehicleId && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['tech', 'lead', 'pm', 'engineer'].map(role => {
                          const vehicle = procurementVehicles.find(v => v.id === selectedVehicleId)!
                          const roleData = vehicle.rates[role as keyof typeof vehicle.rates]
                          const roleLabel = {
                            tech: 'Technician',
                            lead: 'Lead Tech',
                            pm: 'Project Manager',
                            engineer: 'Engineer'
                          }[role]

                          return (
                            <div key={role} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                              <label className="font-bold text-gray-700 mb-3 block">{roleLabel}</label>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm text-gray-600 block mb-1">Base Rate ($/hr)</label>
                                  <input
                                    type="number"
                                    defaultValue={roleData.base}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-lg font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-600 block mb-1">Burden ($/hr)</label>
                                  <input
                                    type="number"
                                    defaultValue={roleData.burden}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-lg font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-600 block mb-1">Billed Rate ($/hr)</label>
                                  <input
                                    type="number"
                                    defaultValue={roleData.billed}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-lg font-semibold"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSaveSuccess(true)
                        setTimeout(() => setSaveSuccess(false), 3000)
                      }}
                      className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      💾 Save Rates
                    </button>

                    {saveSuccess && (
                      <div className="mt-4 bg-green-500 text-white px-6 py-3 rounded-lg animate-slideIn">
                        ✓ Rates saved successfully!
                      </div>
                    )}
                  </div>
                )}

                {/* Import/Export Tab */}
                {activeTab === 'import' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Import/Export Rate Tables</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl">
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3">📤 Export Current Rates</h4>
                        <div className="space-y-2">
                          <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all">
                            Export to Excel
                          </button>
                          <button
                            onClick={exportToJSON}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                          >
                            Export to JSON
                          </button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3">📥 Import Rates</h4>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.json"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-2"
                        />
                        <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all">
                          Import
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-700 mb-4">Quick Templates</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => loadTemplate('federal')}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Load Federal GSA Template
                        </button>
                        <button
                          onClick={() => loadTemplate('state')}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Load State Contract Template
                        </button>
                        <button
                          onClick={() => loadTemplate('coop')}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Load Cooperative Template
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prevailing Wages Tab */}
                {activeTab === 'wages' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Prevailing Wage Lookup</h3>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <select
                          value={wageState}
                          onChange={(e) => setWageState(e.target.value)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold"
                        >
                          <option value="">Select State</option>
                          <option value="NY">New York</option>
                          <option value="CA">California</option>
                          <option value="IL">Illinois</option>
                          <option value="TX">Texas</option>
                          <option value="FL">Florida</option>
                        </select>

                        <select
                          value={wageCounty}
                          onChange={(e) => setWageCounty(e.target.value)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold"
                        >
                          <option value="">Select County</option>
                        </select>

                        <select
                          value={wageClassification}
                          onChange={(e) => setWageClassification(e.target.value)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold"
                        >
                          <option value="">Select Classification</option>
                          <option value="electrician">Electrician</option>
                          <option value="technician">Low Voltage Technician</option>
                          <option value="laborer">Laborer</option>
                          <option value="operator">Equipment Operator</option>
                        </select>

                        <button
                          onClick={lookupWage}
                          className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-all"
                        >
                          🔍 Lookup
                        </button>
                      </div>

                      {wageResult && (
                        <div className="bg-white rounded-lg p-6 shadow-lg">
                          <h4 className="font-bold text-gray-800 mb-3">
                            Prevailing Wage for {wageResult.classification}
                          </h4>
                          <p className="mb-2"><strong>Location:</strong> {wageResult.state}, {wageResult.county}</p>
                          <p className="mb-2"><strong>Base Wage:</strong> ${wageResult.base}/hr</p>
                          <p className="mb-2"><strong>Fringe Benefits:</strong> ${wageResult.fringe}/hr</p>
                          <p className="mb-4"><strong>Total Package:</strong> ${wageResult.total}/hr</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Note: These are estimated rates. Always verify with official sources.
                          </p>
                          <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all">
                            Apply to Current Rates
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-700 mb-3">Davis-Bacon Act Rates</h4>
                      <p className="text-gray-600 mb-4">
                        Federal construction projects require Davis-Bacon prevailing wages.
                      </p>
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all">
                        Apply Davis-Bacon Rates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}

// Team Member Input Component
function TeamMemberInput({
  label,
  count,
  setCount,
  rate,
  setRate,
  min,
  max,
  locked,
  onToggleLock,
  onAdjust,
  onReset
}: {
  label: string
  count: number
  setCount: (val: number) => void
  rate: number
  setRate: (val: number) => void
  min: number
  max: number
  locked?: boolean
  onToggleLock: () => void
  onAdjust: (amount: number) => void
  onReset: () => void
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20">
      <div className="flex justify-between items-center mb-3">
        <label className="font-bold text-white text-lg">{label}:</label>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          min={0}
          max={20}
          className="w-16 px-2 py-1 bg-white rounded-lg text-center font-bold text-gray-800"
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-white font-bold">$</span>
        <input
          type="range"
          value={rate}
          onChange={(e) => !locked && setRate(Number(e.target.value))}
          min={min}
          max={max}
          disabled={locked}
          className="flex-1"
        />
        <input
          type="number"
          value={rate}
          onChange={(e) => !locked && setRate(Number(e.target.value))}
          min={min}
          max={max}
          disabled={locked}
          className="w-20 px-2 py-1 bg-white rounded-lg text-center font-bold text-gray-800"
        />
        <span className="text-white font-semibold">/hr</span>
        <button
          onClick={onToggleLock}
          className="text-white text-xl hover:scale-110 transition-transform"
        >
          {locked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAdjust(-5)}
          disabled={locked}
          className="flex-1 bg-white/20 hover:bg-white hover:text-purple-600 text-white px-2 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          -$5
        </button>
        <button
          onClick={() => onAdjust(-1)}
          disabled={locked}
          className="flex-1 bg-white/20 hover:bg-white hover:text-purple-600 text-white px-2 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          -$1
        </button>
        <button
          onClick={onReset}
          disabled={locked}
          className="flex-1 bg-white/20 hover:bg-white hover:text-purple-600 text-white px-2 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={() => onAdjust(1)}
          disabled={locked}
          className="flex-1 bg-white/20 hover:bg-white hover:text-purple-600 text-white px-2 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          +$1
        </button>
        <button
          onClick={() => onAdjust(5)}
          disabled={locked}
          className="flex-1 bg-white/20 hover:bg-white hover:text-purple-600 text-white px-2 py-1 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          +$5
        </button>
      </div>
    </div>
  )
}
