const { db } = require('../utility/admin')

exports.getScreams = (req, res) => {
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
}

exports.createScream = (req, res) => {
    
    if(req.body.body.trim() === ''){
        return res.status(400).json({ body: 'Body must not be empty' });
    }

    const newScream = {
       body: req.body.body,
       userHandle: req.user.handle,
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
}

exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({ error: 'Scream not found' });
        }
        screamData = doc.data();
        screamData.screamId = doc.id;
        return db.collection('comments')
        .orderBy('created_at', 'desc')
        .where('screamId', '==', req.params.screamId).get();
    })
    .then(data => {
        screamData.comments = [];
        data.forEach(doc => {
            screamData.comments.push(doc.data())
        });
        return res.json(screamData);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
}

exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({ error: 'Must not be empty' });
    const comment = {
        body: req.body.body,
        created_at: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.image_url
    };
    db.doc(`/screams/${req.params.screamId}`).get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({ error: 'Scream not found' });
        }
        return db.collection('comments').add(comment)
    })
    .then(() => {
        res.json(comment);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({
            error: 'Something went wrong'
        });
    })
}