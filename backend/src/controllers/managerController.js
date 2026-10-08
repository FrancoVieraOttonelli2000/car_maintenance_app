const User = require('../models/User');

const promoteToManager = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const user = await User.findByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.updateRole(user.id, 'manager');

    const { password, ...safeUser } = user;
    res.json({ ...safeUser, role: 'manager' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error promoting user' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
};

module.exports = { promoteToManager, listUsers };
