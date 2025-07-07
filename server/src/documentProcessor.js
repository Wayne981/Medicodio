import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function fileToGenerativePart(path) {
  const imageBuffer = await fs.readFile(path);
  return {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: 'image/jpeg'
    }
  };
}

export async function processDocument(filePath) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
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

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      const jsonResponse = JSON.parse(text);
      return jsonResponse;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        error: 'Failed to parse document information',
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error processing document with Gemini:', error);
    throw new Error('Failed to process document');
  }
} 