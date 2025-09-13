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

const responseModes = {
  minimal: {
    description: '極簡',
    detail: '簡短回答，一兩句話',
  },
  concise: {
    description: '簡潔',
    detail: '中等長度，重點說明',
  },
  normal: {
    description: '一般',
    detail: '詳細回答，完整說明',
  },
};

export default function Settings({ isOpen, onClose, onSave, initialSettings }) {
  const [settings, setSettings] = useState({
    apiUrl: initialSettings?.apiUrl || '',
    autoSpeak: initialSettings?.autoSpeak || false,
    voiceProfile: initialSettings?.voiceProfile || 'calm',
    includeFullContext: initialSettings?.includeFullContext !== undefined ? initialSettings.includeFullContext : true,
    responseMode: initialSettings?.responseMode || 'normal',
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
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-primary">設定</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API URL Setting */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">API 伺服器網址</span>
            </label>
            <input
              type="text"
              name="apiUrl"
              value={settings.apiUrl}
              onChange={handleInputChange}
              className="input input-bordered w-full"
              placeholder="https://your-api.com/api/messages"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                留空則使用預設的 Cloudflare Workers API
              </span>
            </label>
          </div>

          {/* Voice Profile Setting */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">語音風格</span>
            </label>
            <select
              name="voiceProfile"
              value={settings.voiceProfile}
              onChange={handleInputChange}
              className="select select-bordered w-full"
            >
              {Object.entries(voiceProfiles).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.description}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                選擇語音播報的風格和語調
              </span>
            </label>
          </div>

          {/* Auto Speak Setting */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text font-semibold">自動語音播報</span>
              <input
                type="checkbox"
                name="autoSpeak"
                checked={settings.autoSpeak}
                onChange={handleInputChange}
                className="toggle toggle-primary"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                收到 AI 回應時自動播放語音
              </span>
            </label>
          </div>

          {/* Context Control Setting */}
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text font-semibold">發送完整對話歷史</span>
              <input
                type="checkbox"
                name="includeFullContext"
                checked={settings.includeFullContext}
                onChange={handleInputChange}
                className="toggle toggle-primary"
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                發送整個對話歷史給 AI
              </span>
            </label>
          </div>

          {/* Response Mode Setting */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">回應模式</span>
            </label>
            <select
              name="responseMode"
              value={settings.responseMode}
              onChange={handleInputChange}
              className="select select-bordered w-full"
            >
              {Object.entries(responseModes).map(([key, mode]) => (
                <option key={key} value={key}>
                  {mode.description} - {mode.detail}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-base-content/70">
                選擇 AI 回應的詳細程度
              </span>
            </label>
          </div>

          

          {/* Action Buttons */}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              儲存設定
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
