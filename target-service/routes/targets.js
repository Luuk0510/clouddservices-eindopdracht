var express = require('express');

var Target = require('../models/Target');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var rabbitmq = require('../utils/rabbitmq');

var router = express.Router();

async function closeExpiredTargets() {
  await Target.updateMany({
    status: 'active',
    deadlineAt: { $lt: new Date() }
  }, {
    $set: { status: 'closed' }
  });
}

function parseCoordinates(latValue, lngValue) {
  var lat = Number(latValue);
  var lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat: lat,
    lng: lng
  };
}

router.get('/', async function(req, res) {
  try {
    await closeExpiredTargets();

    var filter = {};

    if (req.query.city) {
      filter.city = new RegExp(req.query.city, 'i');
    }

    if (req.query.ownerId) {
      filter.ownerId = req.query.ownerId;
    }

    if (req.query.active === 'true') {
      filter.status = 'active';
    }

    if (req.query.active === 'false') {
      filter.status = 'closed';
    }

    var query = Target.find(filter).sort({ createdAt: -1 });

    if (req.query.lat && req.query.lng) {
      var point = parseCoordinates(req.query.lat, req.query.lng);

      if (!point) {
        return res.status(400).json({
          message: 'Invalid coordinates in query'
        });
      }

      var radiusMeters = req.query.radiusMeters ? Number(req.query.radiusMeters) : null;
      var radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : null;

      if (radiusMeters && Number.isFinite(radiusMeters)) {
        query.where('location').near({
          center: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          maxDistance: radiusMeters,
          spherical: true
        });
      } else if (radiusKm && Number.isFinite(radiusKm)) {
        query.where('location').near({
          center: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          maxDistance: radiusKm * 1000,
          spherical: true
        });
      }
    }

    var limit = req.query.limit ? Number(req.query.limit) : 50;
    var skip = req.query.skip ? Number(req.query.skip) : 0;

    if (Number.isFinite(limit) && limit > 0) {
      query.limit(Math.min(limit, 200));
    }

    if (Number.isFinite(skip) && skip >= 0) {
      query.skip(skip);
    }

    var targets = await query.exec();

    res.status(200).json({
      count: targets.length,
      targets: targets
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to list targets',
      error: error.message
    });
  }
});

router.post('/', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var requiredFields = ['title', 'imageUrl', 'lat', 'lng', 'deadlineAt'];

    for (var i = 0; i < requiredFields.length; i += 1) {
      if (req.body[requiredFields[i]] === undefined || req.body[requiredFields[i]] === null || req.body[requiredFields[i]] === '') {
        return res.status(400).json({
          message: 'Missing required field: ' + requiredFields[i]
        });
      }
    }

    var point = parseCoordinates(req.body.lat, req.body.lng);

    if (!point) {
      return res.status(400).json({
        message: 'Invalid coordinates'
      });
    }

    var deadlineAt = new Date(req.body.deadlineAt);

    if (Number.isNaN(deadlineAt.getTime()) || deadlineAt <= new Date()) {
      return res.status(400).json({
        message: 'deadlineAt must be a valid future date'
      });
    }

    var radiusMeters = req.body.radiusMeters ? Number(req.body.radiusMeters) : 250;

    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
      return res.status(400).json({
        message: 'radiusMeters must be a positive number'
      });
    }

    var target = await Target.create({
      title: req.body.title,
      description: req.body.description || '',
      imageUrl: req.body.imageUrl,
      locationDescription: req.body.locationDescription || '',
      city: req.body.city || '',
      location: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      radiusMeters: radiusMeters,
      deadlineAt: deadlineAt,
      status: 'active',
      ownerId: req.auth.userId,
      ownerEmail: req.auth.email || ''
    });

    rabbitmq.publish('target.created.v1', {
      targetId: String(target._id),
      ownerId: target.ownerId,
      ownerEmail: target.ownerEmail,
      imageUrl: target.imageUrl,
      deadlineAt: target.deadlineAt.toISOString(),
      createdAt: target.createdAt.toISOString()
    });

    res.status(201).json({
      message: 'Target created',
      target: target
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create target',
      error: error.message
    });
  }
});

router.get('/:targetId', async function(req, res) {
  try {
    await closeExpiredTargets();

    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    res.status(200).json({
      target: target
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to load target',
      error: error.message
    });
  }
});

router.patch('/:targetId/deadline', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    if (target.ownerId !== req.auth.userId) {
      return res.status(403).json({
        message: 'Only the owner can change the deadline'
      });
    }

    var deadlineAt = new Date(req.body.deadlineAt);

    if (Number.isNaN(deadlineAt.getTime()) || deadlineAt <= new Date()) {
      return res.status(400).json({
        message: 'deadlineAt must be a valid future date'
      });
    }

    target.deadlineAt = deadlineAt;
    target.status = 'active';
    await target.save();

    res.status(200).json({
      message: 'Deadline updated',
      target: target
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to update deadline',
      error: error.message
    });
  }
});

router.delete('/:targetId', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await Target.findById(req.params.targetId);

    if (!target) {
      return res.status(404).json({
        message: 'Target not found'
      });
    }

    if (target.ownerId !== req.auth.userId) {
      return res.status(403).json({
        message: 'Only the owner can delete this target'
      });
    }

    await Target.deleteOne({ _id: target._id });

    res.status(200).json({
      message: 'Target deleted',
      targetId: target._id
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to delete target',
      error: error.message
    });
  }
});

module.exports = router;
