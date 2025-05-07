// const Alert = require('../models/alertModel');

// // Get alerts for responder's agency
// const getAlerts = async (req, res) => {
//   try {
//     if (!req.user.agencyId) {
//       return res.status(400).json({ error: 'Responder does not have an associated agencyId.' });
//     }

//     const alerts = await Alert.find({ agencyId: req.user.agencyId })
//       .populate('userId', 'userName phoneNumber address')
//       .populate('emergencyId', 'type description')
//       .sort({ createdAt: -1 });

//     res.json(alerts);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// // Update alert status
// const updateAlertStatus = async (req, res) => {
//   try {
//     const { alertId } = req.params;
//     const { status } = req.body;

//     const alert = await Alert.findById(alertId);

//     if (!alert) {
//       return res.status(404).json({ error: 'Alert not found' });
//     }

//     // Check if responder belongs to the agency assigned to this alert
//     if (alert.agencyId.toString() !== req.user.agencyId.toString()) {
//       return res.status(403).json({ error: 'Not authorized to update this alert' });
//     }

//     alert.status = status;
//     await alert.save();

//     res.json(alert);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// module.exports = {
//   getAlerts,
//   updateAlertStatus
// };
