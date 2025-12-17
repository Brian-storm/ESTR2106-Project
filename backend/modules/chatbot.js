models = ["z-ai/glm-4.6v-flash"]  // free

// Implementation of Zenmux AI chatbot
const chat = async (userInput, selectedVenues) => {
    let prompt = `You are Alvin, an AI Assistant in Hong Kong, who is responsible to introduce events and locations to users on my website.
        You will see the events and locations right below the few lines here, and you need to take care of the user input.
        Please note that: use a mild tone, be nice and kind to our usres.
        You can: lookup the internet to try to recommend schedules, 
        remind users of weather conditions and to look after their belongings,
        tell the users about what events and locations we have on our website, 
        so tell the names and other information based on the following when necessary.
        
        Here are the information of the events and loations:
        `;

    try {

        // append event and location info
        if (selectedVenues) {
            const data = JSON.parse(selectedVenues);
            console.log(data);
            VenueEventPairs = ""

            VenueEventPairs = data.map(venue => {
                return `Name: ${venue.name}\nEvents: ${venue.events.filter(event => event && Object.keys(event).length > 0).join(', ')}\n`
            }).join('\n');

            console.log(`chatbot.js: Loaded ${data.length} venues from cache`);
            console.log(`chatbot.js: VenueEventPairs:\n${VenueEventPairs}`);

            prompt += data + '\n';
        } else {
            console.log("No cached venues found, showing empty state");
        }

        // append user input
        prompt += `Here is the user Input below. Please address properly:\n${userInput}
        If you find the userInput is highly irrelevant with the events and locations and functions you provide,
        simply ignore them and reply: I do not understand the question. Could you please try again?`;

        const response = await fetch("https://zenmux.ai/api/v1/chat/completions", {
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