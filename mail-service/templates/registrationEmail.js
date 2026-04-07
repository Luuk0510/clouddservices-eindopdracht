module.exports = function buildRegistrationEmail(payload) {
  var subject = 'Registration confirmed';
  var text = 'Your registration for target ' + payload.targetId + ' has been received.';
  var html = '<p>Your registration for target <strong>' + payload.targetId + '</strong> has been received.</p>';

  return {
    subject: subject,
    text: text,
    html: html
  };
};
