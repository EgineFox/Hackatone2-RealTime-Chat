const express = require('express');
const router = express.Router();
const db = require('../models/db');

const { getAllUsers, getCurrentUser } = require('../controllers/userController');

// Получить всех пользователей
router.get('/', getAllUsers);

// Получить одного пользователя по username
router.get('/:username', getCurrentUser);

module.exports = router;
