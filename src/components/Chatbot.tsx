import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, User, HelpCircle, Minimize2 } from 'lucide-react';
import { apiFetch } from '../utils';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: "Hi there! I am **CampusEvent AI**, your personal symposium companion. Ask me anything about events, eligibility, registration status, fees, or timings, and I will find you the best matches instantly!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim()) return;

    if (!textToSend) {
      setInputText('');
    }

    const userMsgId = `user-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: messageContent }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: messageContent })
      });

      setMessages([
        ...newMessages,
        { id: `ai-${Date.now()}`, sender: 'ai', text: data.reply || "I didn't quite catch that. Could you ask again or try different keywords?" }
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: "I'm having a small connection issue right now. Feel free to browse all workshops, hackathons, and contests using our handy search and filters!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What events are available?",
    "Suggest an event for beginners.",
    "Which events are free?",
    "Show my registration status."
  ];

  // Helper to parse double asterisks for bolding and dash bullets in AI replies safely
  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bullets parsing
      let isBullet = false;
      let cleanLine = line;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      }

      // Bold text formatting with **
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-blue-900 dark:text-blue-300">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      const formattedParts = parts.length > 0 ? parts : [cleanLine];

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc mb-1 text-slate-700 dark:text-slate-300">
            {formattedParts}
          </li>
        );
      } else {
        return (
          <p key={idx} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed">
            {formattedParts}
          </p>
        );
      }
    });
  };

  return (
    <div id="ai-chatbot-widget" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating launcher button */}
      {!isOpen && (
        <button
          id="ai-chat-launcher"
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition relative group"
          title="CampusEvent AI Companion"
        >
          <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md transition font-semibold">
            Ask CampusEvent AI!
          </span>
        </button>
      )}

      {/* Expanded chat interface */}
      {isOpen && (
        <div 
          id="ai-chat-box" 
          className="w-80 sm:w-96 h-[500px] bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slideup"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 p-4 text-white flex justify-between items-center relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-15" />
            <div className="flex items-center space-x-2.5 relative">
              <div className="bg-blue-500/20 border border-blue-500/30 p-1.5 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-sm">CampusEvent AI</p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] text-blue-200">Active assistant</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 relative">
              <button
                id="ai-chat-minimize"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Minimize Panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                id="ai-chat-close"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/40 dark:bg-slate-900/30 text-xs" id="chat-messages-container">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user' 
                      ? 'bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-900 text-blue-600' 
                      : 'bg-indigo-100 border-indigo-200 dark:bg-slate-800 dark:border-slate-700 text-indigo-600'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className={`p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xs rounded-tl-none'
                  }`}>
                    {msg.sender === 'user' ? (
                      <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert">
                        {formatText(msg.text)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-3 rounded-2xl shadow-xs rounded-tl-none max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-gray-400">GenAI thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt chips suggestions */}
          <div className="px-4 py-2 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-1.5" id="chat-prompt-chips">
            {quickPrompts.map((p, i) => (
              <button
                id={`chip-btn-${i}`}
                key={i}
                onClick={() => handleSend(p)}
                className="text-[10px] font-medium bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-full transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* User Input controls */}
          <div className="p-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center space-x-2 shrink-0">
            <input
              id="ai-chat-input"
              type="text"
              placeholder="Ask me about symposium events..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
            />
            <button
              id="ai-chat-send"
              onClick={() => handleSend()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 transition cursor-pointer shrink-0"
              title="Send Prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
