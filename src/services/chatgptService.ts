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
          content: `Bạn là mô hình AI chuyên tạo tài liệu BA Specification từ ảnh giao diện đã được đánh số.

Dưới đây là yêu cầu bắt buộc — bạn phải tuân thủ tuyệt đối:

I. NHIỆM VỤ

1. Nhận ảnh giao diện có các số đánh dấu (1, 2, 3…) và trích xuất:
- STT item
- Tên item (dựa trên label hiển thị hoặc bản chất đối tượng UI)
- Data type
- Input/Output
- Data source
- Required?
- Mô tả chi tiết nghiệp vụ

2. Xuất kết quả thành JSON array với định dạng sau:

Return ONLY a valid JSON array in this exact format:
[
  {
    "id": 1,
    "order": 1,
    "content": "Tên item dựa trên label hoặc bản chất đối tượng UI",
    "type": "Label|Textbox|Number|Dropdown|Icon|Button|Image|Toggle|Radio button|Hyperlink",
    "dataType": "string|number|email|phone|url|date|boolean|json",
    "io": "Input|Output|Action",
    "database": "appropriate_database_name",
    "required": true|false|null,
    "description": "Mô tả chi tiết nghiệp vụ bằng tiếng Việt",
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

⚠ Không thay đổi tên trường trong JSON.
⚠ Không thêm item ngoài những số được đánh trên ảnh.

II. CÁCH HIỂU ẢNH

- Mỗi số tương ứng 1 item UI.
- Dựa vào hình dạng để xác định type:
  + Label
  + Textbox
  + Number
  + Dropdown
  + Icon
  + Button
  + Image
  + Toggle
  + Radio button
  + Hyperlink
- Nếu là biểu tượng bút → type = "Icon" và mô tả là "Icon (Edit)"
- Nếu là thùng rác → type = "Icon" và mô tả là "Icon (Delete)"
- Nếu là URL → type = "Hyperlink"
- Nếu là ảnh → type = "Image"

III. QUY TẮC GÁN IO

- Input: người dùng nhập hoặc chọn
- Output: hệ thống hiển thị giá trị
- Action: item mang tính thao tác (Button, Icon edit/delete, share, copy)

IV. QUY TẮC REQUIRED?

- Nếu bắt buộc nhập/chọn trả ra true
- Nếu không bắt buộc trả ra false
- Nếu tùy điều kiện trả ra null

V. QUY TẮC MÔ TẢ CHI TIẾT

Mô tả phải rõ ràng, ngắn gọn, kỹ thuật:
- Chức năng của item
- Hành vi khi người dùng tương tác
- Điều kiện hiển thị / bật / tắt
- Ràng buộc nghiệp vụ (nếu có)
- Nếu là icon copy/share → mô tả đúng logic
- Nếu là link → ghi rõ "Hiển thị URL dạng hyperlink"

Mô tả phải theo văn phong BA chuyên nghiệp:
- Không cảm tính
- Không phỏng đoán ngoài dữ liệu hiển thị
- Chỉ mô tả đúng hành vi dựa vào UI

VI. ĐẦU RA

- Xuất duy nhất JSON array theo đúng cấu trúc trên.
- Không chèn text ngoài JSON.
- Không giải thích cách bạn xử lý.

The array length MUST equal the EXACT number of numbered items you counted in the image.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Hãy phân tích ảnh sau và tạo JSON array theo đúng các quy tắc trên.`
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

    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (networkError) {
      // Handle network errors (no internet, CORS, etc.)
      if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến ChatGPT API. Vui lòng kiểm tra kết nối internet của bạn.');
      }
      throw new Error(`Lỗi kết nối: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
    }

    if (!response.ok) {
      // Try to parse error response from API
      let errorMessage = 'Đã xảy ra lỗi khi xử lý ảnh';
      let userFriendlyMessage = '';
      let errorDetails: any = null;
      
      try {
        const errorData = await response.json();
        console.error('ChatGPT API Error Response:', errorData);
        errorDetails = errorData;
        
        if (errorData.error) {
          const apiError = errorData.error;
          const apiMessage = apiError.message || '';
          const errorType = apiError.type || '';
          const errorCode = apiError.code || '';
          
          // Log full error details for debugging
          console.error('API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            type: errorType,
            code: errorCode,
            message: apiMessage,
            fullError: apiError
          });
          
          // Map common errors to user-friendly Vietnamese messages
          if (response.status === 401) {
            userFriendlyMessage = 'API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key trong file .env';
          } else if (response.status === 429) {
            userFriendlyMessage = 'Đã vượt quá giới hạn yêu cầu. Vui lòng đợi một lát rồi thử lại.';
          } else if (response.status === 500 || response.status === 502 || response.status === 503) {
            userFriendlyMessage = 'ChatGPT API đang gặp sự cố. Vui lòng thử lại sau.';
          } else if (response.status === 400) {
            if (apiMessage.includes('rate_limit') || apiMessage.includes('rate limit')) {
              userFriendlyMessage = 'Đã vượt quá giới hạn yêu cầu. Vui lòng đợi một lát rồi thử lại.';
            } else if (apiMessage.includes('billing') || apiMessage.includes('payment')) {
              userFriendlyMessage = 'Tài khoản OpenAI cần thanh toán. Vui lòng kiểm tra billing của bạn.';
            } else if (apiMessage.includes('invalid_api_key') || apiMessage.includes('Invalid API key')) {
              userFriendlyMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại API key trong file .env';
            } else {
              userFriendlyMessage = `Yêu cầu không hợp lệ: ${apiMessage}`;
            }
          } else {
            userFriendlyMessage = apiMessage || `Lỗi từ ChatGPT API (${response.status})`;
          }
          
          // Add error type and code for debugging
          if (errorType) {
            errorMessage = `${errorType}: ${userFriendlyMessage}`;
          } else {
            errorMessage = userFriendlyMessage;
          }
          
          if (errorCode) {
            errorMessage = `${errorMessage} (Mã lỗi: ${errorCode})`;
          }
        } else {
          userFriendlyMessage = `Lỗi từ ChatGPT API: ${response.status} ${response.statusText}`;
          errorMessage = userFriendlyMessage;
        }
      } catch (e) {
        // If error response is not JSON, try to get text response
        console.error('Failed to parse error response as JSON:', e);
        try {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          errorDetails = { rawResponse: errorText };
        } catch (textError) {
          console.error('Failed to read error response text:', textError);
        }
        
        // If error response is not JSON, use status text
        if (response.status === 401) {
          errorMessage = 'API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key trong file .env';
        } else if (response.status === 429) {
          errorMessage = 'Đã vượt quá giới hạn yêu cầu. Vui lòng đợi một lát rồi thử lại.';
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          errorMessage = 'ChatGPT API đang gặp sự cố. Vui lòng thử lại sau.';
        } else {
          errorMessage = `Lỗi từ ChatGPT API: ${response.status} - ${response.statusText || 'Unknown error'}`;
        }
      }
      
      // Log full error information
      console.error('ChatGPT API Error Summary:', {
        status: response.status,
        statusText: response.statusText,
        url: this.baseUrl,
        errorMessage: errorMessage,
        errorDetails: errorDetails
      });
      
      // Create error with full details
      const fullError = new Error(errorMessage);
      (fullError as any).status = response.status;
      (fullError as any).statusText = response.statusText;
      (fullError as any).details = errorDetails;
      throw fullError;
    }

    const data: ChatGPTResponse = await response.json();
    const choice = data.choices[0];
    const content = choice?.message?.content;
    const finishReason = choice?.finish_reason;
    
    if (!content) {
      throw new Error('ChatGPT không trả về nội dung. Vui lòng thử lại.');
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
            throw new Error(`Không thể phân tích dữ liệu từ ChatGPT. Vui lòng thử lại với ảnh khác.`);
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
            throw new Error(`Không thể phân tích dữ liệu từ ChatGPT. Vui lòng thử lại với ảnh khác.`);
          }
        } else {
          console.error('No JSON array or object found in response');
          console.error('Full response content:', content);
          throw new Error(`ChatGPT không trả về dữ liệu hợp lệ. Vui lòng thử lại với ảnh khác.`);
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
        throw new Error(`ChatGPT trả về dữ liệu không đúng định dạng. Vui lòng thử lại.`);
      }
    }

    const results = parsedResults.map((item: any, index: number) => {
      // Handle required field: true, false, or null
      let required: boolean | null = false;
      if (item.required === true || item.required === false) {
        required = item.required;
      } else if (item.required === null) {
        required = null;
      }
      
      // Handle IO field: normalize to Input, Output, or Action
      let ioValue = item.io || item.inputOutput || item.IO || item.InputOutput;
      
      // If ioValue exists, normalize it
      if (ioValue) {
        if (typeof ioValue === 'string') {
          const ioTrimmed = ioValue.trim();
          // Check if already in correct format
          if (ioTrimmed === 'Input' || ioTrimmed === 'Output' || ioTrimmed === 'Action') {
            ioValue = ioTrimmed;
          } else {
            // Normalize case: convert to proper case (Input, Output, Action)
            const ioLower = ioTrimmed.toLowerCase();
            if (ioLower === 'input') {
              ioValue = 'Input';
            } else if (ioLower === 'output') {
              ioValue = 'Output';
            } else if (ioLower === 'action') {
              ioValue = 'Action';
            } else {
              // Default to Output if unknown value
              ioValue = 'Output';
            }
          }
        } else {
          ioValue = 'Output';
        }
      } else {
        // Default to Output if no value provided
        ioValue = 'Output';
      }
      
      return {
        id: item.id || index + 1,
        itemId: item.itemId || index + 1,
        order: item.order || index + 1,
        content: item.content || 'Unknown',
        type: item.type || 'Text',
        database: item.database || item.dataSource || 'unknown_db',
        description: item.description || 'No description',
        imageProcessingResultId: item.imageProcessingResultId || 0,
        dataType: item.dataType || 'string',
        dbField: item.dbField || 'content_field',
        io: ioValue,
        required: required
      };
    });

    console.log(`Successfully processed ${results.length} numbered items from image`);
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
   * @param screenId - The screen ID to associate with the results
   * @param imageUrl - The URL of the uploaded image
   * @returns Promise with success status
   */
  async saveToDatabase(results: ProcessedItemWithoutId[], screenId: number, imageUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Saving to database:', results, 'screenId:', screenId, 'imageUrl:', imageUrl);
      
      // Format results with stt (số thứ tự)
      const formattedResults = results.map((item, index) => ({
        stt: index + 1,
        content: item.content,
        type: item.type,
        database: item.database,
        description: item.description,
        dataType: item.dataType || 'string',
        dbField: item.dbField || 'field_name',
        io: item.io || 'Output',
        required: item.required || false
      }));
      
      // Prepare payload according to new API format
      const payload = {
        title: 'Image Processing Title',
        body: `Body content text - Processed ${results.length} items from image analysis`,
        source: 'image_source',
        timestamp: new Date().toISOString(),
        screenId: screenId,
        imageUrl: imageUrl,
        results: formattedResults
      };
      
      // Real API call to save data to database
      const response = await fetch(getApiUrl('/posts'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Database save failed: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      return {
        success: true,
        message: `Successfully saved ${results.length} items to database (ID: ${data.id || 'N/A'})`
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
          dbField: item.dbField,
          io: item.io,
          required: item.required
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
   * Get projects and screens from backend API
   * @returns Promise with array of project-screen pairs
   */
  async getProjectsScreens(): Promise<any[]> {
    try {
      console.log('Fetching projects and screens');
      
      const response = await fetch(getApiUrl('/projects/screens'), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects/screens: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched projects/screens:', data);
      
      return Array.isArray(data) ? data : [data];
      
    } catch (error) {
      console.error('Error fetching projects/screens:', error);
      throw error;
    }
  }

  /**
   * Register a new project with screens
   * @param nameProject - Project name
   * @param screens - Array of screen names
   * @returns Promise with response data
   */
  async registerProject(nameProject: string, screens: string[]): Promise<any> {
    try {
      console.log('Registering project:', nameProject, screens);
      
      const response = await fetch(getApiUrl('/projects'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameProject: nameProject,
          screens: screens
        })
      });
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Failed to register project: ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If error response is not JSON, use default message
        }
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        throw error;
      }
      
      const data = await response.json();
      console.log('Registered project:', data);
      
      return data;
      
    } catch (error) {
      console.error('Error registering project:', error);
      throw error;
    }
  }

  /**
   * Delete a screen
   * @param screenId - Screen ID
   * @returns Promise with response data
   */
  async deleteScreen(screenId: number): Promise<any> {
    try {
      console.log('Deleting screen:', screenId);
      
      const response = await fetch(getApiUrl(`/projects/screens/${screenId}`), {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete screen: ${response.status} - ${response.statusText}`);
      }
      
      // DELETE might not return JSON
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      
      console.log('Deleted screen:', screenId);
      return data;
      
    } catch (error) {
      console.error('Error deleting screen:', error);
      throw error;
    }
  }

  /**
   * Update a screen name
   * @param screenId - Screen ID
   * @param screenName - New screen name
   * @returns Promise with response data
   */
  async updateScreen(screenId: number, screenName: string): Promise<any> {
    try {
      console.log('Updating screen:', screenId, 'to:', screenName);
      
      const response = await fetch(getApiUrl(`/projects/screens/${screenId}`), {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screenName: screenName
        })
      });
      
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Failed to update screen: ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If error response is not JSON, use default message
        }
        const error = new Error(errorMessage);
        (error as any).statusCode = response.status;
        throw error;
      }
      
      const data = await response.json();
      console.log('Updated screen:', data);
      
      return data;
      
    } catch (error) {
      console.error('Error updating screen:', error);
      throw error;
    }
  }

  /**
   * Create Google Sheet with data
   * @param projectId - Project ID
   * @param title - Sheet title
   * @param data - 2D array of data (rows x columns)
   * @returns Promise with sheet URL
   */
  async createGoogleSheet(projectId: number, title: string, data: any[][]): Promise<{ success: boolean; sheetUrl?: string; message: string }> {
    try {
      console.log('Creating Google Sheet:', title, 'with', data.length, 'rows');
      
      // Use Google Apps Script Web App if available
      const scriptUrl = process.env.REACT_APP_GOOGLE_SCRIPT_URL;
      
      if (scriptUrl) {
        // Call Google Apps Script Web App
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'createSheet',
            title: title,
            data: data
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create Google Sheet: ${response.status}`);
        }
        
        const result = await response.json();
        return {
          success: true,
          sheetUrl: result.url,
          message: 'Google Sheet created successfully'
        };
      } else {
        // Fallback: Use Google Sheets API directly (requires OAuth or API key)
        // For now, return error asking for Google Script URL
        return {
          success: false,
          message: 'Google Script URL not configured. Please set REACT_APP_GOOGLE_SCRIPT_URL in .env file'
        };
      }
    } catch (error) {
      console.error('Error creating Google Sheet:', error);
      return {
        success: false,
        message: `Failed to create Google Sheet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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
