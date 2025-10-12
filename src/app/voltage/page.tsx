'use client'

import { useState } from 'react'
import ProtectedLayout from '@/components/ProtectedLayout'
import {
  Zap,
  Calculator,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function VoltageCalculatorPage() {
  const [voltage, setVoltage] = useState(12)
  const [current, setCurrent] = useState(0)
  const [distance, setDistance] = useState(0)
  const [wireGauge, setWireGauge] = useState(18)
  const [voltageDrop, setVoltageDrop] = useState<number | null>(null)
  const [dropPercentage, setDropPercentage] = useState<number | null>(null)

  // Wire resistance in ohms per 1000 feet (at 68°F/20°C)
  const wireResistance: Record<number, number> = {
    12: 1.588,
    14: 2.525,
    16: 4.016,
    18: 6.385,
    20: 10.15,
    22: 16.14
  }

  const calculateVoltageDrop = () => {
    // Formula: Voltage Drop = 2 × K × L × I / CM
    // Simplified: Voltage Drop = 2 × Resistance × Distance × Current / 1000

    const resistance = wireResistance[wireGauge]
    const drop = (2 * resistance * distance * current) / 1000
    const percentage = (drop / voltage) * 100

    setVoltageDrop(drop)
    setDropPercentage(percentage)
  }

  const isAcceptable = dropPercentage !== null && dropPercentage <= 3
  const isWarning = dropPercentage !== null && dropPercentage > 3 && dropPercentage <= 5
  const isCritical = dropPercentage !== null && dropPercentage > 5

  return (
    <ProtectedLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Voltage Drop Calculator</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
              Pro
            </span>
          </div>
          <p className="text-gray-600 text-lg">
            Calculate voltage drop for security system installations
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Industry Standard Recommendations
              </h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                For security camera and access control systems, voltage drop should not exceed <strong>3% for optimal performance</strong>.
                Maximum acceptable drop is <strong>5%</strong> before equipment may malfunction.
                Use larger wire gauge for longer cable runs.
              </p>
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Cable Parameters</h2>
          </div>

          <div className="space-y-6">
            {/* System Voltage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Voltage (V)
              </label>
              <select
                value={voltage}
                onChange={(e) => setVoltage(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              >
                <option value={12}>12V DC (Most Cameras)</option>
                <option value={24}>24V AC/DC (Access Control)</option>
                <option value={48}>48V DC (PoE)</option>
              </select>
            </div>

            {/* Current */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Draw (Amps)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 0.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical camera: 0.3-0.5A | IR camera: 0.5-1.0A | PTZ camera: 1.0-2.0A
              </p>
            </div>

            {/* Cable Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cable Run Distance (feet)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={distance}
                onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              />
            </div>

            {/* Wire Gauge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wire Gauge (AWG)
              </label>
              <select
                value={wireGauge}
                onChange={(e) => setWireGauge(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              >
                <option value={12}>12 AWG (Thickest - Lowest Resistance)</option>
                <option value={14}>14 AWG</option>
                <option value={16}>16 AWG</option>
                <option value={18}>18 AWG (Common for Cameras)</option>
                <option value={20}>20 AWG</option>
                <option value={22}>22 AWG (Thinnest - Highest Resistance)</option>
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateVoltageDrop}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold text-lg hover:opacity-90 transition-opacity shadow-lg"
            >
              <Zap className="w-6 h-6" />
              Calculate Voltage Drop
            </button>
          </div>
        </div>

        {/* Results */}
        {voltageDrop !== null && dropPercentage !== null && (
          <div className={`mt-8 rounded-xl p-8 shadow-lg border-2 ${
            isAcceptable
              ? 'bg-green-50 border-green-200'
              : isWarning
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4 mb-6">
              {isAcceptable ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-2xl font-bold mb-2 ${
                  isAcceptable ? 'text-green-900' : isWarning ? 'text-yellow-900' : 'text-red-900'
                }`}>
                  {isAcceptable ? 'Acceptable Voltage Drop' : isWarning ? 'Warning: High Voltage Drop' : 'Critical: Excessive Voltage Drop'}
                </h3>
                <p className={`text-sm ${
                  isAcceptable ? 'text-green-700' : isWarning ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {isAcceptable
                    ? 'This cable configuration meets industry standards for security installations.'
                    : isWarning
                    ? 'Voltage drop is higher than recommended. Equipment may function but performance could be affected.'
                    : 'Voltage drop exceeds safe limits. Equipment malfunction likely. Use thicker wire gauge or shorter cable run.'}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-lg ${
                isAcceptable ? 'bg-white' : isWarning ? 'bg-white' : 'bg-white'
              } border border-gray-200`}>
                <p className="text-sm font-medium text-gray-500 mb-2">Voltage Drop</p>
                <p className="text-4xl font-bold text-gray-900">{voltageDrop.toFixed(2)}V</p>
                <p className="text-sm text-gray-600 mt-2">
                  Output voltage: {(voltage - voltageDrop).toFixed(2)}V
                </p>
              </div>

              <div className={`p-6 rounded-lg ${
                isAcceptable ? 'bg-white' : isWarning ? 'bg-white' : 'bg-white'
              } border border-gray-200`}>
                <p className="text-sm font-medium text-gray-500 mb-2">Percentage Drop</p>
                <p className="text-4xl font-bold text-gray-900">{dropPercentage.toFixed(2)}%</p>
                <p className={`text-sm font-semibold mt-2 ${
                  isAcceptable ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {isAcceptable ? '✓ Within 3% standard' : isWarning ? '⚠ Above 3% recommended' : '✗ Exceeds 5% maximum'}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            {!isAcceptable && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {wireGauge > 14 && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Use a thicker wire gauge ({wireGauge - 2} AWG or lower) to reduce resistance</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Reduce the cable run distance if possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Consider using PoE (Power over Ethernet) for longer runs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Install a local power supply closer to the device</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}
