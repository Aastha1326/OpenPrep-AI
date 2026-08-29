const studyReminderService = require('../services/studyReminderService');

/** POST /api/reminders — Create a new reminder */
exports.create = async (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ success: false, error: 'title is required' });
    const reminder = await studyReminderService.createReminder(req.user.id, req.body);
    res.status(201).json({ success: true, data: reminder });
  } catch (error) { next(error); }
};

/** GET /api/reminders — Get all reminders */
exports.getAll = async (req, res, next) => {
  try {
    const reminders = await studyReminderService.getAllReminders(req.user.id);
    res.status(200).json({ success: true, data: reminders });
  } catch (error) { next(error); }
};

/** GET /api/reminders/stats — Get reminder statistics */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await studyReminderService.getReminderStats(req.user.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) { next(error); }
};

/** GET /api/reminders/suggestions — Get AI-suggested reminders */
exports.getSuggestions = async (req, res, next) => {
  try {
    const suggestions = await studyReminderService.generateSuggestions(req.user.id);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) { next(error); }
};

/** GET /api/reminders/:id — Get a single reminder */
exports.getById = async (req, res, next) => {
  try {
    const r = await require('../models/StudyReminder').findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!r) return res.status(404).json({ success: false, error: 'Reminder not found' });
    res.status(200).json({ success: true, data: r });
  } catch (error) { next(error); }
};

/** PUT /api/reminders/:id/toggle — Toggle enabled/disabled */
exports.toggle = async (req, res, next) => {
  try {
    const r = await studyReminderService.toggleReminder(req.user.id, req.params.id);
    if (!r) return res.status(404).json({ success: false, error: 'Reminder not found' });
    res.status(200).json({ success: true, data: r });
  } catch (error) { next(error); }
};

/** DELETE /api/reminders/:id — Delete a reminder */
exports.remove = async (req, res, next) => {
  try {
    const deleted = await studyReminderService.deleteReminder(req.user.id, req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Reminder not found' });
    res.status(200).json({ success: true, message: 'Reminder deleted' });
  } catch (error) { next(error); }
};

/** PUT /api/reminders/:id/snooze — Snooze a reminder for N minutes */
exports.snooze = async (req, res, next) => {
  try {
    const r = await require('../models/StudyReminder').findOne({ where: { id: req.params.id, user: req.user.id } });
    if (!r) return res.status(404).json({ success: false, error: 'Reminder not found' });
    const mins = Math.min(1440, Math.max(5, parseInt(req.body.minutes, 10) || 30));
    r.nextTriggerAt = new Date(Date.now() + mins * 60000);
    await r.save();
    res.status(200).json({ success: true, data: r });
  } catch (error) { next(error); }
};
