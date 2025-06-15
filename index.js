/**
 * Cloud Function to proxy requests to the Gemini API.
 * Hides the Gemini API key from the client.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // For making HTTP requests

// Initialize Firebase Admin SDK (if you need to interact with other Firebase services)
// admin.initializeApp(); // Uncomment if you need other Firebase services

exports.callGeminiOnRequest = functions.https.onRequest(async (req, res) => {
    // For POST requests, the input text will be in the request body as plain text
    const userText = req.body; 

    console.log(userText);
    
    // Optional: CORS handling for client-side requests
    res.set('Access-Control-Allow-Origin', '*'); // Allow requests from any origin (for development)
    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }


    if (!userText) {
        // Use res.status().send() for onRequest functions to send HTTP responses
        return res.status(400).send('Text content is required in the request body.');
    }

    // Retrieve the Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return res.status(500).send('Gemini API key not configured. Please set the GEMINI_API_KEY environment variable.');
    }

    const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    try {
        const response = await axios.post(geminiApiUrl, {
            contents: [
                {
                    parts: [
                        {
                            text: userText
                        }
                    ]
                }
            ]
        }, {
            params: {
                key: geminiApiKey // Pass the API key as a query parameter
            }
        });

        // Send Gemini's response back to the caller
        // Set content type to JSON
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(response.data);

    } catch (error) {
        console.error('Error calling Gemini API:', error.response ? error.response.data : error.message);
        // Send an error response
        const errorMessage = error.response ? error.response.data : error.message;
        return res.status(500).json({ error: 'Failed to get response from Gemini.', details: errorMessage });
    }
});