// This file stores the Mongoose Models

const mongoose = require('mongoose');


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

// Model 4: Comment
const CommentSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    comment: { type: String },
    date: { type: Date, default: Date.now }
});
const CommentModel = mongoose.model("Comment", CommentSchema);

module.exports = {
    Event,
    Location,
    User,
    CommentModel
};