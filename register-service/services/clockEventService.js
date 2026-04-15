var ClosedTarget = require('../models/ClosedTarget');

exports.markTargetClosed = async function markTargetClosed(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reached.v1 missing required fields');
  }

  var deadlineAt = new Date(message.deadlineAt);

  if (Number.isNaN(deadlineAt.getTime())) {
    throw new Error('clock.deadline-reached.v1 has invalid deadlineAt');
  }

  await ClosedTarget.findOneAndUpdate({
    targetId: message.targetId
  }, {
    $set: {
      closedAt: new Date(),
      deadlineAt: deadlineAt
    }
  }, {
    upsert: true,
    setDefaultsOnInsert: true
  });
};

exports.isTargetClosed = async function isTargetClosed(targetId) {
  var closedTarget = await ClosedTarget.findOne({ targetId: targetId });
  return Boolean(closedTarget);
};
