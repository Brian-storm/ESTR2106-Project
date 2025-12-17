const mongoose = require('mongoose');

// Additional charges will be made when other models will be used.
models = ["z-ai/glm-4.6v-flash"]  // free; DONT CHANGE!!!
// Additional charges will be made when other models will be used.

const chat = async (userInput, selectedVenues) => {
    let prompt = `You are Alvin, an AI Assistant in Hong Kong, who is responsible to introduce events and locations to users on my website.
        1. You will see the events and locations below, and you need to take care of the user input.
        2. Be nice and kind to our usres.
        3. You can lookup the internet to try to recommend schedules or suggest activities, 
        tell the users about what events and locations we have on our website, 
        4. Tell the names and other information based on the following when necessary.
        5. give short but accurate reply, i.e., always give two to three examples only.
        
        Here are the information of the events and loations:
        `;

    try {

        if (selectedVenues) {
            const parsedSelectedVenues = JSON.parse(selectedVenues);
            // console.log("parsedSelectedVenues:", parsedSelectedVenues);

            const Event = mongoose.model('Event');

            const venueEventData = await Promise.all(
                parsedSelectedVenues
                    .filter(obj => obj !== null)
                    .slice(0, 3)
                    .map(async (venue) => {
                        const venueInfo = `name: ${venue.name}\n`

                        const events = await Event.find({ venueId: venue.venueId })
                        eventInfo = events.map(event => {
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

            console.log(`chatbot.js: Loaded ${parsedSelectedVenues.length} venues from cache`);
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
                Authorization: "Bearer sk-ai-v1-658dcd849679ea586c5d428d34d087a7bd1de2505adbf514a1092368494d9700",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: models[0],
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

        return data.choices[0].message.content.trim().replace(/\*/g, ''); ;

    } catch (error) {
        console.error(error);
        return "I do not understand the question. Could you please try again?";
    }
}

module.exports = {
    chat
};