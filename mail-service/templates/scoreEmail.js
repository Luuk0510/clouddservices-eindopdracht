module.exports = function buildScoreEmail(payload) {
  var targetId = payload.targetId || 'unknown target';
  var subject = 'Score available';
  var resultText = payload.isWinner ? 'You won this competition.' : 'The competition result is now available.';
  var text = 'The score for target ' + targetId + ' is available. ' + resultText;
  var html = '<p>The score for target <strong>' + targetId + '</strong> is available.</p><p>' + resultText + '</p>';

  return {
    subject: subject,
    text: text,
    html: html
  };
};
