const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const session = require('express-session')
const { Event, Location, User, Comment } = require('./modules/models');
const { isPointInPolygon } = require("./utils");

const PORT = 5000;
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/ESTR2106db');
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

const districtBoundaries = [];

const fetchDistrictBoundaries = async () => {
    const res = await fetch("https://www.had.gov.hk/psi/hong-kong-administrative-boundaries/hksar_18_district_boundary.json");
    const data = await res.json();
    districtBoundaries.push(...data.features);
}

// Upon Successful Opening of the database
db.once('open', async function () {
    console.log("Connection is open...");
    await fetchDistrictBoundaries();
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
        maxAge: 1000 * 60 * 15, // Session lasts for 15 minutes
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

// Analyze district by referring to subdistrict name first to reduce fetching
const { districtMapping } = require("./modules/district");
const MatchDistrict = (venuee) => {
    for (let districtName in districtMapping) {
        if (venuee.includes(districtName)) {
            return districtName + " District";
        }

        for (let subDistrictName of districtMapping[districtName]) {
            if (venuee.includes(subDistrictName)) {
                return districtName + " District";
            }
        }
    }
    return null;
}

const fetchDistrict = async (lat, lon) => {
    for (let boundary of districtBoundaries) {
        const polygon = boundary.geometry.coordinates[0].map(coord => [coord[0], coord[1]]);
        if (isPointInPolygon(polygon, [lon, lat])) {
            return boundary.properties.District + " District";
        }
    }
};

const updateData = async (req, res, next) => {
    const venueUrl = "https://www.lcsd.gov.hk/datagovhk/event/venues.xml";
    const eventUrl = "https://www.lcsd.gov.hk/datagovhk/event/events.xml";

    const [venueResponse, eventResponse] = await Promise.all([fetch(venueUrl), fetch(eventUrl)]);
    if (!venueResponse.ok) {
        throw new Error(`HTTP error! status: ${venueResponse.status}`);
    }
    if (!eventResponse.ok) {
        throw new Error(`HTTP error! status: ${eventResponse.status}`);
    }
    console.log("Successfully fetched data");


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

    const bulkWriteEventData = req.eventData.map(event => ({
        updateOne: {
            filter: { eventId: event['@_id'] },
            update: {
                $set: {
                    title: event.titlee || "Untitled",
                    venueId: typeof(event.venueid) === "number" ? event.venueid.toString() : (event.venueid || "TBA"),
                    date: event.predateE || "TBA",
                    time: event.progtimee || "TBA",
                    desc: event.desce || "",
                    presenter: event.presenterorge || "TBA",
                    eventId: event['@_id']
                }
            },
            upsert: true
        }
    }))

    await db.collection('events').bulkWrite(bulkWriteEventData, { ordered: false });
    
    req.venueData = req.venueData.filter(venue => {
        return req.eventData.some(event => event.venueid?.toString() === venue['@_id']);
    });

    await Promise.all(req.venueData.map(async (venue) => {
        if (venue.latitude === '' || venue.longitude === '') {
            return;
        }
        let location = await Location.findOne({ venueId: venue['@_id'] });
        if (!location)
            location = new Location({
                name: venue.venuee,
                latitude: venue.latitude,
                longitude: venue.longitude,
                venueId: venue['@_id'],  // Store the original venue ID
            });
        let districtName = MatchDistrict(venue.venuee);
        // direct find first
        if (districtName === null) {
            if (location && location.district) {
                districtName = location.district;
            } else {
                districtName = await fetchDistrict(venue.latitude, venue.longitude);
            }
        }
        location.district = districtName;
        await location.save();
    }));

    next();
}

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
app.get('/api/fetchEvents', updateData, async (req, res) => {
    console.log("Returning venue event pairs...");

    res.setHeader('Content-Type', 'application/json');
    const locations = await Location.find({});
    res.json(locations);
})
//fetch data
app.get("/api/admin/events", async (req, res) => {
    // Access control
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const events = await Event.find({}).sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error("Admin fetch events failed:", err);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});
//update data
app.put("/api/admin/events/:id", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const updated = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        console.error("Update failed:", err);
        res.status(500).json({ error: "Update failed" });
    }
});
//delete data
app.delete("/api/admin/events/:id", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete failed:", err);
        res.status(500).json({ error: "Delete failed" });
    }
});
//add data
app.post("/api/admin/events", async (req, res) => {
    /* ================== ACCESS CONTROL ================== */
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({
            error: "FORBIDDEN",
            message: "Admin privileges required"
        });
    }

    try {
        const {
            title,
            venue,
            date,
            time,
            presenter,
            desc
        } = req.body;

        /* ================== VALIDATION ================== */
        const missingFields = [];

        if (!title || !title.trim()) missingFields.push("title");
        if (!venue || !venue.trim()) missingFields.push("venue");
        if (!date) missingFields.push("date");

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: "VALIDATION_ERROR",
                message: "Missing required fields",
                fields: missingFields
            });
        }

        /* ================== CREATE EVENT ================== */
        const newEvent = new Event({
        eventId: crypto.randomUUID(),   // or uuidv4()
        title: title.trim(),
        venue: venue.trim(),
        date,
        time: time || "TBA",
        presenter: presenter || "TBA",
        desc: desc || ""
    });

        const saved = await newEvent.save();

        return res.status(201).json(saved);

    } catch (err) {
        /* ================== ERROR IDENTIFICATION ================== */
        console.error("[ADMIN EVENTS] Create failed:", err);

        // Mongoose validation error
        if (err.name === "ValidationError") {
            return res.status(400).json({
                error: "MONGOOSE_VALIDATION_ERROR",
                message: err.message,
                details: err.errors
            });
        }

        // Duplicate key error (if you later add unique indexes)
        if (err.code === 11000) {
            return res.status(409).json({
                error: "DUPLICATE_ENTRY",
                message: "Event already exists"
            });
        }

        // Fallback
        return res.status(500).json({
            error: "INTERNAL_SERVER_ERROR",
            message: "Failed to create event"
        });
    }
});

// ================== ADMIN: FETCH USERS ==================
app.get("/api/admin/users", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const users = await User.find({}, "-password").sort({ username: 1 });
        res.json(users);
    } catch (err) {
        console.error("Admin fetch users failed:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ================== ADMIN: CREATE USER ==================
app.post("/api/admin/users", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: "VALIDATION_ERROR",
                message: "Username and password are required"
            });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({
                error: "DUPLICATE_USER",
                message: "Username already exists"
            });
        }

        const newUser = new User({
            username: username.trim(),
            password, // (plaintext for now — matches your current system)
            role: role === "admin" ? "admin" : "user"
        });

        const saved = await newUser.save();

        res.status(201).json({
            _id: saved._id,
            username: saved.username,
            role: saved.role
        });

    } catch (err) {
        console.error("Admin create user failed:", err);
        res.status(500).json({ error: "Create user failed" });
    }
});

// ================== ADMIN: UPDATE USER ==================
app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const { username, role } = req.body;

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            {
                ...(username && { username: username.trim() }),
                ...(role && { role })
            },
            { new: true }
        ).select("-password");

        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(updated);

    } catch (err) {
        console.error("Admin update user failed:", err);
        res.status(500).json({ error: "Update user failed" });
    }
});

// ================== ADMIN: DELETE USER ==================
app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.session || req.session.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        // Optional safety: prevent deleting yourself
        if (req.session.userId === req.params.id) {
            return res.status(400).json({
                error: "INVALID_OPERATION",
                message: "You cannot delete your own account"
            });
        }

        const deleted = await User.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ success: true });

    } catch (err) {
        console.error("Admin delete user failed:", err);
        res.status(500).json({ error: "Delete user failed" });
    }
});


// 添加 Favorite 相关路由
app.get('/api/favorites', checkSession, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .populate('favorites');

        res.json(user.favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            error: 'Failed to fetch favorites'
        });
    }
});

app.post('/api/favorites', checkSession, async (req, res) => {
    try {
        const { venueId } = req.body;

        // 查找场地
        const venue = await Location.findOne({ venueId });
        if (!venue) {
            return res.status(404).json({
                error: 'Venue not found'
            });
        }

        const user = await User.findById(req.session.userId);

        // 检查是否已收藏
        const favoriteIndex = user.favorites.indexOf(venue._id);
        if (favoriteIndex > -1) {
            // 取消收藏
            user.favorites.splice(favoriteIndex, 1);
            await user.save();
            return res.json({
                success: true,
                message: 'Removed from favorites',
                isFavorite: false
            });
        } else {
            // 添加收藏
            user.favorites.push(venue._id);
            await user.save();
            return res.json({
                success: true,
                message: 'Added to favorites',
                isFavorite: true
            });
        }
    } catch (error) {
        console.error('Error updating favorites:', error);
        res.status(500).json({
            error: 'Failed to update favorites'
        });
    }
});

app.delete('/api/clearFavorites', checkSession, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // 清空收藏数组
        user.favorites = [];
        await user.save();

        console.log(`Cleared favorites for user: ${user.username}`);

        res.json({
            success: true,
            message: 'All favorites cleared successfully',
            favorites: []
        });
    } catch (error) {
        console.error('Error clearing favorites:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear favorites'
        });
    }
});

app.get("/api/locations", async (req, res) => {
    let venueIds = req.query.venueIds ? req.query.venueIds.split(',') : [];
    try {
        const locations = venueIds.length > 0 ? await Location.find({ venueId: { $in: venueIds } }) : await Location.find({});
        await Promise.all(venueIds.map(async (venueId, index) => {
            locations[index]._doc.eventCount = await Event.countDocuments({ venueId });
        }));
        res.json(locations);
    } catch (error) {
        console.error("Error fetching locations:", error);
        res.status(500).json({ error: "Failed to fetch locations" });
    }
});

app.get("/api/locations/:locationId/comments", async (req, res) => {
    const locationId = req.params.locationId;
    try {
        const comments = await Comment.find({
            location: locationId
        }).populate({
            path: 'user',
            select: 'username -_id'
        });
        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
});

app.post("/api/locations/:locationId/comments", async (req, res) => {
    const locationId = req.params.locationId;
    const { comment } = req.body;

    try {
        const newComment = new Comment({
            user: req.user.userId,
            location: locationId,
            comment: comment,
        });
        await newComment.save();
        res.status(201).json({ success: true, message: "Comment added successfully" });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ success: false, message: "Failed to add comment" });
    }
});
