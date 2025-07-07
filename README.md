# Document Upload and Analysis System

A full-stack application that allows users to upload identity documents (passport or driving license) and automatically extracts information using the Gemini API.

## Features

- Document upload functionality
- Automatic document type detection (passport/driving license)
- Information extraction using Gemini API
- Clean and responsive user interface
- Real-time processing feedback

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- AI: Google Gemini API
- Styling: Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud account with Gemini API access

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd medicodio
   ```

2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Configure environment variables:
   - Create `.env` file in the server directory
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

   This will start both the frontend (port 3000) and backend (port 5000) servers.

## Project Structure

```
medicodio/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json
└── README.md        # Project documentation
```

## API Endpoints

- `POST /api/upload` - Upload document
- `GET /api/document/:id` - Get document details

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 