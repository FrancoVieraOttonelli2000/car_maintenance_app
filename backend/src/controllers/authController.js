const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isNonEmptyString, isValidEmail } = require('../utils/validation');

const passwordRules = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : req.body.email;

    if (!isNonEmptyString(name, 100)) {
      return res.status(400).json({ error: 'El nombre es obligatorio (máximo 100 caracteres)' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'El email no es válido' });
    }

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
    const userId = await User.create({ name: name.trim(), email, password: hashedPassword });
    const role = 'client';

    const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      id: userId,
      name: name.trim(),
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
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findByEmail(email.trim());
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

// Datos actuales del usuario autenticado (los carga `protect` desde la BD).
// La app lo usa al arrancar para recuperar la sesión y para refrescar el
// nombre/email guardados en el móvil después de que un gestor apruebe un cambio.
const me = async (req, res) => {
  const { id, name, email, role } = req.user;
  res.json({ id, name, email, role });
};

module.exports = { register, login, me };
