const path = require('path');
const mongoose = require('mongoose');

// Load environment variables from .env file
const result = require('dotenv').config({
    path: path.join(__dirname, '..', '.env')  // Go up one level from modules/
});

const model = process.env.AI_MODEL
const API_KEY = process.env.API_KEY

console.log("AI model:", model);

const chat = async (userInput, selectedVenues) => {
    let prompt = `You are Alvin, an AI Assistant in Hong Kong, who is responsible to introduce events and locations to users on my website.

Rules:
1. Be nice and kind to our users (you can respond to their chit-chat).
2. Use the provided event and location information when relevant.
3. Give short but accurate replies (two to three examples only).
4. Format properly with indentation and start on new lines.
5. Do NOT use markdown (no **, ##, etc.), but you can use colons (:) for emphasis.
6. If user input is irrelevant to events/activities/programmes/cultures/locations/venues, reply: "I do not understand the question. Could you please try again?"

Available information:
`;

    try {

        if (selectedVenues) {
            // console.log("parsedSelectedVenues:", parsedSelectedVenues);

            const Event = mongoose.model('Event');

            const venueEventData = await Promise.all(
                selectedVenues
                    .filter(obj => obj !== null)
                    .slice(0, 3)
                    .map(async (venue) => {
                        const venueInfo = `name: ${venue.name}\n`

                        const events = await Event.find({ venueId: venue.venueId })
                        const eventInfo = events.map(event => {
                            return (
                                `title: ${event.title || 'Untitled Event'}\n` +
                                `date: ${event.date || 'Date not specified'}\n` +
                                `time: ${event.time || 'Time not specified'}\n` +
                                `presenter: ${event.presenter || 'Presenter not specified'}\n` +
                                '---\n'
                            );
                        })
                            .join('')

                        return `${venueInfo}:\n${eventInfo}\n`;
                    })
            );

            console.log(`chatbot.js: Loaded ${selectedVenues.length} venues`);
            console.log(`chatbot.js: venueEventData:`, JSON.stringify(venueEventData, null, 2));

            // Add to prompt as JSON string
            prompt += JSON.stringify(venueEventData, null, 2) + '\n';
        } else {
            console.log("No cached venues found, showing empty state");
        }

        // append user input
        prompt += `--- user input starts ---
        ${userInput}
        --- user input ends ---

        From the user input abovePlease address properly in English, and follow the following rules:
        1. Format properly with indentation and start on new lines.
        2. (IMPORTANT) Do not use markdown language such as '**', but you can try adding ':' for indicating.
        
        If you find the userInput is irrelevant with the your opinions or the events/activities/programmes/cultures/locations/venues mentioned,
        simply ignore them and reply: I do not understand the question. Could you please try again?`;

        const response = await fetch("https://zenmux.ai/api/v1/chat/completions", {
            signal: AbortSignal.timeout(1000 * 45), // 45 second timeout
            timeout: 1000 * 45,
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: `${prompt}`
                    },
                ],
                reasoning: {
                    enabled: false
                }
            }),
        })

        if (!response.ok) {
            throw new Error("Failed to call AI API.");
        }

        const data = await response.json();

        console.log("Printing data after parsing json object");
        console.log(data);

        console.log("This is the message returned:");
        console.log(data.choices[0].message.content.trim())

        return data.choices[0].message.content.trim().replace(/\*/g, '');;

    } catch (error) {
        console.error(error);
        return "I do not understand the question. Could you please try again?";
    }
}

module.exports = {
    chat
};