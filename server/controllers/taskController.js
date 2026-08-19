const Task = require('../models/Task');
const Project = require('../models/Project');

/** Check if userId is a member of the project */
const isMember = (project, userId) =>
  project.members.some((m) => m.user.toString() === userId.toString());

// ─── GET /api/tasks/project/:projectId ───────────────────────────────────────
const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (!isMember(project, userId)) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    const { projectId, title, description, assignedTo } = req.body;
    const userId = req.user._id;

    if (!projectId || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'projectId and title are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (!isMember(project, userId)) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    const task = await Task.create({
      project: projectId,
      title: title.trim(),
      description: description?.trim(),
      assignedTo: assignedTo || undefined,
    });

    await task.populate('assignedTo', 'name');

    return res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
const updateTask = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || !isMember(project, userId)) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    const { title, description, status, assignedTo } = req.body;
    const VALID_STATUSES = ['todo', 'in_progress', 'done'];

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || undefined;

    await task.save();
    await task.populate('assignedTo', 'name');

    return res.status(200).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || !isMember(project, userId)) {
      return res.status(403).json({ success: false, message: 'Not a project member' });
    }

    await task.deleteOne();

    return res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };
