import React, { useState, useEffect, useRef } from 'react';
import Settings from './Settings';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

// Add styles for Toast animation
const styles = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

// Simple Button component as a placeholder
function Button({ children, isLoading, ...props }) {
  return (
    <button
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        background: 'var(--tiffany-blue)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        position: 'relative',
        overflow: 'hidden',
        minWidth: '120px',
      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          正在思考中...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// 簡單的齒輪 SVG icon
function GearIcon({ size = 28, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const DEFAULT_API_URL = '/api/messages';

const voiceProfiles = {
  cheerful: {
    pitch: 1.8,
    rate: 1.2,
    description: '🌞 活潑開朗',
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

// Toast component
function Toast({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <>
      <style>{styles}</style>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          zIndex: 1000,
          animation: 'fadeInOut 2s ease-in-out',
        }}
      >
        {message}
      </div>
    </>
  );
}

export default function VoiceChat() {
  const [chatLog, setChatLog] = useState([]);
  const [apiUrl, setApiUrl] = useState(
    () => sessionStorage.getItem('voicechat_api_url') || DEFAULT_API_URL
  );
  const [showSettings, setShowSettings] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(
    () => sessionStorage.getItem('voicechat_auto_speak') === 'true'
  );
  const [voiceProfile, setVoiceProfile] = useState(
    () => sessionStorage.getItem('voicechat_voice_profile') || 'mysterious'
  );
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const showSuccessToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      return alert('瀏覽器不支援語音辨識。');
    }

    if (listening) {
      SpeechRecognition.stopListening();
      showSuccessToast('已停止語音輸入');
      return;
    }

    SpeechRecognition.startListening({
      continuous: false,
      language: 'zh-TW',
    });
    showSuccessToast('開始語音輸入');
  };

  const stopAll = () => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showSuccessToast('已停止語音播報');
    } else if (listening) {
      SpeechRecognition.stopListening();
      showSuccessToast('已停止語音輸入');
    }
  };

  const handleSettingsSave = (newSettings) => {
    setApiUrl(newSettings.apiUrl);
    setAutoSpeak(newSettings.autoSpeak);
    setVoiceProfile(newSettings.voiceProfile);

    sessionStorage.setItem('voicechat_api_url', newSettings.apiUrl);
    sessionStorage.setItem('voicechat_auto_speak', newSettings.autoSpeak);
    sessionStorage.setItem('voicechat_voice_profile', newSettings.voiceProfile);

    setShowSettings(false);
    window.location.reload();
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'zh-TW';

    // Apply voice profile settings
    const profile = voiceProfiles[voiceProfile];
    if (profile) {
      utter.pitch = profile.pitch;
      utter.rate = profile.rate;
    }

    // iOS Safari specific handling
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // iOS requires user interaction to start speech
      utter.onstart = () => {
        setIsSpeaking(true);
        // iOS specific: resume speech if it was paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      };
    } else {
      utter.onstart = () => setIsSpeaking(true);
    }

    utter.onend = () => setIsSpeaking(false);
    utter.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    // iOS specific: ensure speech is not paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utter);
  };

  const sendToClaude = async (userMessage) => {
    setIsLoading(true);
    const newChatLog = [...chatLog, { sender: 'user', message: userMessage }];
    setChatLog(newChatLog);

    try {
      // Format chat log as multi-line string
      const formattedChatLog = newChatLog
        .map((msg) => {
          const prefix = msg.sender === 'user' ? 'User: ' : 'Assistant: ';
          return `${prefix}${msg.message}`;
        })
        .join('\n');

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          chatInput: formattedChatLog,
        }),
      });

      const data = await res.json();
      const reply =
        data.output.message || '沒有回應，有點慘，要再努力才行！！！';
      setChatLog([...newChatLog, { sender: 'claude', message: reply }]);
      if (autoSpeak) speak(reply);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatLog([
        ...newChatLog,
        { sender: 'claude', message: '發生錯誤，請稍後再試。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transcript changes with debounce
  useEffect(() => {
    if (transcript && !listening) {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        sendToClaude(transcript);
        resetTranscript();
      }, 300);
    }

    // Cleanup timer on unmount or when listening starts again
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transcript, listening]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleMessageClick = (message) => {
    speak(message);
  };

  const handleMessageLongPress = (message) => {
    navigator.clipboard.writeText(message);
    // You might want to add a visual feedback here
  };

  const testMessages = [
    '說個有趣，又不傷人的笑話',
    '分享一個你今天學到的新知識',
    '用一句話形容你現在的心情',
    '推薦一本你最近讀的好書',
    '分享一個你最近遇到的有趣事情',
    '分享一個你喜歡的電影或影集',
    '用一句話鼓勵正在努力的人',
  ];

  const getRandomTestMessage = () => {
    const randomIndex = Math.floor(Math.random() * testMessages.length);
    return testMessages[randomIndex];
  };

  return (
    <div
      style={{
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        paddingBottom: '80px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="p-4"
    >
      <Toast message={toastMessage} isVisible={showToast} />
      <h2
        className="text-xl font-bold mb-2 text-center"
        style={{
          color: 'var(--tiffany-blue)',
          flexShrink: 0,
        }}
      >
        尬聊阿伯
      </h2>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        initialSettings={{
          apiUrl,
          autoSpeak,
          voiceProfile,
        }}
      />

      <div
        className="flex-1 overflow-y-auto rounded-lg p-4"
        style={{
          background: 'rgba(230, 248, 247, 0.8)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)',
          width: '100%',
        }}
      >
        <div className="space-y-2 w-full">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={msg.sender === 'user' ? 'text-right' : 'text-left'}
              style={{ width: '100%' }}
            >
              <div
                className={`inline-block p-3 rounded-2xl shadow-sm max-w-[80%] ${
                  msg.sender === 'user' ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  background:
                    msg.sender === 'user' ? 'var(--tiffany-blue)' : '#b2ecea',
                  color: msg.sender === 'user' ? 'white' : '#222',
                  cursor: 'pointer',
                }}
                onClick={() => handleMessageClick(msg.message)}
                onTouchStart={() => {
                  const timer = setTimeout(() => {
                    handleMessageLongPress(msg.message);
                  }, 500);
                  document.addEventListener(
                    'touchend',
                    () => clearTimeout(timer),
                    { once: true }
                  );
                }}
              >
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div
        className="flex items-center gap-3"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            marginRight: 8,
            cursor: 'pointer',
          }}
          aria-label="設定"
        >
          <GearIcon size={32} style={{ color: 'var(--tiffany-blue)' }} />
        </button>
        <Button
          onClick={isSpeaking || listening ? stopAll : startListening}
          isLoading={isLoading}
          style={{
            minWidth: 120,
            fontWeight: 600,
            fontSize: '1.1rem',
            background:
              isSpeaking || listening ? '#5fdad4' : 'var(--tiffany-blue)',
          }}
        >
          {isSpeaking ? '停止播報' : listening ? '停止錄音' : '🎤 語音輸入'}
        </Button>
        <Button
          onClick={() => sendToClaude(getRandomTestMessage())}
          style={{
            minWidth: 120,
            fontWeight: 600,
            fontSize: '1.1rem',
            background: '#4CAF50',
          }}
        >
          🧪 隨機
        </Button>
      </div>
    </div>
  );
}
