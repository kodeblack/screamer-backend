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
            return res.status(500).json({ genereal: 'Something went wrong, please, try again.' });
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
        return res.status(403).json({
            general: 'Wrong credentials. Please, try again'
        });
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
        return db.collection('notifications').where('recipient', '==', req.user.handle)
        .orderBy('created_at', 'desc')
        .limit(10)
        .get();
    })
    .then(data => {
        userData.notifications  = [];
        data.forEach(doc => {
            userData.notifications.push({
                recipient: doc.data().recipient,
                sender: doc.data().recipient,
                created_at: doc.data().created_at,
                screanId: doc.data().screanId,
                type: doc.data().type,
                read: doc.data().read,
                notificationId: doc.data().id,
            })
        })
        return res.json(userData);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
}

exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`).get()
    .then(doc => {
        if(doc.exists){
            userData.user = doc.data();
            return db.collection('screams').where('userHandle', '==', req.params.handle)
            .orderBy('created_at', 'desc')
            .get();
        }else{
            return res.status(404).json({ erro: 'User not found' })
        }
    })
    .then(data => {
        userData.screams = [];
        data.forEach(doc => {
            userData.screams.push({
                body: doc.data().body,
                created_at: doc.data().created_at,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                comment_count: doc.data().comment_count,
                like_count: doc.data().like_count,
                screamId: doc.id
            })
        })
        return res.json(userData)
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
}

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach((notificationId) => {
      const notification = db.doc(`/notifications/${notificationId}`);
      batch.update(notification, { read: true });
    });
    batch
      .commit()
      .then(() => {
        return res.json({ message: 'Notifications marked read' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
};