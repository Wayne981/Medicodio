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

// Supported file formats and their MIME types
const SUPPORTED_FORMATS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf'
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

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
}

function isPDFFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.pdf';
}

async function validateFile(filePath) {
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
    await validateFile(filePath);
    
    // Get the correct MIME type based on file extension
    const mimeType = getMimeType(filePath);
    
    // Read the file
    const fileBuffer = await fs.readFile(filePath);
    
    console.log(`Converting file to generative part: ${filePath}, MIME: ${mimeType}, Size: ${fileBuffer.length} bytes`);
    
    return {
      inlineData: {
        data: fileBuffer.toString('base64'),
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
    
    const filePart = await fileToGenerativePart(filePath);
    
    // Create different prompts based on file type
    let prompt;
    
    if (isPDFFile(filePath)) {
      prompt = `Analyze this PDF document and extract all relevant information. Please provide the following information in JSON format:
      1. Document type (passport, driving license, ID card, or other)
      2. All visible personal information (name, date of birth, address, etc.)
      3. Document number or ID number
      4. Issue date (if visible)
      5. Expiry date (if visible)
      6. Issuing authority or country
      7. Any other relevant information found in the document
      
      Format the response as a JSON object with these keys:
      {
        "documentType": "passport" | "driving_license" | "id_card" | "other",
        "personalInfo": {
          "name": "",
          "dateOfBirth": "",
          "address": "",
          "nationality": "",
          "gender": "",
          ...
        },
        "documentNumber": "",
        "issueDate": "",
        "expiryDate": "",
        "issuingAuthority": "",
        "country": "",
        "additionalInfo": {}
      }`;
    } else if (isImageFile(filePath)) {
      prompt = `Analyze this identity document image and extract all relevant information. Please provide the following information in JSON format:
      1. Document type (passport, driving license, ID card, or other)
      2. All visible personal information (name, date of birth, address, etc.)
      3. Document number or ID number
      4. Issue date (if visible)
      5. Expiry date (if visible)
      6. Issuing authority or country
      7. Any other relevant information found in the document
      
      Format the response as a JSON object with these keys:
      {
        "documentType": "passport" | "driving_license" | "id_card" | "other",
        "personalInfo": {
          "name": "",
          "dateOfBirth": "",
          "address": "",
          "nationality": "",
          "gender": "",
          ...
        },
        "documentNumber": "",
        "issueDate": "",
        "expiryDate": "",
        "issuingAuthority": "",
        "country": "",
        "additionalInfo": {}
      }`;
    } else {
      throw new Error('Unsupported file type for processing');
    }

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent([prompt, filePart]);
    
    if (!result.response) {
      throw new Error('No response received from Gemini API');
    }
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Successfully received response from Gemini');
    console.log('Raw response:', text);
    
    // Parse the JSON response
    try {
      // Clean the response text (remove markdown code blocks if present)
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const jsonResponse = JSON.parse(cleanText);
      
      console.log('Successfully parsed JSON response');
      
      // Add metadata about the processed file
      const result = {
        success: true,
        fileName: path.basename(filePath),
        fileType: path.extname(filePath).toLowerCase(),
        processedAt: new Date().toISOString(),
        extractedData: jsonResponse
      };
      
      return result;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      
      // Return the raw response if JSON parsing fails
      return {
        success: false,
        fileName: path.basename(filePath),
        fileType: path.extname(filePath).toLowerCase(),
        processedAt: new Date().toISOString(),
        error: 'Failed to parse document information',
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error processing document with Gemini:', error);
    
    // Provide more specific error messages based on error type
    if (error.message.includes('Bad Request') || error.message.includes('not valid')) {
      throw new Error('Invalid file format or corrupted file. Please ensure the file is valid and in a supported format (JPEG, PNG, GIF, BMP, WebP, PDF).');
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