// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '216208822056820', // your App ID
        'clientSecret'  : '69ae0eedb973b45dc910a087e1fe8aa4', // your App Secret
        'callbackURL'   : '/auth/facebook/callback'
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