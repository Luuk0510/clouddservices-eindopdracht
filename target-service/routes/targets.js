var express = require('express');

var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var targetController = require('../controllers/targetController');

var router = express.Router();

router.get('/', targetController.listTargets);
router.post('/', authenticate, authorizeRole('target-owner'), targetController.createTarget);
router.get('/:targetId', targetController.getTarget);
router.get('/:targetId/votes', targetController.getVotes);
router.post('/:targetId/vote', authenticate, authorizeRole('participant'), targetController.saveVote);
router.patch('/:targetId/deadline', authenticate, authorizeRole('target-owner'), targetController.updateDeadline);
router.delete('/:targetId', authenticate, authorizeRole('target-owner'), targetController.deleteTarget);

module.exports = router;
