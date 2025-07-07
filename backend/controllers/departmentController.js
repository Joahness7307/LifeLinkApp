const Department = require('../models/departmentModel');

const getAllEmergencyTypesWithDepartments = async (req, res) => {
  try {
    // Get all departments with their emergencyTypes
    const departments = await Department.find({}, 'name emergencyTypes');
    // Build a map: { emergencyType: [departments...] }
    const typeMap = {};
    departments.forEach(dept => {
      dept.emergencyTypes.forEach(type => {
        if (!typeMap[type]) typeMap[type] = [];
        typeMap[type].push(dept.name);
      });
    });
    // Optionally, return as an array of { type, departments }
    const result = Object.entries(typeMap).map(([type, departments]) => ({
      type, departments
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergency types' });
  }
};

const getDepartmentIdForType = async (req, res) => {
  const { type } = req.params;
  const { cityId } = req.query;
  
  try {
    console.log('Querying for department:', { emergencyTypes: type, city: cityId });
    // Find the department that handles this type AND is in the correct city
    const query = { emergencyTypes: type };
    if (cityId) query.city = cityId; // Only match departments in the correct city
    const department = await Department.findOne(query);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ departmentId: department._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAllEmergencyTypesWithDepartments,
  getDepartmentIdForType
};