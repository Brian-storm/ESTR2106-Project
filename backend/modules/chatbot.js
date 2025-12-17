const mongoose = require('mongoose');

// Additional charges will be made when other models will be used.
models = ["z-ai/glm-4.6v-flash"]  // free; DONT CHANGE!!!
// Additional charges will be made when other models will be used.

const chat = async (userInput, selectedVenues) => {
    let prompt = `You are Alvin, an AI Assistant in Hong Kong, who is responsible to introduce events and locations to users on my website.
        1. You will see the events and locations below, and you need to take care of the user input.
        2. Be nice and kind to our usres.
        3. You can lookup the internet to try to recommend schedules, 
        tell the users about what events and locations we have on our website, 
        4. Tell the names and other information based on the following when necessary.
        5. give short but accurate reply, i.e., always give two to three examples only.
        
        Here are the information of the events and loations:
        `;

    try {

        if (selectedVenues) {
            const parsedSelectedVenues = JSON.parse(selectedVenues);
            console.log("parsedSelectedVenues:", parsedSelectedVenues);

            const Location = mongoose.model('Location');

            const locations = await Promise.all(
                parsedSelectedVenues.map(async (venue) => {
                    return await Location.findOne({ name: venue.name })
                        .populate('events', 'title date time presenter')
                        .exec();
                })
            );

            // Filter out null locations
            const validLocations = locations.filter(loc => loc !== null);

            // Create structured data for the prompt
            const venueEventData = validLocations.map(loc => {
                const venueInfo = {
                    name: loc.name,
                    events: []
                };

                if (loc.events && loc.events.length > 0) {
                    // First filter valid events, then take only first 2
                    const validEvents = loc.events
                        .filter(event => event && Object.keys(event).length > 0)
                        .slice(0, 2);  // Limit to 2 events per venue

                    venueInfo.events = validEvents.map(event => ({
                        title: event.title || 'Untitled Event',
                        date: event.date || 'Date not specified',
                        time: event.time || 'Time not specified',
                        presenter: event.presenter || 'Presenter not specified'
                    }));
                }

                return venueInfo;
            });

            console.log(`chatbot.js: Loaded ${validLocations.length} venues from cache`);
            console.log(`chatbot.js: Venue Event Data:`, JSON.stringify(venueEventData, null, 2));

            // Add to prompt as JSON string
            prompt += JSON.stringify(venueEventData, null, 2) + '\n';
        } else {
            console.log("No cached venues found, showing empty state");
        }

        // append user input
        prompt += `Here is the user Input below. Please address properly with proper format (nice indentation and new line, without odd punctuations such as '**' and '--'):\n${userInput}
        If you find the userInput is completely irrelevant with the events and locations, simply ignore them and reply: I do not understand the question. Could you please try again?`;

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
            throw new Error("Failed to call Zenmux API.");
        }

        const data = await response.json();

        console.log("Printing data after aprsing json object");
        console.log(data);

        console.log("This is the message returned:");
        console.log(data.choices[0].message.content)

        return data.choices[0].message.content;

    } catch (error) {
        console.error(error);
        return "I do not understand the question. Could you please try again?";
    }
}

module.exports = {
    chat
};