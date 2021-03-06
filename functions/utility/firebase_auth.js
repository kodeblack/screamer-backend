const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    }else{
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorized' });
    }

    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        req.user = decodedToken;
        console.log(decodedToken);
        return db.collection('users')
        .where('userId', 
        '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(tokenData => {
        req.user.handle = tokenData.docs[0].data().handle;
        req.user.image_url = tokenData.docs[0].data().image_url;
        return next();
    })
    .catch(err => {
        console.error('Error while verifying token', err);
        if(err.code === 'auth/argument-error')
        {
            return res.status(403).json({ error: 'Invalid Token' });
        }else if(err.code == 'auth/id-token-expired'){
            return res.status(403).json({ error: 'Expired Token' });
        }
        return res.status(403).json(err);
    });

}