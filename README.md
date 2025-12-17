# **Project Requirements Document**

## **Project Overview**
**Goal:** A Web App to check information on locations with two access modes (User & Admin).

**Notes:**
- Minimum requirements listed below; additional features are welcome
- Feel free to use extra APIs, but **NEVER** exceed Free Tier limits

---

## **App Features Overview**

### **Web App Structure:**
1. **Single Page Application** (no page refresh for internal links)
2. **Authentication Required** for accessing app contents
3. **Location Information** retrieved from an open dataset

---

## **1. USER FUNCTIONALITY**

### **Authentication:**
- Users log in with username/password pair
- Only authenticated users can access app contents

### **User Actions:**

#### **1. Location Table View**
- List all locations in a table format
- Each location is a link to its single location page
- Sortable columns:
  - Location names
  - Distances
  - Number of events at venue

#### **2. Map View**
- Show all locations on a map
- Each location marker links to its single location page
- **Suggested APIs:** Google Maps, OpenStreetMap, or MapBox

#### **3. Filtering System**
- Filter locations by:
  - Keywords
  - Areas
  - Distance (e.g., "within X km")
- **Dynamic updates** to both list and map without page refresh

#### **4. Single Location View**
**Contains:**
a. Map showing the specific location
b. Location details
c. User comments section:
   - Users can add new comments
   - Comments visible to all other users

#### **5. Favorites System**
- Add locations to user's favorites list
- View favorites in a separate page

#### **6. User Interface**
- Display username in top-right corner
- Logout functionality

---

## **2. ADMIN FUNCTIONALITY**

### **Admin Actions:**

#### **1. Location CRUD Operations**
- **Create, Read, Update, Delete** event details in local database
- **Note:** If deleting a location, other features (map, comments) won't be tested

#### **2. User Management**
- **Create, Read, Update, Delete** user data (username and password only)
- **Note:** If deleting a user, other features (comments) won't be tested

#### **3. Admin Interface**
- Logout functionality

---

## **3. NON-USER ACCESS**

### **Actions for Unauthenticated Users:**
1. Log in as user (username & password)
2. Log in as admin (username & password)

---

## **TECHNICAL REQUIREMENTS**

### **A. Data Requirements**
1. **Format:** XML format
2. **Data Selection:**
   - Pick only 10 venues
   - Each venue must host ≥3 events
3. **Required Data Fields:**
   - Title
   - Venue
   - Date/Time
   - Description
   - Presenter

### **B. Client-Side Requirements**
1. **Data Fetching:**
   - Get real-time information from API → database
   - Fetch only once when user logs in/loads page
2. **Browser History:**
   - All view visits should be recorded in browser history
   - Each view must have a proper URL

### **C. Server-Side Requirements**
1. **Database Design:**
   - Design data schemas/models for caching items
   - **Locations Schema Must Include:**
     - Location name
     - Latitude and longitude
     - (Additional fields optional)
   - **Language:** English data only
2. **URL Routing:**
   - All view visits should be recorded in browser history
   - Each view must have a proper URL



# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# ESTR2106-Project
