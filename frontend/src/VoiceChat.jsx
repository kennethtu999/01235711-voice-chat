import React, { useState, useEffect, useRef } from 'react';
import Settings from './Settings';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

const DEFAULT_API_URL = '/api/messages';

// 生成唯一對話ID
const generateConversationId = () => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 對話管理工具函數
const ConversationManager = {
  // 從localStorage載入對話歷史
  loadConversations: () => {
    try {
      const stored = localStorage.getItem('voicechat_conversations');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('載入對話歷史失敗:', error);
      return {};
    }
  },

  // 儲存對話歷史到localStorage
  saveConversations: (conversations) => {
    try {
      localStorage.setItem('voicechat_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('儲存對話歷史失敗:', error);
    }
  },

  // 新增對話
  createConversation: (conversations) => {
    const newId = generateConversationId();
    const newConversation = {
      id: newId,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    conversations[newId] = newConversation;
    return newConversation;
  },

  // 更新對話最後活動時間
  updateLastActive: (conversations, conversationId) => {
    if (conversations[conversationId]) {
      conversations[conversationId].lastActiveAt = new Date().toISOString();
    }
  }
};

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

// Toast component using DaisyUI's built-in system
function Toast({ message, isVisible, type = 'info' }) {
  if (!isVisible) return null;

  const alertType =
    {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-error',
    }[type] || 'alert-info';

  return (
    <div className="toast toast-top toast-center z-50">
      <div className={`alert ${alertType} shadow-lg`}>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function VoiceChat() {
  // 對話管理狀態
  const [conversations, setConversations] = useState(() => ConversationManager.loadConversations());
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  
  // 其他狀態
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
  const [includeFullContext, setIncludeFullContext] = useState(
    () => sessionStorage.getItem('voicechat_include_full_context') !== 'false'
  );
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('info');
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  
  // Detect if device is iPhone
  const isIPhone = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const showToastMessage = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // 初始化對話
  const initializeConversation = () => {
    if (!currentConversationId) {
      const newConversation = ConversationManager.createConversation(conversations);
      setConversations({ ...conversations, [newConversation.id]: newConversation });
      setCurrentConversationId(newConversation.id);
      setChatLog([]);
      ConversationManager.saveConversations({ ...conversations, [newConversation.id]: newConversation });
    }
  };

  // 開始新對話
  const startNewConversation = () => {
    const newConversation = ConversationManager.createConversation(conversations);
    const updatedConversations = { ...conversations, [newConversation.id]: newConversation };
    
    setConversations(updatedConversations);
    setCurrentConversationId(newConversation.id);
    setChatLog([]);
    ConversationManager.saveConversations(updatedConversations);
    showToastMessage('新對話已開始', 'success');
  };

  // 載入對話
  const loadConversation = (conversationId) => {
    const conversation = conversations[conversationId];
    if (conversation) {
      setCurrentConversationId(conversationId);
      setChatLog(conversation.messages);
      ConversationManager.updateLastActive(conversations, conversationId);
      ConversationManager.saveConversations(conversations);
    }
  };

  // 更新當前對話的訊息
  const updateCurrentConversation = (messages) => {
    if (currentConversationId && conversations[currentConversationId]) {
      const updatedConversations = {
        ...conversations,
        [currentConversationId]: {
          ...conversations[currentConversationId],
          messages: messages,
          lastActiveAt: new Date().toISOString()
        }
      };
      setConversations(updatedConversations);
      ConversationManager.saveConversations(updatedConversations);
    }
  };

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      return showToastMessage('瀏覽器不支援語音辨識', 'error');
    }

    if (listening) {
      SpeechRecognition.stopListening();
      showToastMessage('已停止語音輸入', 'info');
      return;
    }

    SpeechRecognition.startListening({
      continuous: false,
      language: 'zh-TW',
    });
    showToastMessage('開始語音輸入', 'success');
  };

  const stopAll = () => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      showToastMessage('已停止語音播報', 'info');
    } else if (listening) {
      SpeechRecognition.stopListening();
      showToastMessage('已停止語音輸入', 'info');
    }
  };

  const handleSettingsSave = (newSettings) => {
    setApiUrl(newSettings.apiUrl);
    setAutoSpeak(newSettings.autoSpeak);
    setVoiceProfile(newSettings.voiceProfile);
    setIncludeFullContext(newSettings.includeFullContext);

    sessionStorage.setItem('voicechat_api_url', newSettings.apiUrl);
    sessionStorage.setItem('voicechat_auto_speak', newSettings.autoSpeak);
    sessionStorage.setItem('voicechat_voice_profile', newSettings.voiceProfile);
    sessionStorage.setItem('voicechat_include_full_context', newSettings.includeFullContext);

    setShowSettings(false);
    showToastMessage('設定已儲存', 'success');
  };

  // 清除對話歷史 (現在改為開始新對話)
  const clearConversation = () => {
    startNewConversation();
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
      utter.onstart = () => {
        setIsSpeaking(true);
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

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utter);
  };

  const sendToClaude = async (userMessage) => {
    if (!userMessage.trim()) return;

    // 確保有當前對話
    if (!currentConversationId) {
      initializeConversation();
    }

    setIsLoading(true);
    const newChatLog = [...chatLog, { sender: 'user', message: userMessage }];
    setChatLog(newChatLog);
    updateCurrentConversation(newChatLog);

    try {
      // 根據設定決定發送的對話內容
      let chatToSend;
      if (includeFullContext) {
        // 發送完整對話歷史
        chatToSend = newChatLog;
      } else {
        // 只發送當前訊息
        chatToSend = [{ sender: 'user', message: userMessage }];
      }

      // Format chat log as multi-line string
      const formattedChatLog = chatToSend
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
          conversationId: currentConversationId,
          includeFullContext: includeFullContext,
        }),
      });

      const data = await res.json();
      const reply =
        data.output.message || '沒有回應，有點慘，要再努力才行！！！';
      const finalChatLog = [...newChatLog, { sender: 'claude', message: reply }];
      setChatLog(finalChatLog);
      updateCurrentConversation(finalChatLog);
      if (autoSpeak) speak(reply);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorChatLog = [
        ...newChatLog,
        { sender: 'claude', message: '發生錯誤，請稍後再試。' },
      ];
      setChatLog(errorChatLog);
      updateCurrentConversation(errorChatLog);
      showToastMessage('發送訊息時發生錯誤', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transcript changes with debounce
  useEffect(() => {
    if (transcript && !listening) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        sendToClaude(transcript);
        resetTranscript();
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transcript, listening]);

  // 初始化對話
  useEffect(() => {
    initializeConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleMessageClick = (message) => {
    speak(message);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendToClaude(textInput);
      setTextInput('');
    }
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
    <div className="h-screen bg-base-200 relative overflow-hidden">
      <Toast message={toastMessage} isVisible={showToast} type={toastType} />

      {/* Header - Fixed at top */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-300 fixed top-0 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-content font-bold text-sm">AI</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary">
                尬聊阿伯
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-none">
          <button
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setShowSettings(true)}
            title="設定"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area - Scrollable, positioned between header and input */}
      <div className="absolute top-16 bottom-28 sm:bottom-32 left-0 right-0 overflow-hidden p-2 sm:p-4 lg:p-6">
        <div className="h-full bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat ${
                    msg.sender === 'user' ? 'chat-end' : 'chat-start'
                  }`}
                >
                  <div className="chat-header text-xs font-medium text-base-content/60 mb-1">
                    {msg.sender === 'user' ? '您' : '尬聊阿伯'}
                  </div>
                  <div
                    className={`chat-bubble ${
                      msg.sender === 'user'
                        ? 'chat-bubble-primary'
                        : 'chat-bubble-secondary'
                    } cursor-pointer text-sm leading-relaxed max-w-xs sm:max-w-md`}
                    onClick={() => handleMessageClick(msg.message)}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="bg-base-100 shadow-sm border-t border-base-300 fixed bottom-0 left-0 right-0 z-20">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-4xl">
          {/* Text Input - Force single line */}
          <form
            onSubmit={handleTextSubmit}
            className="form-control mb-3 sm:mb-4"
          >
            <div className="flex w-full gap-2">
              <input
                type="text"
                placeholder="輸入您的訊息..."
                className="input input-bordered flex-1 text-base sm:text-lg focus:ring-2 focus:ring-primary/20 min-w-0 h-12 sm:h-14"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary flex-shrink-0 min-w-[60px] h-12 sm:h-14 text-base sm:text-lg"
                disabled={isLoading || !textInput.trim()}
              >
                發送
              </button>
            </div>
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-center mt-2">
                <span className="loading loading-dots loading-md mr-2"></span>
                <span className="text-sm text-base-content/70">正在思考中...</span>
              </div>
            )}
          </form>

          {/* Action Buttons - Three buttons in one row */}
          <div className="flex gap-2 w-full">
            {/* 新對話按鈕 */}
            <button
              className="btn btn-outline flex-1 h-12 sm:h-14 text-base sm:text-lg"
              onClick={clearConversation}
              disabled={isLoading}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 sm:ml-2 text-base sm:text-lg font-medium">新對話</span>
            </button>

            {/* 語音輸入按鈕 - iPhone隱藏 */}
            {!isIPhone && (
              <button
                className={`btn flex-1 h-12 sm:h-14 text-base sm:text-lg ${
                  isSpeaking || listening ? 'btn-warning' : 'btn-secondary'
                }`}
                onClick={isSpeaking || listening ? stopAll : startListening}
                disabled={isLoading}
              >
                {isSpeaking ? (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 sm:ml-2 text-base sm:text-lg font-medium">停止</span>
                  </>
                ) : listening ? (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 sm:ml-2 text-base sm:text-lg font-medium">
                      停止錄音
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 sm:ml-2 text-base sm:text-lg font-medium">
                      語音輸入
                    </span>
                  </>
                )}
              </button>
            )}

            {/* 隨機話題按鈕 */}
            <button
              className="btn btn-accent flex-1 h-12 sm:h-14 text-base sm:text-lg"
              onClick={() => sendToClaude(getRandomTestMessage())}
              disabled={isLoading}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 sm:ml-2 text-base sm:text-lg font-medium">隨機話題</span>
            </button>
          </div>
        </div>
      </div>

      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        initialSettings={{
          apiUrl,
          autoSpeak,
          voiceProfile,
          includeFullContext,
        }}
      />
    </div>
  );
}
