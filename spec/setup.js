var mongoose = require('mongoose');

before('database setup', function(done) {
  console.log('global setup: connecting to DB');
  var mongodbUri = 'localhost:27017/ideaJamSpec';
  var conn = mongoose.connect(mongodbUri);
  mongoose.connection.on('open', function(){
    conn.connection.db.dropDatabase(function(err, result){
      done();
    });
  });

});

after('after all cleanup', function() {
  // console.log('global teardown');
});