'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Key, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setOpenaiApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (openaiApiKey.trim()) {
        // Validate API key format
        if (!openaiApiKey.startsWith('sk-')) {
          setSaveMessage('Invalid API key format. OpenAI API keys should start with "sk-"');
          setSaving(false);
          return;
        }

        // Test the API key by making a simple request
        const testResponse = await fetch('/api/ai/test-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: openaiApiKey }),
        });

        if (testResponse.ok) {
          localStorage.setItem('openai_api_key', openaiApiKey);
          setSaveMessage('API key saved successfully!');
          
          // Trigger storage event for other tabs/components
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'openai_api_key',
            newValue: openaiApiKey
          }));
        } else {
          const error = await testResponse.json();
          setSaveMessage(`Invalid API key: ${error.message || 'Please check your key'}`);
        }
      } else {
        localStorage.removeItem('openai_api_key');
        setSaveMessage('API key removed');
      }
    } catch (error) {
      setSaveMessage('Error saving API key. Please try again.');
      console.error('Error saving API key:', error);
    }

    setSaving(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClearApiKey = () => {
    setOpenaiApiKey('');
    localStorage.removeItem('openai_api_key');
    setSaveMessage('API key cleared');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application settings and API keys</p>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <Key className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">OpenAI API Key</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Why do I need to provide my API key?</p>
              <p>For security reasons, we don't store API keys in the application code. Your key is stored locally in your browser and never sent to our servers permanently.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                id="openai-key"
                type={showApiKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveApiKey}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save API Key'}
            </button>

            <button
              onClick={handleClearApiKey}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Clear
            </button>
          </div>

          {saveMessage && (
            <div className={`p-3 rounded-md text-sm ${
              saveMessage.includes('successfully') || saveMessage.includes('removed') || saveMessage.includes('cleared')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Security & Privacy</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Your API key is stored locally in your browser only</li>
              <li>Keys are never permanently stored on our servers</li>
              <li>Keys are only sent to OpenAI's servers for processing your requests</li>
              <li>Clear your browser data to remove stored keys</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
