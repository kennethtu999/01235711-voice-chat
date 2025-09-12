import React, { useState, useEffect } from 'react';

const voiceProfiles = {
  cheerful: {
    pitch: 1.1,
    rate: 0.9,
    description: '🌞 自然開朗',
  },
  calm: {
    pitch: 0.9,
    rate: 0.9,
    description: '🧘‍♀️ 溫柔平靜',
  },
  serious: {
    pitch: 1.0,
    rate: 0.8,
    description: '🧑‍🏫 正經講解',
  },
  mysterious: {
    pitch: 0.6,
    rate: 0.95,
    description: '🕵️‍♂️ 低沉神秘',
  },
};

export default function Settings({ isOpen, onClose, onSave, initialSettings }) {
  const [settings, setSettings] = useState({
    apiUrl: initialSettings?.apiUrl || '',
    autoSpeak: initialSettings?.autoSpeak || false,
    voiceProfile: initialSettings?.voiceProfile || 'calm',
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-gray-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          style={{
            fontSize: '20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h2
          className="text-xl font-bold mb-4"
          style={{ color: 'var(--tiffany-blue)' }}
        >
          設定
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700">API 伺服器網址</label>
            <input
              type="text"
              name="apiUrl"
              value={settings.apiUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-xl text-gray-700 bg-[#e6f8f7]"
              style={{ borderColor: 'var(--tiffany-blue)' }}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-gray-700">語音風格</label>
            <select
              name="voiceProfile"
              value={settings.voiceProfile}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-xl text-gray-700 bg-[#e6f8f7]"
              style={{ borderColor: 'var(--tiffany-blue)' }}
            >
              {Object.entries(voiceProfiles).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.description}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              id="auto-speak"
              type="checkbox"
              name="autoSpeak"
              checked={settings.autoSpeak}
              onChange={handleInputChange}
              className="accent-[var(--tiffany-blue)]"
            />
            <label htmlFor="auto-speak" className="text-gray-700">
              自動語音播報
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl text-white font-semibold"
            style={{ background: 'var(--tiffany-blue)' }}
          >
            儲存設定
          </button>
        </form>
      </div>
    </div>
  );
}
