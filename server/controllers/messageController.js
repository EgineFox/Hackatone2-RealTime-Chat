const db = require('../models/db')
exports.getMessagesWithUser = async (req, res) => {
  const currentUser = req.query.me;
  const targetUser = req.params.username;

  try {
    const messages = await db('messages')
      .where(function () {
        this.where({ from: currentUser, to: targetUser })
            .orWhere({ from: targetUser, to: currentUser });
      })
      .orderBy('created_at', 'asc');

    res.json([...messages]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка загрузки сообщений', error: err.message });
  }
};
