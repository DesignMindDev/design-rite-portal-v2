'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Camera, Network, Wrench, Key, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SystemSurveyorIntegrationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'api'>('upload');

  // Excel Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // API Configuration State
  const [apiToken, setApiToken] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState(false);

  // --- Excel Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://design-rite.com/api/system-surveyor/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleProceedToAI = () => {
    if (!uploadResult) return;

    // Store the imported data in sessionStorage for AI Assistant
    sessionStorage.setItem('systemSurveyorImport', JSON.stringify(uploadResult));

    // Navigate to main platform AI Assistant
    window.location.href = 'https://design-rite.com/ai-assistant?source=system-surveyor&imported=true';
  };

  // --- API Configuration Handlers ---
  const handleTestApi = async () => {
    if (!apiToken.trim()) {
      setApiError('Please enter an API token');
      return;
    }

    setTestingApi(true);
    setApiError(null);
    setApiSuccess(false);

    try {
      const response = await fetch('https://design-rite.com/api/system-surveyor/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API authentication failed');
      }

      setApiSuccess(true);
      // Store token in session storage
      sessionStorage.setItem('ss_api_token', apiToken);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'API test failed');
    } finally {
      setTestingApi(false);
    }
  };

  const handleProceedToImport = () => {
    // Navigate to main platform import page
    window.location.href = 'https://design-rite.com/integrations/system-surveyor/import';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <FileSpreadsheet className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              System Surveyor Integration
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect your System Surveyor account or upload Excel exports to generate professional security proposals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`
              flex-1 px-6 py-3 rounded-md font-semibold transition-all
              ${activeTab === 'upload'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Upload className="w-5 h-5 inline-block mr-2" />
            Excel Upload
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`
              flex-1 px-6 py-3 rounded-md font-semibold transition-all
              ${activeTab === 'api'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Key className="w-5 h-5 inline-block mr-2" />
            API Configuration
          </button>
        </div>

        {/* Excel Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            {!uploadResult ? (
              <>
                {/* File Upload Area */}
                <div className="mb-8">
                  <label
                    htmlFor="file-upload"
                    className={`
                      flex flex-col items-center justify-center
                      border-2 border-dashed rounded-lg p-12
                      cursor-pointer transition-all
                      ${file ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'}
                    `}
                  >
                    <Upload className={`w-16 h-16 mb-4 ${file ? 'text-purple-600' : 'text-gray-400'}`} />
                    <p className="text-lg font-semibold mb-2 text-gray-900">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500">
                      System Surveyor Excel export (.xlsx, .xls)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Upload Failed</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2
                    ${!file || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                    }
                  `}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Process
                    </>
                  )}
                </button>

                {/* Info Box */}
                <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    What we'll extract:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Site information and survey details</li>
                    <li>✓ Camera locations and specifications</li>
                    <li>✓ Network equipment inventory</li>
                    <li>✓ Infrastructure and cabling</li>
                    <li>✓ Installation labor hours</li>
                    <li>✓ Access control devices</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Upload Success - Show Summary */}
                <div className="text-center mb-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">Import Successful!</h2>
                  <p className="text-gray-600">
                    Processed {uploadResult.rawDataCount} rows from {uploadResult.siteInfo.siteName}
                  </p>
                </div>

                {/* Site Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-2 text-gray-900">Site Information</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="text-gray-500">Name:</span> {uploadResult.siteInfo.siteName}</p>
                    <p><span className="text-gray-500">Address:</span> {uploadResult.siteInfo.address}</p>
                    <p><span className="text-gray-500">Survey:</span> {uploadResult.siteInfo.surveyName}</p>
                  </div>
                </div>

                {/* Equipment Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <Camera className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{uploadResult.equipment.cameras.length}</div>
                    <div className="text-sm text-gray-600">Cameras</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <Network className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{uploadResult.equipment.network.length}</div>
                    <div className="text-sm text-gray-600">Network</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <Wrench className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{uploadResult.totals.totalInstallHours}h</div>
                    <div className="text-sm text-gray-600">Labor</div>
                  </div>
                </div>

                {/* Totals */}
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Equipment</div>
                      <div className="text-2xl font-bold text-gray-900">{uploadResult.totals.totalItems} items</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Est. Labor Cost</div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${uploadResult.totals.estimatedLaborCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proceed Button */}
                <button
                  onClick={handleProceedToAI}
                  className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
                >
                  Continue to AI Assistant
                  <ArrowRight className="w-5 h-5" />
                </button>

                {/* Upload Another */}
                <button
                  onClick={() => {
                    setFile(null);
                    setUploadResult(null);
                    setError(null);
                  }}
                  className="w-full py-3 px-6 rounded-lg font-semibold mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Upload Another File
                </button>
              </>
            )}
          </div>
        )}

        {/* API Configuration Tab */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">System Surveyor API Access</h2>
              <p className="text-gray-600">
                Connect directly to your System Surveyor account to browse and import surveys
              </p>
            </div>

            {/* API Token Input */}
            <div className="mb-6">
              <label htmlFor="api-token" className="block text-sm font-semibold text-gray-700 mb-2">
                API Token
              </label>
              <input
                id="api-token"
                type="password"
                value={apiToken}
                onChange={(e) => {
                  setApiToken(e.target.value);
                  setApiError(null);
                  setApiSuccess(false);
                }}
                placeholder="Enter your System Surveyor API token"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Error Display */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800">Authentication Failed</p>
                  <p className="text-sm text-red-600">{apiError}</p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {apiSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Connection Successful!</p>
                  <p className="text-sm text-green-600">Your API token is valid. You can now browse your surveys.</p>
                </div>
              </div>
            )}

            {/* Test API Button */}
            {!apiSuccess && (
              <button
                onClick={handleTestApi}
                disabled={!apiToken.trim() || testingApi}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2
                  ${!apiToken.trim() || testingApi
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  }
                `}
              >
                {testingApi ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5" />
                    Test API Connection
                  </>
                )}
              </button>
            )}

            {/* Proceed to Import Button */}
            {apiSuccess && (
              <button
                onClick={handleProceedToImport}
                className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                Browse Surveys
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            {/* Info Box */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
                <Key className="w-5 h-5 text-blue-600" />
                How to get your API token:
              </h3>
              <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                <li>Log in to your System Surveyor account</li>
                <li>Navigate to Account Settings → API Access</li>
                <li>Generate a new API token or copy your existing token</li>
                <li>Paste the token above and click "Test API Connection"</li>
              </ol>
            </div>
          </div>
        )}

        {/* Partnership Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Powered by <span className="text-purple-600 font-semibold">System Surveyor</span> integration
          </p>
          <p className="mt-2">
            Professional field surveys meet AI-powered proposals
          </p>
        </div>
      </div>
    </div>
  );
}
