module.exports = function authorizeRole() {
  var allowedRoles = Array.prototype.slice.call(arguments);

  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    if (allowedRoles.indexOf(req.user.role) === -1) {
      return res.status(403).json({
        message: 'Forbidden for this role',
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};
