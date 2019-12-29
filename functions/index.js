const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebase = require('firebase');

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyA8SQbYDwRU0_DUkwpReNnTRLfZNOcAfgc",
    authDomain: "socialape-e26f7.firebaseapp.com",
    databaseURL: "https://socialape-e26f7.firebaseio.com",
    projectId: "socialape-e26f7",
    storageBucket: "socialape-e26f7.appspot.com",
    messagingSenderId: "924127041829",
    appId: "1:924127041829:web:5d11b85a51623cfdf7a2cc",
    measurementId: "G-T9K8HKS921"
};

firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req, res) => {
    db.collection('screams')
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

   db.collection('screams')
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

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}

//signup
app.post('/signup', (req, res) => {
    
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};

    if(isEmpty(newUser.email)){
        errors.email = 'Must not be empty';
    }else if(!isEmail(newUser.email)){
        errors.email = 'Must be a valid E-mail address';
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    //Validate user
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if(doc.exists){
            return res.status(400).json({ handle: 'This handle is already taken'});
        }else{
            return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then(idToken => {
         token = idToken;
         const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            created_at: new Date().toISOString(),
            userId
         };
         return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
        return res.status(201).json({ token });
    })
    .catch(err => {
        console.error(err);
        if(err.code === "auth/email-already-in-use"){
            return res.status(400).json({
                email: "E-mail is already in use"
            })
        }
        else{
            return res.status(500).json({ error: err.code });
        }
    })
});

/**
 * Load the url with a /api
 * https://baseurl/api/?
 */

exports.api = functions.region('europe-west1').https.onRequest(app);