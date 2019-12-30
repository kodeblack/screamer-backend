const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const firebase_auth = require('./utility/firebase_auth');

const {
  getScreams,
  createScream,
} = require('./handlers/screams');

const {
  signup,
  login,
} = require('./handlers/users');

// Scream routes
app.get('/screams', getScreams);
app.post('/scream', firebase_auth, createScream);

// users routes
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.region('europe-west1').https.onRequest(app);