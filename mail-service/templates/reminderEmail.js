module.exports = function buildReminderEmail(payload) {
  var targetId = payload.targetId || 'unknown target';
  var subject = 'Deadline reminder';
  var text = 'Reminder: the deadline for target ' + targetId + ' is coming up.';
  var html = '<p>Reminder: the deadline for target <strong>' + targetId + '</strong> is coming up.</p>';

  return {
    subject: subject,
    text: text,
    html: html
  };
};
