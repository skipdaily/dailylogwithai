// Types for AI Conversation System

export interface Conversation {
  id: string;
  session_id?: string;
  user_id?: string;
  project_id?: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  token_count?: number;
  model_used?: string;
  response_time_ms?: number;
  metadata?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    [key: string]: any;
  };
  created_at: string;
}

export interface ConversationContext {
  id: string;
  conversation_id: string;
  context_type: string;
  context_data: {
    [key: string]: any;
  };
  created_at: string;
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  sessionId: string;
  metadata?: {
    responseTime: number;
    tokenCount?: number;
  };
}
