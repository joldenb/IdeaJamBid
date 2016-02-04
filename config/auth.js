// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : 'your-secret-clientID-here', // your App ID
        'clientSecret'  : 'your-client-secret-here', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '867986108743-8rk0rr63c2efmnai7sej3fvpga2ojcfr.apps.googleusercontent.com',
        'clientSecret'  : 'qCQmXcotqBEDgkDYVr_fNLbA',
        'callbackURL'   : '/auth/google/callback'
    }

};