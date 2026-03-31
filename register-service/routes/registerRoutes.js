var express = require('express');

var registerController = require('../controllers/registerController');
var authenticate = require('../middleware/authenticate');
var asyncHandler = require('../utils/asyncHandler');
var validateTargetId = require('../middleware/validateTargetId');

var router = express.Router();

router.get('/api/v1/register/health', registerController.health);
router.post('/api/v1/targets/:targetId/registrations', authenticate, validateTargetId, asyncHandler(registerController.createRegistration));
router.get('/api/v1/me/registrations', authenticate, asyncHandler(registerController.listMyRegistrations));
router.get('/api/v1/targets/:targetId/participants', authenticate, validateTargetId, asyncHandler(registerController.listTargetParticipants));
router.delete('/api/v1/targets/:targetId/registrations/me', authenticate, validateTargetId, asyncHandler(registerController.deleteMyRegistration));

module.exports = router;
