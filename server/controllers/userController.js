const db = require('../models/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db('users').select('id', 'username', 'avatar_url');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await db('users').where({ username }).first();
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

