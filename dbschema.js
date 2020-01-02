let db = {
    users: {
        userId: 'jdajdaljd920180139ksjdka8',
        email: 'user@email.com',
        handle: 'a-user',
        created_at: '2019-12-30T15:41:27.299Z',
        image_url: 'image/jdakjdakda/jdaldjaljdla',
        bio: 'Hello, I am a user, welcome here and it\'s nice to meet you',
        website: 'https://user.com',
        location: 'London, UK'
    },
    screams: [
        {
            userHandle: "user",
            body: 'this is the scream body',
            created_at: '2019-12-28T16:17:48.595Z',
            like_count: 5,
            comment_count: 3
        }
    ],
    comments: [
      {
        userHandle: 'user',
        screamId: 'kdjsfgdksuufhgkdsufky',
        body: 'nice one mate!',
        createdAt: '2019-03-15T10:59:52.798Z'
      }
    ],
    notifications: [
      {
        recipient: 'user',
        sender: 'john',
        read: 'true | false',
        screamId: 'kdjsfgdksuufhgkdsufky',
        type: 'like | comment',
        createdAt: '2019-03-15T10:59:52.798Z'
      }
    ]
};

const userDetails = {
    // Redux data
    credentials: {
      userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
      email: 'user@email.com',
      handle: 'user',
      createdAt: '2019-03-15T10:59:52.798Z',
      imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
      bio: 'Hello, my name is user, nice to meet you',
      website: 'https://user.com',
      location: 'Lonodn, UK'
    },
    likes: [
      {
        userHandle: 'user',
        screamId: 'hh7O5oWfWucVzGbHH2pa'
      },
      {
        userHandle: 'user',
        screamId: '3IOnFoQexRcofs5OhBXO'
      }
    ]
  };