var express = require('express');

var scoreController = require('../controllers/scoreController');
var authenticate = require('../middleware/authenticate');
var asyncHandler = require('../utils/asyncHandler');
var validateImageUrl = require('../middleware/validateImageUrl');
var validateTargetId = require('../middleware/validateTargetId');

var router = express.Router();

router.get('/api/v1/score/health', scoreController.health);
router.post('/api/v1/targets/:targetId/submissions', authenticate, validateTargetId, validateImageUrl, asyncHandler(scoreController.createSubmission));
router.get('/api/v1/targets/:targetId/score', authenticate, validateTargetId, asyncHandler(scoreController.getMyScore));
router.get('/api/v1/targets/:targetId/scores', authenticate, validateTargetId, asyncHandler(scoreController.getTargetScores));
router.delete('/api/v1/submissions/:submissionId', authenticate, asyncHandler(scoreController.deleteSubmission));

module.exports = router;
