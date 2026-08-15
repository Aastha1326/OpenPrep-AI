const { Folder, Note, Flashcard, Quiz } = require('../models');

// Recursive function to build folder tree
const buildTree = (folders, parentId = null) => {
  return folders
    .filter(folder => folder.parentId === parentId)
    .map(folder => ({
      ...folder.toJSON(),
      children: buildTree(folders, folder.id)
    }));
};

exports.getTree = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all folders for user
    const folders = await Folder.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });
    
    const tree = buildTree(folders, null);
    
    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('[folderController.getTree] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, color, icon, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Folder name is required' });
    }
    
    if (parentId) {
      const parent = await Folder.findOne({ where: { id: parentId, userId } });
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent folder not found' });
      }
    }
    
    const folder = await Folder.create({
      name,
      color,
      icon,
      parentId: parentId || null,
      userId
    });
    
    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    console.error('[folderController.createFolder] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.moveFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { parentId, type = 'folder' } = req.body;
    
    // Check new parent folder
    if (parentId) {
      const parent = await Folder.findOne({ where: { id: parentId, userId } });
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Target parent folder not found' });
      }
    }
    
    if (type === 'folder') {
      const folder = await Folder.findOne({ where: { id, userId } });
      if (!folder) {
        return res.status(404).json({ success: false, message: 'Folder not found' });
      }
      
      // Prevent cyclical moves (e.g. moving a folder into its own child)
      let current = parentId;
      while (current) {
        if (current === id) {
          return res.status(400).json({ success: false, message: 'Cannot move a folder into itself or its children' });
        }
        const checkParent = await Folder.findByPk(current);
        current = checkParent ? checkParent.parentId : null;
      }
      
      folder.parentId = parentId || null;
      await folder.save();
      
      return res.status(200).json({ success: true, data: folder });
    } 
    else if (type === 'note') {
      const note = await Note.findOne({ where: { id, user: userId } });
      if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
      note.folderId = parentId || null;
      await note.save();
      return res.status(200).json({ success: true, data: note });
    }
    else if (type === 'flashcard') {
      const flashcard = await Flashcard.findOne({ where: { id, user: userId } });
      if (!flashcard) return res.status(404).json({ success: false, message: 'Flashcard not found' });
      flashcard.folderId = parentId || null;
      await flashcard.save();
      return res.status(200).json({ success: true, data: flashcard });
    }
    else if (type === 'quiz') {
      const quiz = await Quiz.findOne({ where: { id, createdBy: userId } });
      if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
      quiz.folderId = parentId || null;
      await quiz.save();
      return res.status(200).json({ success: true, data: quiz });
    }
    else {
      return res.status(400).json({ success: false, message: 'Invalid item type' });
    }
  } catch (error) {
    console.error('[folderController.moveFolder] Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.buildTree = buildTree; // Exported for unit tests
