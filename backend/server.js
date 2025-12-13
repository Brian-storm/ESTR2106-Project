const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const session = require('express-session')

const PORT = 5000;
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ESTR2106db'); // idk how to do mongodb connection, need help
const db = mongoose.connection;

// Upon connection failure
db.on('error', console.error.bind(console, 'Connection error:'));

// Development Stage:
let development = 1;  // To delete when production
if (development) {
    const cors = require('cors');
    app.use(cors());
}

app.use(express.json());
app.use(cookieParser());

// Mongoose Models
// Model 1: Event
const EventSchema = mongoose.Schema({
    title: { type: String, required: true },
    venue: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    desc: { type: String },
    presenter: { type: String, required: true },
    eventId: { type: String, unique: true }
});
const Event = mongoose.model("Event", EventSchema);

// Model 2: Location
const LocationSchema = mongoose.Schema({
    name: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    venueId: { type: String, unique: true }
})
const Location = mongoose.model("Location", LocationSchema);

// Model 3: User
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }]
});
const User = mongoose.model("User", UserSchema);

// Upon Successful Opening of the database
db.once('open', async function () {
    console.log("Connection is open...");
    const server = app.listen(PORT);
})

// Before closing the DB
process.once('SIGINT', async () => {
    console.log('App exiting, cleaning up...');
    // await Event.deleteMany({});
    // await Location.deleteMany({});
    console.log('All connections closed');
    process.exit(0);
});

// Static file
app.use(express.static(path.resolve(__dirname, '../public')));

// Session
app.use(session({
    secret: 'abc123',
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 5, // 5 minutes
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
    }
}));

// Check Session
const checkSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        req.user = {
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role
        };
    }
    next();
};
app.use(checkSession);

// FetchXML - Fetch data from gov dataset XML link
async function FetchXML(req, res, next) {
    const eventUrl = "https://www.lcsd.gov.hk/datagovhk/event/events.xml";
    const venueUrl = "https://www.lcsd.gov.hk/datagovhk/event/venues.xml";

    try {
        console.log("Fetching data for update...");
        const venueResponse = await fetch(venueUrl);
        if (!venueResponse.ok) {
            throw new Error(`HTTP error! status: ${venueResponse.status}`);
        }
        console.log("Successfully fetched venue data");

        const eventResponse = await fetch(eventUrl);
        if (!eventResponse.ok) {
            throw new Error(`HTTP error, status: ${eventResponse.status}`);
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

        console.log("Starting data update (not replacement)...");

        let venueEventsPairs = [];
        
        for (let venue of req.venueData) {
            let filteredEvents = req.eventData.filter((item) => venue['@_id'] === String(item.venueid));
            
            const cleansedEvents = [];

            for (let event of filteredEvents) {
                try {
                    const eventData = {
                        title: event.titlee || "Untitled",
                        venue: venue.venuee || "TBA",
                        date: event.predateE || "TBA",
                        time: event.progtimee || "TBA",
                        desc: event.desce || "",
                        presenter: event.presenterorge || "TBA",
                        eventId: event['@_id']
                    };

                    // Check if event exists using eventId
                    const existingEvent = await Event.findOne({
                        eventId: event['@_id']
                    });

                    let savedEvent;
                    if (existingEvent) {
                        savedEvent = await Event.findByIdAndUpdate(
                            existingEvent._id,
                            { $set: eventData },
                            { new: true }
                        );
                    } else {
                        savedEvent = new Event(eventData);
                        await savedEvent.save();
                    }
                    
                    cleansedEvents.push({
                        _id: savedEvent._id,
                        title: savedEvent.title,
                        venue: savedEvent.venue,
                        date: savedEvent.date,
                        time: savedEvent.time,
                        desc: savedEvent.desc,
                        presenter: savedEvent.presenter,
                        eventId: savedEvent.eventId
                    });
                } catch (err) {
                    console.log("Failed to save/update event", err);
                }
            }

            try {
                const locationData = {
                    name: venue.venuee,
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    events: cleansedEvents.map(event => event._id),
                    venueId: venue['@_id']  // Store the original venue ID
                };

                // Check if location exists using venueId
                const existingLocation = await Location.findOne({
                    venueId: venue['@_id']
                });

                let savedLocation;
                if (existingLocation) {
                    savedLocation = await Location.findByIdAndUpdate(
                        existingLocation._id,
                        { $set: locationData },
                        { new: true }
                    );
                    console.log(`Updated location: ${locationData.name} (VenueID: ${venue['@_id']})`);
                } else {
                    savedLocation = new Location(locationData);
                    await savedLocation.save();
                    console.log(`Created new location: ${locationData.name} (VenueID: ${venue['@_id']})`);
                }

                venueEventsPairs.push({
                    venueId: locationData.venueId,
                    name: locationData.name,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    events: cleansedEvents,
                    eventsCount: cleansedEvents.length
                });
            } catch (err) {
                console.log("Failed to save/update location", err);
            }
        }
        
        req.venueEventsPairs = venueEventsPairs;

        next();

    } catch (error) {
        console.error('Error in FetchXML:', error);
        res.status(500).json({ 
            error: 'Failed to fetch and process events data',
            details: error.message 
        });
    }
}
app.use('/api/fetchEvents', FetchXML);

// Routes
app.get('/', (req, res) => {
    res.cookie('visits', '0', {
        maxAge: '1000' + "0000000",
        expires: new Date(Date.now() + '3600000')
    });
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Check Authentication
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            userId: req.session.userId,
            username: req.session.username,
            role: req.session.role
        });
    } else {
        res.status(401).json({
            success: false,
            message: "Not authenticated"
        });
    }
});

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        // Check for valid username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Create new user
        const newUser = new User({
            username: username,
            password: password,
            role: 'user'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                userId: newUser._id,
                username: newUser.username,
                role: newUser.role,
                permission: newUser.role === "admin" ? 7 : 1
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check for password
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Wrong password'
            });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        console.log('Session created successfully for user:', username);

        res.status(200).json({
            success: true,
            user: {
                userId: user._id,
                username,
                role: user.role,
                permission: user.role === 'admin' ? 7 : 1
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    // Destroy session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }

        // Clear session cookie
        res.clearCookie('connect.sid', {
            path: '/'
        });

        res.json({
            success: true,
            message: 'Logged out'
        });
    });
});



// CRUD on data - Events and Locations
// Fetch data
app.get('/api/fetchEvents', (req, res) => {
    console.log("Returning venue event pairs...");
    console.log(JSON.stringify(req.venueEventsPairs));

    res.setHeader('Content-Type', 'application/json');
    res.json(req.venueEventsPairs);
})


// app.post('/api/updateLocation', async (req, res) => {
//     console.log("Trying to write 10 random venues to db...")

//     try {
//         for (const loc of req.body.selectedVenues) {
//             console.log(loc);
//             const newLocation = new Location({
//                 namee: loc.venueNameE,
//                 namec: loc.venueNameC || '',
//                 latitude: loc.latitude || '',
//                 longitude: loc.longitude || ''
//             });
//             await newLocation.save();
//         }

//         res.status(201).send("Successfully updated venues");

//     } catch (error) {
//         console.error("Error:", error);
//         res.status(500).send("Failed to update venues");
//     }
// });

