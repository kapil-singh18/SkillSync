const Project = require('../models/Project');
const Task = require('../models/Task');

// ─── GET /api/projects ────────────────────────────────────────────────────────
const getProjects = async (req, res, next) => {
  try {
    const { skills } = req.query;
    const filter = { status: 'open' };

    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillList.length) {
        filter.requiredSkills = { $in: skillList };
      }
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name role')
      .populate('members.user', 'name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/projects ───────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
  try {
    const { title, description, type, requiredSkills } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!type || !['study_project', 'hackathon_team'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "study_project" or "hackathon_team"' });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description?.trim(),
      type,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    });

    await project.populate('owner', 'name role');
    await project.populate('members.user', 'name role');

    return res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/projects/mine ───────────────────────────────────────────────────
const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name role')
      .populate('members.user', 'name role')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name role')
      .populate('members.user', 'name role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, project, tasks });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/projects/:id/join ──────────────────────────────────────────────
const joinProject = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    project.members.push({ user: userId, role: 'member' });
    await project.save();

    await project.populate('owner', 'name role');
    await project.populate('members.user', 'name role');

    return res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getMyProjects, getProjectById, joinProject };
