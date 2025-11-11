import { ProcessedItem, ProcessedItemWithoutId } from '../components/shared/ResultDisplay';
import { getApiUrl } from '../config/api';

// Interface for ChatGPT API request
interface ChatGPTRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens: number;
  temperature: number;
}

// Interface for ChatGPT API response
interface ChatGPTResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    total_tokens?: number;
    completion_tokens?: number;
  };
}

export class ChatGPTService {
  private apiKey: string;
  private baseUrl: string;
  private isValidApiKey: boolean;

  constructor() {
    // In production, these should come from environment variables
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Check if API key is valid format
    this.isValidApiKey = this.apiKey.startsWith('sk-') && this.apiKey.length > 20;
  }

  /**
   * Process image using ChatGPT Vision API
   * @param imageFile - The image file to process
   * @returns Promise with processed results
   */
  async processImage(imageFile: File): Promise<ProcessedItem[]> {
    if (!this.isValidApiKey) {
      throw new Error('OpenAI API key not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file.');
    }

    console.log('Processing image with ChatGPT API');
    const base64Image = await this.convertFileToBase64(imageFile);
    return await this.callChatGPTAPI(base64Image);
  }

  /**
   * Convert file to base64 for API transmission
   */
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Call ChatGPT API with image
   */
  private async callChatGPTAPI(base64Image: string, retryCount: number = 0): Promise<ProcessedItem[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: ChatGPTRequest = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Business Analyst (BA) analyzing a UI/UX interface. 

Your task: Look at the image from a BA perspective, count all red boxes, and extract complete information for each red box.

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": 1,
    "order": 1,
    "content": "Content from red box #1",
    "type": "Input|Button|Label|Text|Link|Icon|Table|Form",
    "database": "appropriate_database_name",
    "description": "Mô tả nghiệp vụ bằng tiếng Việt: phần tử này làm gì, mục đích và hành vi mong đợi",
    "dataType": "string|number|email|phone|url|date|boolean|json",
    "dbField": "snake_case_field_name"
  }
]

IMPORTANT: The "description" field MUST be written in Vietnamese (tiếng Việt) and follow these specific formats based on the element type:

- If type is "Label" or "Text": "Hiển thị label '[nội dung label]'" - describe what text is displayed, its purpose, and any formatting requirements.

- If type is "Button": "Hiển thị button như mock up" - describe the button's label, action, style (primary/secondary/outline), size, and what happens when clicked. Include any validation or confirmation steps if applicable.

- If type is "Select" or "Dropdown": "Hiển thị pulldown+icon sổ lên/sổ xuống như mock up. Pulldown gồm các giá trị: {[danh sách các giá trị]}." - list all available options, default value, whether it's searchable, multi-select, and any dependencies on other fields.

- For "Input" fields: Describe the input type (text, number, email, etc.), placeholder text, validation rules, max length, format requirements, and any auto-complete or suggestions.

- For "Table": Describe the columns, sorting capabilities, pagination, filtering options, and any row actions.

- For "Form": Describe the form structure, required fields, validation rules, submit behavior, and error handling.

- For "Link": Describe the link text, destination, whether it opens in new tab, and any special styling.

- For "Icon": Describe the icon type, its meaning, size, color, and any interactive behavior (hover, click).

Make the description detailed and comprehensive so that developers and testers can understand exactly what needs to be implemented. Include all relevant specifications that are commonly used in similar systems. Be specific about behavior, validation, styling, and user interactions.

The array length MUST equal the EXACT number of red boxes you counted.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Hãy nhìn hình ảnh dưới góc độ của BA, có bao nhiêu ô màu đỏ thì lấy ra đầy đủ thông tin của các ô đỏ đó.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Try to parse error response from API
      let errorMessage = `ChatGPT API error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          const apiError = errorData.error;
          errorMessage = apiError.message || errorMessage;
          
          // Add error type and code for better error handling
          if (apiError.type) {
            errorMessage = `${apiError.type}: ${errorMessage}`;
          }
          if (apiError.code) {
            errorMessage = `${errorMessage} (Code: ${apiError.code})`;
          }
        }
      } catch (e) {
        // If error response is not JSON, use status text
        errorMessage = `ChatGPT API error: ${response.status} - ${response.statusText || errorMessage}`;
      }
      throw new Error(errorMessage);
    }

    const data: ChatGPTResponse = await response.json();
    const choice = data.choices[0];
    const content = choice?.message?.content;
    const finishReason = choice?.finish_reason;
    
    if (!content) {
      throw new Error('No response content from ChatGPT');
    }

    // Check if response was truncated due to token limit
    if (finishReason === 'length') {
      console.warn('WARNING: Response was truncated due to token limit. Consider increasing max_tokens or splitting the analysis.');
      console.log(`Used tokens: ${data.usage?.total_tokens || 'unknown'}, Completion tokens: ${data.usage?.completion_tokens || 'unknown'}`);
    }

    // Log raw content for debugging (first 500 chars)
    console.log('Raw response content (first 500 chars):', content.substring(0, 500));

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.includes('```')) {
      // Remove opening markdown code block
      jsonContent = jsonContent.replace(/^```(?:json|JSON)?\s*\n?/m, '');
      // Remove closing markdown code block
      jsonContent = jsonContent.replace(/\n?```\s*$/m, '');
      // Also handle cases where there might be text before/after
      const codeBlockMatch = jsonContent.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim();
      }
    }

    // Try to extract JSON array from response
    let parsedResults;
    try {
      // First try: parse the entire content
      parsedResults = JSON.parse(jsonContent);
    } catch (e) {
      console.log('First parse attempt failed, trying to extract JSON array...');
      
      // Second try: find JSON array pattern (more flexible regex)
      // This regex looks for array starting with [ and ending with ]
      const jsonArrayPattern = /(\[[\s\S]*\])/;
      const jsonMatch = jsonContent.match(jsonArrayPattern);
      
      if (jsonMatch) {
        try {
          parsedResults = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON array from response');
        } catch (parseError) {
          console.error('Failed to parse extracted JSON array:', parseError);
          // Try to fix common JSON issues
          let fixedJson = jsonMatch[1];
          // Remove trailing commas before closing brackets/braces
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
          try {
            parsedResults = JSON.parse(fixedJson);
            console.log('Successfully parsed after fixing trailing commas');
          } catch (fixError) {
            console.error('Failed to parse even after fixing:', fixError);
            console.error('Problematic JSON content:', fixedJson.substring(0, 1000));
            throw new Error(`Could not parse JSON from response. Raw content preview: ${content.substring(0, 200)}...`);
          }
        }
      } else {
        // Third try: look for any JSON object/array in the content
        const anyJsonPattern = /(\{[\s\S]*\}|\[[\s\S]*\])/;
        const anyJsonMatch = jsonContent.match(anyJsonPattern);
        
        if (anyJsonMatch) {
          try {
            parsedResults = JSON.parse(anyJsonMatch[1]);
            console.log('Found and parsed JSON object/array');
          } catch (parseError) {
            console.error('Failed to parse found JSON:', parseError);
            throw new Error(`Could not parse JSON from response. Content preview: ${content.substring(0, 300)}...`);
          }
        } else {
          console.error('No JSON array or object found in response');
          console.error('Full response content:', content);
          throw new Error(`Could not find JSON in response. Response starts with: ${content.substring(0, 200)}...`);
        }
      }
    }
    
    if (!Array.isArray(parsedResults)) {
      // If result is an object, try to extract array from it
      if (typeof parsedResults === 'object' && parsedResults !== null) {
        // Check if it's an object with a results/items/data array
        const possibleArrayKeys = ['results', 'items', 'data', 'array'];
        for (const key of possibleArrayKeys) {
          if (Array.isArray(parsedResults[key])) {
            console.log(`Found array in key: ${key}`);
            parsedResults = parsedResults[key];
            break;
          }
        }
      }
      
      if (!Array.isArray(parsedResults)) {
        console.error('Parsed result is not an array:', parsedResults);
        throw new Error(`Response is not an array. Got: ${typeof parsedResults}`);
      }
    }

    const results = parsedResults.map((item: any, index: number) => ({
      id: item.id || index + 1,
      itemId: item.itemId || index + 1,
      order: item.order || index + 1,
      content: item.content || 'Unknown',
      type: item.type || 'Text',
      database: item.database || 'unknown_db',
      description: item.description || 'No description',
      imageProcessingResultId: item.imageProcessingResultId || 0,
      dataType: item.dataType || 'string',
      dbField: item.dbField || 'content_field'
    }));

    console.log(`Successfully processed ${results.length} red boxes from image`);
    return results;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.isValidApiKey;
  }

  /**
   * Save all results to database via API
   * @param results - The results to save to database
   * @returns Promise with success status
   */
  async saveToDatabase(results: ProcessedItemWithoutId[]): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Saving to database:', results);
      
      // Real API call to save data to database
      const response = await fetch(getApiUrl('/posts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          results,
          timestamp: new Date().toISOString(),
          source: 'image-processor',
          title: `Image Processing Results - ${results.length} items`,
          body: `Processed ${results.length} items from image analysis`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Database save failed: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      return {
        success: true,
        message: `Successfully saved ${results.length} items to database (ID: ${data.id})`
      };
      
    } catch (error) {
      console.error('Error saving to database:', error);
      return {
        success: false,
        message: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update project detail with edited results
   * @param projectId - The ID of the project to update
   * @param results - The edited results to save
   * @returns Promise with success status
   */
  async updateProjectDetail(projectId: number, results: ProcessedItem[]): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Updating project ${projectId} with edited results:`, results);
      
      // Prepare payload giống với saveToDatabase format
      const payload = { 
        results: results.map(item => ({
          content: item.content,
          type: item.type,
          database: item.database,
          description: item.description,
          imageProcessingResultId: item.imageProcessingResultId,
          dataType: item.dataType,
          dbField: item.dbField
        })),
        timestamp: new Date().toISOString(),
        source: 'image-processor-edit',
        title: `Updated Image Processing Results - ${results.length} items`,
        body: `Updated ${results.length} items from image analysis`
      };

      // Real API call to update project detail với PUT method
      const response = await fetch(getApiUrl(`/posts/${projectId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Update API Response:', data);
      
      return {
        success: true,
        message: `Successfully updated project ${projectId} with ${results.length} items`
      };
      
    } catch (error) {
      console.error('Error updating project detail:', error);
      return {
        success: false,
        message: `Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save edited results to backend
   * @param results - The edited results to save
   * @returns Promise with success status
   */
  async saveResults(results: ProcessedItem[]): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Saving edited results:', results);
      
      // Real API call to save edited results
      const response = await fetch(getApiUrl('/api/save-results'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          results,
          timestamp: new Date().toISOString(),
          source: 'image-processor-edit',
          title: `Edited Image Processing Results - ${results.length} items`,
          body: `Updated ${results.length} items from image analysis`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Edit API Response:', data);
      
      return {
        success: true,
        message: `Successfully saved ${results.length} edited items (ID: ${data.id})`
      };
      
    } catch (error) {
      console.error('Error saving results:', error);
      return {
        success: false,
        message: `Failed to save results: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get project by ID from backend API
   * @param projectId - The ID of the project to fetch
   * @returns Promise with project data or null if not found
   */
  async getProject(projectId: number): Promise<any | null> {
    try {
      console.log(`Fetching project with ID: ${projectId}`);
      
      const response = await fetch(getApiUrl(`/posts/${projectId}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Project with ID ${projectId} not found`);
          return null;
        }
        throw new Error(`Failed to fetch project: ${response.status} - ${response.statusText}`);
      }
      
      const project = await response.json();
      console.log('Fetched project:', project);
      
      return project;
      
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  }

  /**
   * Get all projects from backend API
   * @returns Promise with array of projects
   */
  async getAllProjects(): Promise<any[]> {
    try {
      console.log('Fetching all projects');
      
      const response = await fetch(getApiUrl('/posts'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} - ${response.statusText}`);
      }
      
      const projects = await response.json();
      console.log('Fetched projects:', projects);
      
      return Array.isArray(projects) ? projects : [projects];
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  /**
   * Test connection to ChatGPT API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.isValidApiKey) {
        if (!this.apiKey) {
          return {
            success: false,
            message: 'OpenAI API key not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file.'
          };
        } else {
          return {
            success: false,
            message: 'Invalid API key format. API key should start with "sk-" and be at least 20 characters long.'
          };
        }
      }

      return {
        success: true,
        message: 'API key format is valid. Ready to process images with ChatGPT Vision API.'
      };

      // Alternative: Uncomment below for actual API testing (may cause errors)
      /*
      const testRequest = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 1
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Successfully connected to OpenAI API'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        return {
          success: false,
          message: `API error: ${response.status} - ${errorMessage}`
        };
      }
      */
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

const chatGPTService = new ChatGPTService();
export default chatGPTService;
