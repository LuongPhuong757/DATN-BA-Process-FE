# Environment Configuration Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:4003
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# Development Configuration
REACT_APP_ENVIRONMENT=development
```

## Setup Instructions

1. **Copy the template**: Copy the variables above to a new `.env` file
2. **Update API URL**: Change `REACT_APP_API_BASE_URL` to your backend server URL
3. **Add OpenAI Key**: Replace `your_openai_api_key_here` with your actual OpenAI API key
4. **Set Environment**: Use `development` for local development or `production` for production

## Environment Examples

### Development
```bash
REACT_APP_API_BASE_URL=http://localhost:4003
REACT_APP_OPENAI_API_KEY=sk-your-actual-key-here
REACT_APP_ENVIRONMENT=development
```

### Production
```bash
REACT_APP_API_BASE_URL=https://your-api-domain.com
REACT_APP_OPENAI_API_KEY=sk-your-actual-key-here
REACT_APP_ENVIRONMENT=production
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure
- Use different API keys for development and production






