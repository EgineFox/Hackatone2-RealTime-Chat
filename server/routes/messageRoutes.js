const express = require('express');
const router = express.Router();
const { getMessagesWithUser } = require('../controllers/messageController');

router.get('/:username', getMessagesWithUser);

module.exports = router;