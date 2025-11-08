const bcrypt = require('bcrypt');
const db = require('../models/db');

// Register a new user
exports.register = async (req, res) => {
  let { username, email, password, avatar_url } = req.body;
  avatar_url = avatar_url || '/avatars/default.jpg';

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();

    const existingUser = await db('users')
      .where('username', username)
      .orWhere('email', email)
      .first();

    if (existingUser) {
      if (existingUser.username === username && existingUser.email === email) {
        return res.status(409).json({ message: 'Username and email are already taken' });
      } else if (existingUser.username === username) {
        return res.status(409).json({ message: 'Username is already taken' });
      } else {
        return res.status(409).json({ message: 'Email is already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const inserted = await db('users')
      .insert({ username, email, password: hashedPassword, avatar_url })
      .returning(['id', 'username', 'email', 'avatar_url']);

    const newUser = inserted?.[0];
    console.log('User created:', newUser);
    console.log('Inserted user:', inserted);

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Login an existing user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Successful login
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};
