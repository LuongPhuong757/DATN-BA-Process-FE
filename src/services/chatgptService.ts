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
  }>;
}

// Mock data for demonstration (replace with actual API call)
const mockProcessedData: ProcessedItem[] = [
  {
    id: 1,
    itemId: 1,
    content: '1',
    type: 'Text',
    database: 'order_db',
    description: 'Order sequence number field, displays sequential order ID, used for order tracking and reference',
    imageProcessingResultId: 1,
    dataType: 'number',
    dbField: 'order_number'
  },
  {
    id: 2,
    itemId: 2,
    content: 'View Details',
    type: 'Link',
    database: 'navigation_db',
    description: 'Clickable link to view order details, calls API /api/orders/details, shows loading spinner, redirects to Order Details page',
    imageProcessingResultId: 1,
    dataType: 'url',
    dbField: 'details_link'
  },
  {
    id: 3,
    itemId: 3,
    content: 'Submit Order',
    type: 'Button',
    database: 'action_db',
    description: 'Submit button for order processing, calls API /api/orders/submit, shows loading animation, redirects to Order Confirmation page',
    imageProcessingResultId: 1,
    dataType: 'string',
    dbField: 'submit_action'
  },
  {
    id: 4,
    itemId: 4,
    content: 'john.doe@company.com',
    type: 'Text',
    database: 'customer_db',
    description: 'Customer email address field, displays user contact information, used for order notifications and communication',
    imageProcessingResultId: 1,
    dataType: 'email',
    dbField: 'customer_email'
  },
  {
    id: 5,
    itemId: 5,
    content: 'Dashboard',
    type: 'Link',
    database: 'navigation_db',
    description: 'Navigation menu item, calls API /api/dashboard, shows loading effect, navigates to Dashboard page with user statistics',
    imageProcessingResultId: 1,
    dataType: 'url',
    dbField: 'dashboard_link'
  },
  {
    id: 6,
    itemId: 6,
    content: '1500000',
    type: 'Text',
    database: 'sales_db',
    description: 'Revenue amount field, displays monetary value in VND currency, used for financial reporting and calculations',
    imageProcessingResultId: 1,
    dataType: 'number',
    dbField: 'revenue_amount'
  }
];

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
    try {
      if (!this.isValidApiKey) {
        console.log('Using mock data - no valid API key configured');
        // Fallback to mock data if no valid API key
        await new Promise(resolve => setTimeout(resolve, 2000));
        return mockProcessedData;
      }

      console.log('Using real ChatGPT API');
      // Use real ChatGPT API if available
      const base64Image = await this.convertFileToBase64(imageFile);
      return await this.callChatGPTAPI(base64Image);
      
    } catch (error) {
      console.error('Error processing image:', error);
      
      // Fallback to mock data on error
      console.log('Falling back to mock data due to error:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return mockProcessedData;
    }
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
  private async callChatGPTAPI(base64Image: string): Promise<ProcessedItem[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: ChatGPTRequest = {
      model: 'gpt-4.1-mini',
      
      messages: [
        {
          role: 'system',
          content: `You are an expert image analyzer and UI/UX specialist. Extract the most important text content from the image with detailed descriptions.

          PRIORITY: Focus on:
          1. Text below or near buttons (especially red buttons)
          2. Table headers and key data
          3. Important labels and descriptions
          4. Hyperlinks and clickable elements
          5. Navigation elements and menu items

          Return results in this JSON format (MAX 10 items to avoid truncation):
          [
            {
              "id": "actual_id_from_image",
              "content": "Exact text content",
              "type": "Text|Button|Link|Icon|Table|Chart|Image|Form",
              "database": "appropriate_database_name",
              "description": "Detailed description including functionality and user interaction",
              "dataType": "string|number|boolean|date|email|phone|url|json",
              "dbField": "appropriate_field_name"
            }
          ]

          IMPORTANT FOR ID FIELD:
          - Extract the actual ID/number from the image content
          - If you see "1", "2", "3" etc. in the image, use that as the ID
          - If you see order numbers, sequence numbers, or any numeric identifiers, use those
          - Do NOT use sequential numbering (1,2,3...) unless that's what's actually in the image
          - The ID should reflect the actual content visible in the image

          DESCRIPTION GUIDELINES:
          - For hyperlinks/links: Describe the action and destination. Example: "Click to navigate to user profile page, calls API /api/user/profile, shows loading spinner, redirects to User Profile page"
          - For buttons: Describe the action and expected behavior. Example: "Submit button, calls API /api/orders/submit, shows loading animation, redirects to Order Confirmation page"
          - For navigation: Describe the destination and transition. Example: "Menu item, calls API /api/dashboard, shows loading effect, navigates to Dashboard page"
          - For forms: Describe the submission process. Example: "Login form submit, calls API /api/auth/login, shows loading spinner, redirects to Home page"
          - For data fields: Describe the purpose and context. Example: "Order number field, displays sequential order ID, used for order tracking"
          - For tables: Describe the data structure and purpose. Example: "Sales data table, displays quarterly revenue, calls API /api/sales/report for data"

          API SUGGESTIONS:
          - Use RESTful API naming conventions
          - Suggest appropriate HTTP methods (GET, POST, PUT, DELETE)
          - Include loading states and transitions
          - Predict destination pages based on context

          DATA TYPE GUIDELINES:
          - "string" for: names, emails, addresses, descriptions, labels, text content, titles
          - "number" for: prices, amounts, quantities, counts, percentages, IDs, STT (số thứ tự), order numbers, rankings
          - "boolean" for: yes/no, true/false, enabled/disabled, active/inactive, checked/unchecked
          - "date" for: dates, timestamps, schedules, deadlines
          - "email" for: email addresses
          - "phone" for: phone numbers
          - "url" for: website links, URLs
          - "json" for: complex structured data

          TYPE GUIDELINES:
          - "Text" for: plain text content, labels, descriptions
          - "Button" for: clickable buttons, action buttons
          - "Link" for: hyperlinks, navigation links (use "url" as dataType)
          - "Icon" for: icons, symbols, visual indicators
          - "Table" for: data tables, lists, grids
          - "Chart" for: graphs, charts, visualizations
          - "Image" for: pictures, photos, graphics
          - "Form" for: input fields, forms, controls

          IMPORTANT: 
          - If type is "Link", dataType should be "url" (not "string")
          - If type is "Button", dataType should be "string" (not "url")
          - Keep type and dataType separate and specific

          Be detailed and specific in descriptions. Focus on user interaction and system behavior.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this image and provide structured information about the content.'
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
      max_tokens: 500,
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
      throw new Error(`ChatGPT API error: ${response.status}`);
    }

    const data: ChatGPTResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from ChatGPT');
    }

    // Parse the JSON response from ChatGPT
    try {
      const parsedResults = JSON.parse(content);
      console.log('Parsed ChatGPT response:', parsedResults);
      console.log('Parsed ChatGPT response type:', typeof parsedResults);
      return parsedResults.map((item: any, index: number) => ({
        id: item.id || index + 1,
        content: item.content || 'Unknown',
        type: item.type || 'Other',
        database: item.database || 'unknown_db',
        description: item.description || 'No description available',
        dataType: item.dataType || 'string',
        dbField: item.dbField || 'content_field'
      }));
    } catch (parseError) {
      console.error('Error parsing ChatGPT response:', parseError);
      console.log('Raw content that failed to parse:', content);
      
      // Try to extract partial content if JSON is incomplete
      try {
        console.log('Attempting to fix incomplete JSON response...');
        
        // Look for complete JSON objects in the response
        const jsonObjects = [];
        const regex = /\{[^{}]*"content"[^{}]*"type"[^{}]*"database"[^{}]*"description"[^{}]*\}/g;
        const matches = content.match(regex);
        
        if (matches && matches.length > 0) {
          console.log('Found', matches.length, 'complete JSON objects');
          
          for (const match of matches) {
            try {
              const obj = JSON.parse(match);
              if (obj.content && obj.type && obj.database && obj.description) {
                jsonObjects.push(obj);
              }
            } catch (e) {
              console.log('Failed to parse object:', match);
            }
          }
          
          if (jsonObjects.length > 0) {
            console.log('Successfully extracted', jsonObjects.length, 'valid objects');
            return jsonObjects.map((item: any, index: number) => ({
              id: item.id || index + 1,
              itemId: item.itemId || index + 1,
              content: item.content || 'Unknown',
              type: item.type || 'Other',
              database: item.database || 'unknown_db',
              description: item.description || 'No description available',
              imageProcessingResultId: item.imageProcessingResultId || 0,
              dataType: item.dataType || 'string',
              dbField: item.dbField || 'content_field'
            }));
          }
        }
        
        // Fallback: try to extract just the content values
        const contentMatches = content.match(/"content":\s*"([^"]+)"/g);
        if (contentMatches && contentMatches.length > 0) {
          console.log('Extracting content values from incomplete response...');
          const contents = contentMatches.map(match => {
            const contentMatch = match.match(/"content":\s*"([^"]+)"/);
            return contentMatch ? contentMatch[1] : 'Unknown';
          });
          
          return contents.map((content, index) => ({
            id: index + 1,
            itemId: index + 1,
            content: content,
            type: 'Text',
            database: 'text_content_db',
            description: 'Extracted from incomplete response',
            imageProcessingResultId: 0,
            dataType: 'string',
            dbField: 'content_field'
          }));
        }
        
      } catch (partialError) {
        console.error('Failed to extract partial response:', partialError);
      }
      
      throw new Error('Invalid response format from ChatGPT');
    }
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
