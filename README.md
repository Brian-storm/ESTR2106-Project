## Dear Groupmates, here are the project requirements
Note: Minimum requriements listed as follows, more features and extras are welcome if you see fit
Note: Feel free to use extra APIsm but NEVER use anything more than Free Tier.

## Overview of our Web App (2 modes of access):
Goal: A Web App to check information on some locations.
* Allow Users and Admin will be able to log in and perform certain actions. 
* Retrieve location details from an open dataset. 
* Single Page Application, without refreshing the page for any internal links.

## 1. Users 
Only authenticated users have access to the app’s contents. A user is recognized using a username and password pair. The user will be able to perform the “user actions”, which are specified on the next page.

User actions:
1. List all locations in a table as links to single locations and allow sorting the table with
location names, distances, and the number of events at venue.

2. Show all locations in a map, with links to each single location (suggested APIs: Google
Maps, OpenStreetMap or MapBox).

3. Filter locations by keywords, areas, and distance (e.g., within x km), with dynamic
updates to the location list and map without page refresh.

4. A separate view for one single location, containing:
    a. A map showing the location.
    b. The location details.
    c. User comments, where users can add new comments seen by all other users.

5. Add location into a list of user’s favourite locations and see the list in another view.

6. See the username in the top-right of screen and be able to log out.

## 2. Admins
Admins will be able to perform arbitrary CRUD actions to the location data and the user data on your database.

Admin actions:
1. CRUD stored event details in the local database.
    a. We will not test other features (e.g., map, comments) if deleting an existing location.

2. CRUD user data (username and password only) in the local database.
    a. We will not test other features (e.g., comments) if deleting an existing user.

3. Log out as admin.

## 3. Non-user
Non-user actions:
1. Log in as user with username and password.
2. Log in as admin using username and password.


## Requirements
A. For data:
1. XML format
2. Pick only 10 venues (each host >=3 events)
3. Handle the following data: title, venue, date/time, description, presenter

B. Client Side
1. Get the real time information from API to database only once when the user logins and loads the page
* Visits to all different views should be reserved in the browser history, with a proper URL.

C. Server Side
1. design the data schemas and models storing (caching) items. 
    - locations: Location name, Latitude and longitude, (and more if you see fit)
    - English data
* Visits to all different views should be reserved in the browser history, with a proper URL.


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
