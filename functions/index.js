const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const firebase_auth = require('./utility/firebase_auth');

const {
  getScreams,
  createScream,
  getScream,
  commentOnScream
} = require('./handlers/screams');

const {
  signup,
  login,
  uploadeProfileImage,
  addUserDetails,
  getAUthenticatedUser
} = require('./handlers/users');

// Scream routes
app.get('/screams', getScreams);
app.post('/scream', firebase_auth, createScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', firebase_auth, commentOnScream)

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', firebase_auth, uploadeProfileImage);
app.post('/user', firebase_auth, addUserDetails);
app.get('/user', firebase_auth, getAUthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);