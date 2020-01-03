const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const firebase_auth = require('./utility/firebase_auth');
const { db } = require('./utility/admin')

const {
  getScreams,
  createScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
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
app.post('/scream/:screamId/comment', firebase_auth, commentOnScream);
app.get('/scream/:screamId/like', firebase_auth, likeScream);
app.get('/scream/:screamId/unlike', firebase_auth, unlikeScream);
app.delete('/scream/:screamId', firebase_auth, deleteScream)
// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', firebase_auth, uploadeProfileImage);
app.post('/user', firebase_auth, addUserDetails);
app.get('/user', firebase_auth, getAUthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions
.region('europe-west1')
.firestore.document('likes/{id}')
.onCreate((snapshot) => {
  return db
  .doc(`/screams/${snapshot.data().screamId}`)
  .get()
  .then(doc => {
    if(doc.exists){
      return db.doc(`/notifications/${snapshot.id}`).set({
        created_at: new Date().toISOString(),
        recipient: doc.data().userHandle,
        sender: snapshot.data().userHandle,
        type: 'like',
        read: false,
        screamId: doc.id
      })
    }
  })
  .then(() => {
    return;
  })
  .catch(err => {
    console.error(err);
    return;
  })
});

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}')
.onDelete((snapshot) => {
  return db.doc(`/notifications/${snapshot.id}`).delete()
  .then(() => {
    return
  })
  .catch(err => {
    console.error(err);
    return
  })
});

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
.onCreate((snapshot) => {
  return db.doc(`/screams/${snapshot.data().screamId}`).get()
  .then(doc => {
    if(doc.exists){
      return db.doc(`/notifications/${snapshot.id}`).set({
        created_at: new Date().toISOString(),
        recipient: doc.data().userHandle,
        sender: snapshot.data().userHandle,
        type: 'comment',
        read: false,
        screamId: doc.id
      })
    }
  })
  .then(() => {
    return;
  })
  .catch(err => {
    console.error(err);
    return;
  })
});