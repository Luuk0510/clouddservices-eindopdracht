var Clock = require('../models/Clock');
var env = require('../config/env');
var rabbitmq = require('../utils/rabbitmq');
var logger = require('../utils/logger');

var MAX_TIMEOUT_MS = 2147483647;
var timers = {};
var reminderTimers = {};

function clearTimer(targetId) {
  if (timers[targetId]) {
    clearTimeout(timers[targetId]);
    delete timers[targetId];
  }

  if (reminderTimers[targetId]) {
    clearTimeout(reminderTimers[targetId]);
    delete reminderTimers[targetId];
  }
}

function getRemainingMs(deadlineAt) {
  return new Date(deadlineAt).getTime() - Date.now();
}

function scheduleInChunks(targetId, remainingMs) {
  clearTimer(targetId);

  var delay = Math.min(remainingMs, MAX_TIMEOUT_MS);

  timers[targetId] = setTimeout(async function() {
    delete timers[targetId];

    if (remainingMs > MAX_TIMEOUT_MS) {
      scheduleInChunks(targetId, remainingMs - MAX_TIMEOUT_MS);
      return;
    }

    await reachDeadline(targetId);
  }, delay);
}

function publishDeadlineReached(clock) {
  rabbitmq.publish('clock.deadline-reached.v1', {
    clockId: String(clock._id),
    targetId: clock.targetId,
    ownerId: clock.ownerId,
    ownerEmail: clock.ownerEmail,
    deadlineAt: clock.deadlineAt.toISOString(),
    reachedAt: clock.reachedAt.toISOString()
  });
}

function publishDeadlineReminder(clock) {
  rabbitmq.publish('clock.deadline-reminder.v1', {
    clockId: String(clock._id),
    targetId: clock.targetId,
    ownerId: clock.ownerId,
    ownerEmail: clock.ownerEmail,
    deadlineAt: clock.deadlineAt.toISOString(),
    reminderAt: new Date().toISOString()
  });
}

async function reachDeadline(targetId) {
  var reachedAt = new Date();

  var clock = await Clock.findOneAndUpdate({
    targetId: targetId,
    status: 'running'
  }, {
    $set: {
      status: 'reached',
      reachedAt: reachedAt
    }
  }, {
    new: true
  });

  if (!clock) {
    return;
  }

  logger.info('clock.deadline_reached.v1', {
    targetId: targetId,
    deadlineAt: clock.deadlineAt.toISOString(),
    reachedAt: reachedAt.toISOString()
  });

  publishDeadlineReached(clock);
}

function scheduleReminder(clock) {
  var reminderOffsetMs = env.deadlineReminderMinutes * 60 * 1000;
  var reminderAtMs = new Date(clock.deadlineAt).getTime() - reminderOffsetMs;
  var delay = reminderAtMs - Date.now();

  if (delay <= 0) {
    return;
  }

  if (reminderTimers[clock.targetId]) {
    clearTimeout(reminderTimers[clock.targetId]);
  }

  reminderTimers[clock.targetId] = setTimeout(function() {
    delete reminderTimers[clock.targetId];

    publishDeadlineReminder(clock);

    logger.info('clock.deadline_reminder.v1', {
      targetId: clock.targetId,
      deadlineAt: new Date(clock.deadlineAt).toISOString()
    });
  }, delay);
}

function scheduleClock(clock) {
  var remainingMs = getRemainingMs(clock.deadlineAt);

  if (remainingMs <= 0) {
    return reachDeadline(clock.targetId);
  }

  scheduleInChunks(clock.targetId, remainingMs);
  scheduleReminder(clock);

  logger.info('clock.scheduled', {
    targetId: clock.targetId,
    deadlineAt: new Date(clock.deadlineAt).toISOString(),
    remainingMs: remainingMs
  });

  return Promise.resolve();
}

exports.handleTargetCreatedEvent = async function handleTargetCreatedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt || !message.ownerId) {
    throw new Error('target.created.v1 missing required fields');
  }

  var deadlineAt = new Date(message.deadlineAt);

  if (Number.isNaN(deadlineAt.getTime())) {
    throw new Error('target.created.v1 has invalid deadlineAt');
  }

  var clock = await Clock.findOneAndUpdate({
    targetId: message.targetId
  }, {
    $set: {
      ownerId: message.ownerId,
      ownerEmail: message.ownerEmail || '',
      deadlineAt: deadlineAt,
      status: 'running',
      reachedAt: null
    },
    $setOnInsert: {
      startedAt: new Date()
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  await scheduleClock(clock);
};

exports.restoreRunningClocks = async function restoreRunningClocks() {
  var runningClocks = await Clock.find({ status: 'running' });

  for (var i = 0; i < runningClocks.length; i += 1) {
    await scheduleClock(runningClocks[i]);
  }

  logger.info('clock.restore_completed', {
    restoredCount: runningClocks.length
  });
};

exports.stopAll = function stopAll() {
  var targetIds = Object.keys(timers);

  for (var i = 0; i < targetIds.length; i += 1) {
    clearTimer(targetIds[i]);
  }
};
