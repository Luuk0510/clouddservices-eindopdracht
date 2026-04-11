var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

var connectDatabase = require('../config/database');
var env = require('../config/env');
var User = require('../models/User');

var ownerEmail = String(process.env.SEED_OWNER_EMAIL || '').trim().toLowerCase();
var ownerPassword = String(process.env.SEED_OWNER_PASSWORD || '').trim();

async function seedOwner() {
  if (!ownerEmail || !ownerPassword) {
    throw new Error('SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD are required');
  }

  await connectDatabase(env.mongoUri);

  var existingUser = await User.findOne({ email: ownerEmail });

  if (existingUser) {
    console.log('Seed owner already exists:', ownerEmail);
    return;
  }

  var passwordHash = await bcrypt.hash(ownerPassword, 10);

  await User.create({
    email: ownerEmail,
    passwordHash: passwordHash,
    role: 'target-owner'
  });

  console.log('Seed owner created:', ownerEmail);
}

seedOwner().then(function() {
  return mongoose.connection.close(false);
}).then(function() {
  process.exit(0);
}).catch(function(error) {
  console.error('Seed owner failed:', error.message);
  mongoose.connection.close(false).finally(function() {
    process.exit(1);
  });
});
