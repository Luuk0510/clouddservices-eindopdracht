var app = require('./app');
var mongoose = require('mongoose');

var port = process.env.PORT || 3001;
var mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/photo-prestige';

mongoose.connect(mongoUri).then(function() {
  console.log('Auth service connected to MongoDB');

  app.listen(port, function() {
    console.log('Auth service listening on port ' + port);
  });
}).catch(function(error) {
  console.error('Failed to connect to MongoDB', error);
  process.exit(1);
});
