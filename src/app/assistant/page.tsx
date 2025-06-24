'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, MessageSquare, Plus, ChevronDown, Clock } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  logsAnalyzed?: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function AssistantPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current chat
  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('ai-assistant-chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        // Sort chats by updatedAt to get the most recent first
        const sortedChats = parsedChats.sort((a: Chat, b: Chat) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setChats(sortedChats);
        
        // Set the most recent chat as active
        if (sortedChats.length > 0) {
          setCurrentChatId(sortedChats[0].id);
        }
      } catch (error) {
        console.error('Error parsing saved chats:', error);
        localStorage.removeItem('ai-assistant-chats');
        createNewChat();
      }
    } else {
      // Create initial welcome chat
      createNewChat();
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0) {
      try {
        localStorage.setItem('ai-assistant-chats', JSON.stringify(chats));
      } catch (error) {
        console.error('Error saving chats to localStorage:', error);
      }
    }
  }, [chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // Close chat list when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showChatList) {
        setShowChatList(false);
      }
    };

    if (showChatList) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showChatList]);

  // Check for API key on mount and when localStorage changes
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = localStorage.getItem('openai_api_key');
      setHasApiKey(!!apiKey && apiKey.startsWith('sk-'));
    };
    
    checkApiKey();
    
    // Listen for storage changes
    window.addEventListener('storage', checkApiKey);
    return () => window.removeEventListener('storage', checkApiKey);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewChat = () => {
    if (isCreatingChat) return;
    
    setIsCreatingChat(true);
    
    let newChatId: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        newChatId = crypto.randomUUID();
      } else {
        newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${performance.now().toString(36)}`;
      }
      attempts++;
    } while (chats.some(chat => chat.id === newChatId) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      console.error('Failed to generate unique chat ID after multiple attempts');
      setIsCreatingChat(false);
      return;
    }
    
    const now = new Date().toISOString();
    const welcomeMessage: Message = {
      role: 'assistant',
      content: 'Hello! How can I help you with your construction project today?',
      timestamp: now
    };

    const newChat: Chat = {
      id: newChatId,
      title: 'New Conversation',
      messages: [welcomeMessage],
      createdAt: now,
      updatedAt: now
    };

    setChats(prev => {
      const exists = prev.some(chat => chat.id === newChatId);
      if (exists) {
        console.warn('Chat with this ID already exists:', newChatId);
        setIsCreatingChat(false);
        return prev;
      }
      return [newChat, ...prev];
    });
    setCurrentChatId(newChatId);
    setShowChatList(false);
    setIsCreatingChat(false);
  };

  // Updated function to switch to a specific chat
  const switchToChat = (chatId: string) => {
    if (currentChatId !== chatId) {
      setCurrentChatId(chatId);
      setShowChatList(false);
      // Messages will automatically update due to currentChat dependency
      setTimeout(() => scrollToBottom(), 100); // Small delay to ensure messages are rendered
    }
  };

  const deleteChat = (chatId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent switching to chat when deleting
    }
    
    setChats(prev => {
      const updated = prev.filter(chat => chat.id !== chatId);
      
      // If we're deleting the current chat, switch to another one
      if (currentChatId === chatId) {
        if (updated.length > 0) {
          setCurrentChatId(updated[0].id);
        } else {
          // No chats left, create a new one
          setCurrentChatId(null);
          setTimeout(createNewChat, 100);
        }
      }
      
      return updated;
    });
  };

  const updateChatTitle = (chatId: string, firstMessage: string) => {
    const title = firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...' 
      : firstMessage;
    
    setChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title, updatedAt: new Date().toISOString() }
          : chat
      );
      return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  };

  const updateChatWithMessage = (chatId: string, newMessage: Message) => {
    setChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, newMessage],
              updatedAt: new Date().toISOString()
            }
          : chat
      );
      return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
  };

  // Function to detect and execute AI actions based on user message
  const detectAndExecuteActions = async (message: string, aiResponse: string) => {
    // Simple pattern matching to detect action requests
    const actionPatterns = [
      {
        pattern: /mark.*action.*item.*#?(\d+).*(?:as\s+)?(completed|done|finished)/i,
        type: 'update_action_item_status',
        extractData: (match: RegExpMatchArray) => ({
          actionItemId: match[1],
          status: 'completed'
        })
      },
      {
        pattern: /(?:update|change|set).*priority.*(?:of|for).*#?(\d+).*(?:to\s+)?(urgent|high|medium|low)/i,
        type: 'update_action_item_priority',
        extractData: (match: RegExpMatchArray) => ({
          actionItemId: match[1],
          priority: match[2].toLowerCase()
        })
      },
      {
        pattern: /assign.*#?(\d+).*(?:to\s+)(.+?)(?:\s|$)/i,
        type: 'assign_action_item',
        extractData: (match: RegExpMatchArray) => ({
          actionItemId: match[1],
          assignedTo: match[2].trim()
        })
      },
      {
        pattern: /add.*note.*(?:to\s+)?(?:action.*item\s+)?#?(\d+).*?[:"'](.+)[:"']?/i,
        type: 'add_action_item_note',
        extractData: (match: RegExpMatchArray) => ({
          actionItemId: match[1],
          note: match[2].trim()
        })
      },
      {
        pattern: /(?:set|update).*due.*date.*(?:for|of).*#?(\d+).*(?:to\s+)?(\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2}(?:,\s+\d{4})?)/i,
        type: 'update_action_item_due_date',
        extractData: (match: RegExpMatchArray) => {
          let dueDate = match[2];
          // Simple date parsing - you might want to make this more sophisticated
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            // Convert relative dates like "next Friday" to ISO format
            // This is a simplified implementation
            const today = new Date();
            if (dueDate.toLowerCase().includes('friday')) {
              const friday = new Date(today);
              friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
              dueDate = friday.toISOString().split('T')[0];
            } else if (dueDate.toLowerCase().includes('monday')) {
              const monday = new Date(today);
              monday.setDate(today.getDate() + (1 - today.getDay() + 7) % 7);
              dueDate = monday.toISOString().split('T')[0];
            }
          }
          return {
            actionItemId: match[1],
            dueDate
          };
        }
      }
    ];

    for (const pattern of actionPatterns) {
      const match = message.match(pattern.pattern);
      if (match) {
        try {
          const actionData = pattern.extractData(match);
          const action = {
            type: pattern.type,
            data: actionData
          };

          const actionResponse = await fetch('/api/ai-actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action,
              userId: 'current_user'
            }),
          });

          const actionResult = await actionResponse.json();
          
          if (actionResult.success) {
            // Update the AI response to include confirmation
            return aiResponse + '\n\n✅ **Action Completed**: ' + actionResult.message;
          } else {
            // Add error message to AI response
            return aiResponse + '\n\n❌ **Action Failed**: ' + actionResult.error;
          }
        } catch (error) {
          console.error('Error executing action:', error);
          return aiResponse + '\n\n❌ **Action Failed**: Unable to execute the requested action.';
        }
      }
    }

    return aiResponse; // No actions detected, return original response
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading || !currentChatId) return;
    
    const currentQuery = query.trim();
    const userMessage: Message = {
      role: 'user',
      content: currentQuery,
      timestamp: new Date().toISOString()
    };

    // Add user message to current chat
    updateChatWithMessage(currentChatId, userMessage);

    // Update chat title if this is the first user message
    const currentChatMessages = currentChat?.messages || [];
    if (currentChatMessages.filter(m => m.role === 'user').length === 0) {
      updateChatTitle(currentChatId, currentQuery);
    }
    
    setQuery('');
    setIsLoading(true);

    try {
      const conversationHistory = currentChat?.messages || [];
      
      // Get API key from localStorage
      const apiKey = localStorage.getItem('openai_api_key');
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentQuery,
          sessionId: currentChatId,
          userId: 'current_user',
          conversationHistory: conversationHistory.slice(-10),
          apiKey: apiKey
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
      
      const data = await response.json();
      
      // Check for and execute any actions based on the user's message
      const enhancedResponse = await detectAndExecuteActions(currentQuery, data.response);
      
      const aiMessage: Message = {
        role: 'assistant',
        content: enhancedResponse,
        timestamp: new Date().toISOString()
      };

      updateChatWithMessage(currentChatId, aiMessage);
      
    } catch (error: any) {
      console.error('Error fetching AI response:', error);
      let errorMessage = 'Sorry, I encountered an error processing your request.';
      
      if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your billing or try again later.';
      } else if (error.message.includes('key')) {
        errorMessage = 'OpenAI API key issue. Please check your configuration.';
      }
      
      const errorAiMessage: Message = {
        role: 'assistant',
        content: errorMessage + ' Please try again or contact support.',
        timestamp: new Date().toISOString()
      };

      updateChatWithMessage(currentChatId, errorAiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex max-w-7xl mx-auto w-full p-4 gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            AI Assistant
          </h1>
          <div className="text-sm text-gray-500">
            Powered by the latest AI technology in the entire galitonic universe
          </div>
        </div>

        {/* API Key Warning */}
        {!hasApiKey && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  OpenAI API Key Required
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <p>
                    To use the AI Assistant, you need to provide your OpenAI API key. 
                    <a href="/settings" className="font-medium underline hover:text-yellow-800 ml-1">
                      Go to Settings
                    </a> to add your API key.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      
        {/* Chat Messages Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 overflow-y-auto min-h-[400px]">
          <div className="flex flex-col space-y-4">
            {currentChat?.messages.map((message: Message, index: number) => (
              <div 
                key={`${currentChatId}-message-${index}-${message.timestamp}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.logsAnalyzed !== undefined && (
                    <div className="text-xs text-gray-500 mt-2">
                      Analyzed {message.logsAnalyzed} recent logs
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-4 bg-gray-100 text-gray-800 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing your construction data...
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hasApiKey 
              ? "Ask me anything about your construction logs, safety, productivity, schedules..."
              : "Please add your OpenAI API key in Settings to use the AI Assistant"
            }
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={isLoading || !hasApiKey}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim() || !hasApiKey}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        
        <div className="text-xs text-gray-500 mt-3 text-center">
          💡 <strong>Tip:</strong> Ask specific questions about safety, productivity, weather impacts, or schedule analysis for better insights.
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            ⚡ Quick Actions
            <span className="text-xs text-gray-500">(Click to insert command)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={() => setQuery("Show me all overdue action items")}
              className="p-2 bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 transition-colors text-left"
            >
              📋 Show Overdue Items
            </button>
            <button
              onClick={() => setQuery("What action items need attention today?")}
              className="p-2 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-100 transition-colors text-left"
            >
              ⚠️ Today's Priorities
            </button>
            <button
              onClick={() => setQuery("Show me recent daily log activity")}
              className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors text-left"
            >
              📊 Recent Activity
            </button>
            <button
              onClick={() => setQuery("What projects need the most attention?")}
              className="p-2 bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100 transition-colors text-left"
            >
              🎯 Project Focus
            </button>
          </div>
          
          <div className="mt-3 text-xs text-gray-600">
            <strong>Database Actions:</strong> Try commands like "Mark action item #123 as completed" or "Change priority of item #456 to urgent"
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={createNewChat}
            disabled={isCreatingChat}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {isCreatingChat ? 'Creating...' : 'New Chat'}
          </button>
        </div>
      </div>

      {/* Conversations Sidebar */}
      <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">Conversations</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {chats.length}
          </span>
        </div>
        
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`relative group rounded-lg border transition-colors ${
                currentChatId === chat.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'hover:bg-gray-50 border-gray-100'
              }`}
            >
              <button
                onClick={() => switchToChat(chat.id)}
                className="w-full text-left p-3 rounded-lg"
              >
                <div className="font-medium text-gray-900 truncate text-sm">
                  {chat.title}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {new Date(chat.updatedAt).toLocaleDateString()} at {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                </div>
              </button>
              
              {/* Delete button */}
              {chats.length > 1 && (
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  title="Delete conversation"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {chats.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
              No conversations yet.
              <br />
              Start by asking a question!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
