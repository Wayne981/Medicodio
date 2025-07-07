import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Verify API key is loaded
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Supported image formats and their MIME types
const SUPPORTED_FORMATS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp'
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = SUPPORTED_FORMATS[ext];
  
  if (!mimeType) {
    throw new Error(`Unsupported file format: ${ext}. Supported formats: ${Object.keys(SUPPORTED_FORMATS).join(', ')}`);
  }
  
  return mimeType;
}

async function validateImageFile(filePath) {
  try {
    // Check if file exists and get stats
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${stats.size} bytes. Maximum allowed: ${MAX_FILE_SIZE} bytes`);
    }
    
    if (stats.size === 0) {
      throw new Error('File is empty');
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_FORMATS[ext]) {
      throw new Error(`Unsupported file format: ${ext}. Supported formats: ${Object.keys(SUPPORTED_FORMATS).join(', ')}`);
    }
    
    console.log(`File validation passed: ${filePath} (${stats.size} bytes, ${ext})`);
    return true;
  } catch (error) {
    console.error('File validation error:', error.message);
    throw error;
  }
}

async function fileToGenerativePart(filePath) {
  try {
    // Validate the file first
    await validateImageFile(filePath);
    
    // Get the correct MIME type based on file extension
    const mimeType = getMimeType(filePath);
    
    // Read the file
    const imageBuffer = await fs.readFile(filePath);
    
    console.log(`Converting file to generative part: ${filePath}, MIME: ${mimeType}, Size: ${imageBuffer.length} bytes`);
    
    return {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };
  } catch (error) {
    console.error('Error in fileToGenerativePart:', error.message);
    throw error;
  }
}

export async function processDocument(filePath) {
  try {
    console.log(`Starting document processing for: ${filePath}`);
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const imagePart = await fileToGenerativePart(filePath);
    
    const prompt = `Analyze this identity document image and provide the following information in JSON format:
    1. Document type (passport or driving license)
    2. All visible personal information (name, date of birth, etc.)
    3. Document number
    4. Expiry date (if visible)
    
    Format the response as a JSON object with these keys:
    {
      "documentType": "passport" or "driving_license",
      "personalInfo": {
        "name": "",
        "dateOfBirth": "",
        ...
      },
      "documentNumber": "",
      "expiryDate": ""
    }`;

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent([prompt, imagePart]);
    
    if (!result.response) {
      throw new Error('No response received from Gemini API');
    }
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received response from Gemini');
    
    // Parse the JSON response
    try {
      // Clean the response text (remove markdown code blocks if present)
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const jsonResponse = JSON.parse(cleanText);
      
      console.log('Successfully parsed JSON response');
      return jsonResponse;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      return {
        error: 'Failed to parse document information',
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error processing document with Gemini:', error);
    
    // Provide more specific error messages based on error type
    if (error.message.includes('Bad Request') || error.message.includes('not valid')) {
      throw new Error('Invalid image format or corrupted file. Please ensure the image is valid and in a supported format (JPEG, PNG, GIF, BMP, WebP).');
    } else if (error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message.includes('unauthorized') || error.message.includes('API key')) {
      throw new Error('API key is invalid or unauthorized.');
    } else if (error.message.includes('Unsupported file format')) {
      throw error; // Re-throw validation errors as-is
    }
    
    throw new Error(`Failed to process document: ${error.message}`);
  }
}