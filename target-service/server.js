var app = require('./app');
var mongoose = require('mongoose');

var port = process.env.PORT || 3002;
var mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/photo-prestige';

mongoose.connect(mongoUri).then(function() {
  console.log('Target service connected to MongoDB');

  app.listen(port, function() {
    console.log('Target service listening on port ' + port);
  });
}).catch(function(error) {
  console.error('Failed to connect to MongoDB', error);
  process.exit(1);
});
