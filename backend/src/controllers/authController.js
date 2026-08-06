const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const passwordRules = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!password || !passwordRules.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character',
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Public registration always creates 'client' accounts; any `role` sent
    // in the body is ignored on purpose so nobody can self-register as manager.
    const userId = await User.create({ name, email, password: hashedPassword });
    const role = 'client';

    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      id: userId,
      name,
      email,
      role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { register, login };
