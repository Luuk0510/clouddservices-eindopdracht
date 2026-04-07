module.exports = function buildReminderEmail(payload) {
  var targetId = payload.targetId || 'unknown target';
  var title = payload.targetTitle || 'Untitled target';
  var subject = 'Deadline reminder: ' + title;
  var text = [
    'Reminder: the deadline is coming up.',
    '',
    'Title: ' + title,
    'Target ID: ' + targetId,
    'Deadline: ' + (payload.deadlineAt || 'unknown'),
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown')
  ].join('\n');
  var html = [
    '<p>Reminder: the deadline is coming up.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + targetId + '</li>',
    '<li><strong>Deadline:</strong> ' + (payload.deadlineAt || 'unknown') + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    '</ul>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
