const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const session = require('express-session')

const PORT = 5000;
const app = express();

// Development Stage:
const debug = 1;  // used to toggle console.log for debugging

let development = 1;  // To delete when production
if (development) {
    const cors = require('cors');
    app.use(cors());
}

app.use(express.json());
app.use(cookieParser());

// Cookies
const initCookie = (req, res, next) => { // a middleware
    if (req.cookies['sessionId'] == undefined) {
        res.cookie('sessionId', `session-${Date.now()}-${Math.random().toString(16).substr(2, 9)}`, {
            maxAge: 1000 * 60 * 5,
            httpOnly: true
        })
    }
    next();
}
app.use(initCookie);

// Sessions
const sessions = {};
const createSession = (userId, username, role) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 min

    sessions[sessionId] = {
        userId,
        username,
        role,
        expiresAt
    };

    return { sessionId, expiresAt };
};

mongoose.connect('mongodb://127.0.0.1:27017/ESTR2106db'); // idk how to do mongodb, need help
const db = mongoose.connection;

// Upon connection failure
db.on('error', console.error.bind(console, 'Connection error:'));

// Mongoose Models
// Model 1: Event
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

// Model 2: Location
const LocationSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    lattitude: {
        type: Number,
        required: [true, "Latitude is required"]
    },
    longtitude: {
        type: Number,
        required: [true, "Longtitude is required"]
    }
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
    }
})
const User = mongoose.model("User", UserSchema);



// Upon Successful Opening of the database
db.once('open', function () {
    console.log("Connection is open...");

    // listen to port
    const server = app.listen(PORT);

})



// Server Side Scripts

// Page Rendering
app.use(express.static(path.resolve(__dirname, '../public')));

// Cookies
app.get('/', (req, res) => {
    res.cookie('visits', '0', {
        maxAge: '1000' + "0000000",
        expires: new Date(Date.now() + '3600000')
    });
})
app.use(session({
    secret: 'abc123',
    cpploe: { maxAge: 1000 * 60 * 5 }  // expires in 5 min
}))

// Middleware: FetchXML - Fetch data from gov dataset XML link
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
        if (debug) {
            console.log('Total venues:', req.venueData.length);
            console.log('First venue:', req.venueData[0]);
            console.log('First venue.id:', req.venueData[0]?.['@_id']);
            console.log('First event:', req.eventData[0]);
            console.log('First event.venueid:', req.eventData[0]?.venueid);
        }

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

// use FetchXML to send the gov data to fronend for rendering
app.use('/api/fetchEvents', FetchXML);
app.get('/api/fetchEvents', (req, res) => {
    console.log("Returning venue event pairs...");
    console.log(JSON.stringify(req.venueEventsPairs));

    res.setHeader('Content-Type', 'application/json');
    res.json(req.venueEventsPairs);
})

const checkSession = (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
        return res.status(401).json({ 
            success: false, 
            message: 'No sessionId in cookie!' 
        });
    }
    
    const session = sessions[sessionId];
    
    if (!session) {
        return res.status(401).json({ 
            success: false, 
            message: 'No sessionId in server!' 
        });
    }
    
    if (session.expiresAt < Date.now()) {
        delete sessions[sessionId];
        return res.status(401).json({ 
            success: false, 
            message: 'Session expired' 
        });
    }
    
    req.user = {
        userId: session.userId,
        username: session.username,
        role: session.role
    };
    
    next();
};

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
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
});

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

        const { sessionId, expiresAt } = createSession(user._id, user.username, user.role);

        // Set cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true, // (security)
            secure: false,
            maxAge: 30 * 60 * 1000, // 30 min
            path: '/' // Available on all routes
        });

        console.log('Cookie created successfully for user:', username);

        res.json({
            success: true,
            user: {
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

app.post('/api/logout', checkSession, (req, res) => {
    const sessionId = req.cookies.sessionId;
    
    // Delete session
    delete sessions[sessionId];
    
    // Clear cookie
    res.clearCookie('sessionId', {
        httpOnly: true,
        path: '/'
    });
    
    console.log('Logged out:', req.user.username);
    
    res.json({ success: true, message: 'Logged out' });
});

// Send index.html as response to render web page
app.get('/*path', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

// Below are not yet done, arguments are placeholder only
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



// For Testing Purpose
// CRUD of Event
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
