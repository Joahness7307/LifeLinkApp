// const requireRole = (allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authorization required' });
//     }

//     // Convert single role to array for consistent handling
//     const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ error: 'Not authorized for this action' });
//     }

//     next();
//   };
// };

// module.exports = { requireRole };
