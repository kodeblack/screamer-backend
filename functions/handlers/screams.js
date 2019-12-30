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