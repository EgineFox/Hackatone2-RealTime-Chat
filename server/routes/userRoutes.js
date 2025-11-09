const express = require('express');
const router = express.Router();
const db = require('../models/db');

const { getAllUsers, getCurrentUser } = require('../controllers/userController');

// 
router.get('/', getAllUsers);

// 
router.get('/:username', getCurrentUser);

module.exports = router;
