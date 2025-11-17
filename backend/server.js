const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const fs = require('fs');

mongoose.connect('mongodb://127.0.0.1:27017/ESTR2106db'); // put your own database link here
const db = mongoose.connection;

// Upon connection failure
db.on('error', console.error.bind(console, 'Connection error:'));

// Upon opening the database successfully
db.once('open', function () {
    console.log("Connection is open...");

    // creating a mongoose model
    const EventSchema = mongoose.Schema({
        eventID: {
            type: Number,
            required: [true, "Name is required"],
        },
        location: {
            type: String,
            required: true,
        },
        quota: {
            type: Number,
            validate: {
                validator: function (value) {
                    return value > 0;
                },
                message: () => "Please enter a valid quota",
            },
        },
    });

    const Event = mongoose.model("Event", EventSchema);

    //Creating a new event
    let newEvent = new Event({
        eventID: 123,
        location: "SHB130",
        quota: 9999,
    });

    //Saving this new event to database
    newEvent
        .save()
        .then(() => {
            console.log("a new event created successfully");
        })
        .catch((error) => {
            console.log("failed to save new event");
        });

    // Read all data
    Event.find({})
        .then((data) => {
            console.log(data);
        })
        .catch((err) => {
            console.log("failed to read");
        });

    // Search for quota >= 500
    Event.find({ quota: { $gte: 500 } })
        .then((data) => console.log("the event with quota more than 500:", data))
        .catch((error) => console.log(error));

    // update the location if quota >= 500
    Event.findOneAndUpdate(
        { quota: { $gte: 500 } },
        { location: "Large Conference Room" },
        { new: true },
    )
        .then((data) => { console.log('the updated data is:', data) })
        .catch((error) => console.log(error));

    // delete the event if quota >= 500
    Event.findOneAndDelete(
        { quota: { $gte: 500 } }
    )
        .then((data) => { console.log('the deleted data is:', data) })
        .catch((error) => console.log(error));

});


// Page Rendering
app.use(express.static(path.resolve(__dirname, '../public')));

// Cookies
app.get('/', (req, res) => {
    res.cookie('visits', '0', {
        maxAge: '1000' + "0000000",
        expires: new Date(Date.now() + '3600000')
    });
})

// Pull data from gov dataset XML link
async function FetchXML(req, res, next) {
    const eventUrl = "https://www.lcsd.gov.hk/datagovhk/event/events.xml";
    const venueUrl = "https://www.lcsd.gov.hk/datagovhk/event/venues.xml";

    try {
        console.log("Fetching data...");
        const venueResponse = await fetch(venueUrl);
        if (!venueResponse.ok) {
            throw new Error(`HTTP error! status: ${venueResponse.status}`);
        }
        console.log("Successfully fetched venue data");

        const eventResponse = await fetch(eventUrl);
        if (!eventResponse.ok) {
            throw new Error(`HTTP error! status: ${eventResponse.status}`);
        }
        console.log("Successfully fetched event data");

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });

        console.log("Parsing venue data...");
        const venueText = await venueResponse.text();
        const venueData = parser.parse(venueText);
        req.venueData = venueData.venues?.venue || [];

        console.log("Parsing event data...");
        const eventText = await eventResponse.text();
        const eventData = parser.parse(eventText);
        req.eventData = eventData.events?.event || [];

        // DEBUG: check what data we actually have
        console.log('Total venues:', req.venueData.length);
        console.log('First venue:', req.venueData[0]);
        console.log('First venue.id:', req.venueData[0]?.['@_id']);
        console.log('First event:', req.eventData[0]);
        console.log('First event.venueid:', req.eventData[0]?.venueid);

        let venueEventsPairs = [];
        for (let venue of req.venueData) {
            let filteredEvents = req.eventData.filter((item) => venue['@_id'] === String(item.venueid));
            console.log(venue?.['@_id'], filteredEvents);
            if (filteredEvents.length >= 3) {
                venueEventsPairs.push({
                    venueID: venue['@_id'],
                    venueNameC: venue.venuec || "Unknown",
                    venueNameE: venue.venuee || "Unknown",
                    latitude: venue.latitude || null,
                    longitude: venue.longitude || null,

                    events: filteredEvents
                })
            }
        }
        req.venueEventsPairs = venueEventsPairs;
        console.log(`Found ${venueEventsPairs.length} venues with 3+ events`);
        next();

    } catch (error) {
        console.error('Error fetching XML:', error);
        res.status(500).json({ error: 'Failed to fetch events data' });
    }
}

app.use('/api/fetchEvents', FetchXML);
app.get('/api/fetchEvents', (req, res) => {
    console.log("Returning venue event pairs...");
    console.log(JSON.stringify(req.venueEventsPairs));

    res.setHeader('Content-Type', 'application/json');
    res.json(req.venueEventsPairs);
})

// Specific routes first
app.get('/', (req, res) => {
    console.log(path.resolve(__dirname, '../public/index.html'));
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

app.get('/location', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

app.get('/event', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Catch-all for other SPA routes
app.all('*path', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});


// // handle ALL requests
// app.use((req, res) => {
//   // send this to client
//   let message = "Hello World!";
//   message += `<br>current dirname: ${__dirname}`;
//   message += `<br>user link: ${req.path}`;
//   res.send(message);
// })

// listen to port 3000
const server = app.listen(5000);
