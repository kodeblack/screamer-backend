const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/screams', (req, res) => {
    admin.firestore()
    .collection('screams')
    .orderBy('created_at', 'desc')
    .get()
    .then(data => {
        let screams = [];
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                created_at: doc.data().created_at
            });
        });
        return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post('/scream', (req, res) => {
    
   const newScream = {
       body: req.body.body,
       userHandle: req.body.userHandle,
       created_at: new Date().toISOString()
   };

   admin.firestore()
    .collection('screams')
    .add(newScream) 
    .then(doc => {
        res.json({
            message: `document ${doc.id} created successfully`
        });
    })
    .catch(err => {
        res.status(500).json({
            error: 'Something went wrong'
        });
        console.log(err);
    })
});

//https://baseurl/api/?

exports.api = functions.region('europe-west1').https.onRequest(app);