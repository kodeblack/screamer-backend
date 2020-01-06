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
  getAUthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require('./handlers/users');

// Scream routes
app.get('/screams', getScreams);
app.post('/scream', firebase_auth, createScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', firebase_auth, commentOnScream);
app.get('/scream/:screamId/like', firebase_auth, likeScream);
app.get('/scream/:screamId/unlike', firebase_auth, unlikeScream);
app.delete('/scream/:screamId', firebase_auth, deleteScream);

// users routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', firebase_auth, uploadeProfileImage);
app.post('/user', firebase_auth, addUserDetails);
app.get('/user', firebase_auth, getAUthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', firebase_auth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions
.region('europe-west1')
.firestore.document('likes/{id}')
.onCreate((snapshot) => {
  return db
  .doc(`/screams/${snapshot.data().screamId}`)
  .get()
  .then(doc => {
    if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
  .catch(err => {
    console.error(err);
  })
});

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}')
.onDelete((snapshot) => {
  return db.doc(`/notifications/${snapshot.id}`).delete()
  .catch(err => {
    console.error(err);
  })
});

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
.onCreate((snapshot) => {
  return db.doc(`/screams/${snapshot.data().screamId}`).get()
  .then(doc => {
    if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
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
  .catch(err => {
    console.error(err);
  })
});

exports.onUserImageChange = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    if (change.before.data().image_url !== change.after.data().image_url) {
      const batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().image_url });
          });
          return batch.commit();
        });
    } else return true;
});

exports.onScreamDeleted = functions.region('europe-west1').firestore.document('/screams/{screamId}').onDelete((snapshot, context) => {
  const screamId = context.params.screamId;
  const batch = db.batch();
  return db.collection('comments').where('screamId', '==', screamId).get()
  .then((data) => {
    data.forEach((doc) => {
      batch.delete(db.doc(`/comments/${doc.id}`));
    })
    return db.collection('likes').where('screamId', '==', screamId).get()
  })
  .then(data => {
    data.forEach(doc => {
      batch.delete(db.doc(`/likes/${doc.id}`));
    })
    return db.collection('notifications').where('screamId', '==', screamId).get()
  })
  .then(data => {
    data.forEach(doc => {
      batch.delete(db.doc(`/notifications/${doc.id}`));
    })
    return batch.commit();
  })
  .catch(err => {
    console.error(err);
  })
});