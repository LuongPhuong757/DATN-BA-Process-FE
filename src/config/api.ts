// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4003',
  
  // OpenAI API Configuration
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || '',
  
  // Environment
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
  
  // API Endpoints
  ENDPOINTS: {
    // Database operations
    SAVE_TO_DATABASE: '/api/save-to-database',
    GET_PROJECTS: '/api/projects',
    GET_PROJECT_BY_ID: '/api/projects',
    
    // OpenAI API
    OPENAI_CHAT_COMPLETIONS: 'https://api.openai.com/v1/chat/completions',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get OpenAI API URL
export const getOpenAIUrl = (): string => {
  return API_CONFIG.ENDPOINTS.OPENAI_CHAT_COMPLETIONS;
};

export default API_CONFIG;
