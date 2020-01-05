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
       userImage: req.user.image_url,
       created_at: new Date().toISOString(),
       like_count: 0,
       comment_count: 0
    };

    db.collection('screams')
    .add(newScream) 
    .then(doc => {
        const resScream = newScream;
        resScream.screamId = doc.id;
        res.json(resScream);
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
        .where('screamId', '==', req.params.screamId)
        .get();
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
        return doc.ref.update({ comment_count: doc.data().comment_ccount+1 })
    })
    .then(() => {
        return db.collection('comments').add(comment);
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

exports.likeScream = (req, res) => {
    const likeDocument = db
      .collection('likes')
      .where('userHandle', '==', req.user.handle)
      .where('screamId', '==', req.params.screamId)
      .limit(1);
  
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
  
    let screamData;
  
    screamDocument
      .get()
      .then((doc) => {
        if (doc.exists) {
          screamData = doc.data();
          screamData.screamId = doc.id;
          return likeDocument.get();
        } else {
          return res.status(404).json({ error: 'Scream not found' });
        }
      })
      .then((data) => {
        if (data.empty) {
          return db
            .collection('likes')
            .add({
              screamId: req.params.screamId,
              userHandle: req.user.handle
            })
            .then(() => {
              screamData.like_count++;
              return screamDocument.update({ like_count: screamData.like_count });
            })
            .then(() => {
              return res.json(screamData);
            });
        } else {
          return res.status(400).json({ error: 'Scream already liked' });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.code });
      });
};

exports.unlikeScream = (req,res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
    .where('screamId', '==', req.params.screamId)
    .limit(1);
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData = {};
    screamDocument.get()
    .then(doc => {
        if(doc.exists){
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        }else{
            res.status(404).json({ error: 'Scream not found' });
        }
    })
    .then(data => {
        if(data.empty){
            return res.status(400).json({ error: 'Scream not liked' });
        }else{
            db.doc(`/likes/${data.docs[0].id}`).delete()
            .then(() => {
                screamData.like_count--;
                return screamDocument.update({
                    like_count:screamData.like_count
                })
            })
            .then(() => {
                return res.json(screamData);
            })
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code })
    })   
}

exports.deleteScream = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({ error: 'Scream not found' });
        }
        if(doc.data().userHandle !== req.user.handle){
            return res.status(403).json({ error: 'Unauthorized' });
        }else{
            return document.delete();
        }
        // TODO: Delete Scream likes and comments when scream is deleted.
    })
    .then(() => { 
        res.json({ message: 'Scream deleted successfully' })
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
}