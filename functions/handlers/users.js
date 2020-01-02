const { db, admin } = require('../utility/admin')
const firebase = require('firebase')
const fireabse_config = require('../utility/fireabse_config')
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../utility/validators')

firebase.initializeApp(fireabse_config);

exports.signup = (req, res) => {
    
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    const { valid, errors } =  validateSignupData(newUser)

    if(!valid) return res.status(400).json(errors);

    const no_image = 'blank.png';

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
            image_url: `https://firebasestorage.googleapis.com/v0/b/${fireabse_config.storageBucket}/o/${no_image}?alt=media`,
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
}

exports.login =  (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } =  validateLoginData(user)

    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
        return data.user.getIdToken();
    })
    .then(token => {
        return res.json({ token });
    })
    .catch(err => {
        console.error(err);
        if(err.code === 'auth/wrong-password'){
            return res.status(403).json({
                general: 'Wrong credentials. Please, try again'
            });
        }else{
            return res.status(500).json({ error: err.code });
        }
    })
}

exports.uploadeProfileImage = (req, res) => {
    const busboy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const bus_boy = new busboy({ headers:req.headers })
    let image_file_name;
    let image_to_be_uploaded = {};
    bus_boy.on('file', (fieldname, file, filename, encoding, mimetype) => {

        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
            return res.status(400).json({
                error: 'File must be an image.'
            });
        }

        const image_extension = filename.split('.')[filename.split('.').length - 1];
        image_file_name = `${Math.round(Math.random() * 1000000000000).toString()}.${image_extension}`;
        const file_path = path.join(os.tmpdir(), image_file_name);
        image_to_be_uploaded= { file_path, mimetype }
        file.pipe(fs.createWriteStream(file_path));
    });
    bus_boy.on('finish', () => {
        admin.storage().bucket().upload(image_to_be_uploaded.file_path, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: image_to_be_uploaded.mimetype
                }
            }
        })
        .then(() => {
            const image_url = `https://firebasestorage.googleapis.com/v0/b/${fireabse_config.storageBucket}/o/${image_file_name}?alt=media`;
            return db.doc(`/users/${req.user.handle}`)
            .update({ image_url})
        })
        .then(() => {
            res.json({ message: 'Image uploaded successfully' })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
    });
    bus_boy.end(req.rawBody);
}

exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);
    dob.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.json({ message: 'Details added successfully' });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
};

exports.getAUthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle', '==', req.user.handle).get();
        }
    })
    .then(data => {
        userData.likes = [];
        data.forEach(doc => {
            userData.likes.push(doc.data());
        })
        return res.json(userData);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
}