// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '216208822056820', // your App ID
        'clientSecret'  : '69ae0eedb973b45dc910a087e1fe8aa4', // your App Secret
        'callbackURL'   : '/auth/facebook/callback'
    },

    'linkedinAuth' : {
        'clientID'       : '78hqau43n5u4pq',
        'clientSecret'    : 'l0cvFkS5ydUgXuaR',
        'callbackURL'       : '/auth/linkedin/callback'
    },

    'googleAuth' : {
        'clientID'      : '867986108743-8rk0rr63c2efmnai7sej3fvpga2ojcfr.apps.googleusercontent.com',
        'clientSecret'  : 'qCQmXcotqBEDgkDYVr_fNLbA',
        'callbackURL'   : '/auth/google/callback'
    }

};