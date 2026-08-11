const Chapter = require("../models/Chapter");
const Project = require("../models/Project");

// Project start dates pass even when nobody has yet created a chapter. Update
// persisted statuses when projects are read so existing projects also reflect
// that they are already underway without requiring a background scheduler.
const syncStartedProjects = () =>
  Project.updateMany(
    { status: "Not Started", startDate: { $lte: new Date() } },
    { $set: { status: "In Progress" } }
  );

// Keep the project summary in sync with its chapter milestones. A project
// begins as soon as chapter work exists, and finishes only when every chapter
// has been marked completed by its supervisor.
const syncProjectProgress = async (projectId) => {
  const [project, chapters] = await Promise.all([
    Project.findById(projectId),
    Chapter.find({ project: projectId }).select("status"),
  ]);
  if (!project || project.status === "Archived" || chapters.length === 0) return project;

  const completedCount = chapters.filter((chapter) => chapter.status === "Completed").length;
  project.completionPercentage = Math.round((completedCount / chapters.length) * 100);
  project.status = completedCount === chapters.length ? "Completed" : "In Progress";
  await project.save();

  return project;
};

module.exports = { syncProjectProgress, syncStartedProjects };
