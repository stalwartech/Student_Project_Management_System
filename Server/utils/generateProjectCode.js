const Project = require("../models/Project");

const generateProjectCode = async () => {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;

  const count = await Project.countDocuments({
    projectCode: { $regex: `^${prefix}` },
  });

  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}${sequence}`;
};

module.exports = generateProjectCode;
