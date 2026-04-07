module.exports = function buildRegistrationEmail(payload) {
  var title = payload.targetTitle || 'Untitled target';
  var subject = 'Registration confirmed: ' + title;
  var text = [
    'Your registration has been received.',
    '',
    'Title: ' + title,
    'Target ID: ' + payload.targetId,
    'Deadline: ' + (payload.targetDeadline || 'unknown'),
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown'),
    'Radius: ' + (payload.targetRadiusMeters ? payload.targetRadiusMeters + ' meters' : 'unknown'),
    '',
    'Registration ID: ' + payload.registrationId
  ].join('\n');
  var html = [
    '<p>Your registration has been received.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + payload.targetId + '</li>',
    '<li><strong>Deadline:</strong> ' + (payload.targetDeadline || 'unknown') + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    '<li><strong>Radius:</strong> ' + (payload.targetRadiusMeters ? payload.targetRadiusMeters + ' meters' : 'unknown') + '</li>',
    '</ul>',
    '<p><strong>Registration ID:</strong> ' + payload.registrationId + '</p>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
