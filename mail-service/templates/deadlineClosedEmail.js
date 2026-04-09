module.exports = function buildDeadlineClosedEmail(payload) {
  var title = payload.targetTitle || 'Untitled target';
  var imageLink = payload.targetImageUrl ? 'View target image: ' + payload.targetImageUrl : null;
  var subject = 'Deadline passed: ' + title;
  var text = [
    'The deadline has passed.',
    '',
    'Title: ' + title,
    'Target ID: ' + payload.targetId,
    'Deadline: ' + (payload.deadlineAt || 'unknown'),
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown'),
    imageLink
  ].filter(Boolean).join('\n');
  var html = [
    '<p>The deadline has passed.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + payload.targetId + '</li>',
    '<li><strong>Deadline:</strong> ' + (payload.deadlineAt || 'unknown') + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    payload.targetImageUrl ? '<li><strong>Target image:</strong> <a href="' + payload.targetImageUrl + '">View target image</a></li>' : '',
    '</ul>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
