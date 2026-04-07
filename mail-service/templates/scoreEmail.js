module.exports = function buildScoreEmail(payload) {
  var targetId = payload.targetId || 'unknown target';
  var title = payload.targetTitle || 'Untitled target';
  var subject = 'Score available';
  var resultText = payload.isWinner ? 'You won this competition.' : 'The competition result is now available.';
  var text = [
    'The score is now available.',
    '',
    'Title: ' + title,
    'Target ID: ' + targetId,
    'Similarity score: ' + (payload.similarityScore !== undefined && payload.similarityScore !== null ? payload.similarityScore + '%' : 'unknown'),
    'City: ' + (payload.targetCity || 'unknown'),
    'Location: ' + (payload.targetLocationDescription || 'unknown'),
    '',
    resultText
  ].join('\n');
  var html = [
    '<p>The score is now available.</p>',
    '<p><strong>' + title + '</strong></p>',
    '<ul>',
    '<li><strong>Target ID:</strong> ' + targetId + '</li>',
    '<li><strong>Similarity score:</strong> ' + (payload.similarityScore !== undefined && payload.similarityScore !== null ? payload.similarityScore + '%' : 'unknown') + '</li>',
    '<li><strong>City:</strong> ' + (payload.targetCity || 'unknown') + '</li>',
    '<li><strong>Location:</strong> ' + (payload.targetLocationDescription || 'unknown') + '</li>',
    '</ul>',
    '<p>' + resultText + '</p>'
  ].join('');

  return {
    subject: subject,
    text: text,
    html: html
  };
};
