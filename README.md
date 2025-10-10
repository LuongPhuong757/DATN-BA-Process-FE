# Image Processor with ChatGPT

A React application that processes images using OpenAI's ChatGPT Vision API to extract structured information and manage projects.

## Features

- **Image Upload**: Drag & drop or click to upload images
- **AI Processing**: Uses ChatGPT Vision API to analyze image content
- **Structured Results**: Displays results in a formatted table with:
  - Content description
  - Type classification
  - Database suggestions
  - Detailed descriptions
- **Project Management**: Save and view processed results as projects
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Processing**: Live AI analysis with progress indicators

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:4003
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Development Configuration
REACT_APP_ENVIRONMENT=development
```

### Required Setup

1. **Backend API**: Ensure your backend server is running on `http://localhost:4003`
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Environment File**: Copy `.env.example` to `.env` and update the values

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Upload Image**: Drag and drop or click the upload area
4. **AI Processing**: Wait for ChatGPT to analyze the image content
5. **View Results**: Review the structured data extraction results
6. **Save Project**: Save results to database for future reference
7. **Manage Projects**: View and manage saved projects

## Development

The application is built with:
- **React 18** with TypeScript
- **Component Architecture**: Organized by screens (upload, projects, project-detail)
- **CSS Grid** for responsive layout
- **OpenAI ChatGPT Vision API** for image analysis
- **Drag & drop** file handling
- **Environment Configuration** for flexible deployment

## Project Structure

```
src/
├── components/
│   ├── upload/                    # Upload screen components
│   │   ├── UploadScreen.tsx       # Main upload screen
│   │   ├── ImageUploader.tsx     # Image upload component
│   │   └── ImageUploader.css      # Upload styles
│   ├── projects/                  # Projects screen components
│   │   └── ProjectsScreen.tsx    # Projects list screen
│   ├── project-detail/           # Project detail screen components
│   │   └── ProjectDetailScreen.tsx # Project detail view
│   └── shared/                   # Shared components
│       ├── Navigation.tsx        # Navigation component
│       ├── TableView.tsx         # Data table component
│       ├── ConnectionStatus.tsx   # API connection status
│       ├── ProjectList.tsx       # Project list component
│       ├── ResultDisplay.tsx     # Results display component
│       └── MessageDisplay.tsx    # Message notifications
├── config/
│   └── api.ts                    # API configuration
├── services/
│   └── chatgptService.ts         # ChatGPT API service
├── App.tsx                       # Main application component
└── App.css                       # Main application styles
```

## API Integration

### Backend API Endpoints

The application connects to a backend API with the following endpoints:

- `GET /posts` - Get all projects
- `POST /posts` - Create new project
- `GET /posts/:id` - Get project by ID
- `POST /api/save-results` - Save processed results

### OpenAI API

- Uses ChatGPT Vision API for image analysis
- Processes images to extract structured data
- Returns categorized information with database suggestions

### Configuration Management

- **Environment Variables**: All API URLs and keys stored in `.env`
- **Centralized Config**: API configuration managed in `src/config/api.ts`
- **Flexible Deployment**: Easy to change environments (dev/staging/prod)

## Building for Production

```bash
npm run build
```

## Environment Setup

### Development
```bash
REACT_APP_API_BASE_URL=http://localhost:4003
REACT_APP_ENVIRONMENT=development
```

### Production
```bash
REACT_APP_API_BASE_URL=https://your-api-domain.com
REACT_APP_ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**: Check if backend server is running on the correct port
2. **OpenAI API Error**: Verify your API key is correct and has sufficient credits
3. **Environment Variables**: Ensure `.env` file exists and variables are properly set

### Debug Mode

Set `REACT_APP_ENVIRONMENT=development` to enable debug logging.

## License

MIT License
