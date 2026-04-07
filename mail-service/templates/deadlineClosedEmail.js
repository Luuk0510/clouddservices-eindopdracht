module.exports = function buildDeadlineClosedEmail(payload) {
  var subject = 'Deadline passed';
  var text = 'The deadline for target ' + payload.targetId + ' has passed.';
  var html = '<p>The deadline for target <strong>' + payload.targetId + '</strong> has passed.</p>';

  return {
    subject: subject,
    text: text,
    html: html
  };
};
