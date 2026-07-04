const bcrypt = require('bcryptjs');
const db = require('../db');

// ==========================================
// USER MANAGEMENT - FULL CRUD
// ==========================================

exports.getUsers = (req, res) => {
  try {
    // Strip password hashes before sending
    const safeUsers = db.users.map(({ passwordHash, ...user }) => user);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, department, tenantId, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check for duplicate email
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'Technician',
      department: department || 'Heating',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=150`,
      tenantId: tenantId || 'all'
    };

    db.users.push(newUser);

    const io = req.app.get('io');
    if (io) {
      io.emit('USER_CREATED', { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
    }

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user: ' + err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = { ...req.body };
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    delete updateData.passwordHash; // don't allow direct hash override

    db.users[idx] = { ...db.users[idx], ...updateData };
    const updated = db.users[idx];

    const io = req.app.get('io');
    if (io) {
      io.emit('USER_UPDATED', { id: updated.id, name: updated.name, email: updated.email, role: updated.role });
    }

    const { passwordHash, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user: ' + err.message });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    const deletedUser = db.users[idx];
    db.users = db.users.filter(u => u.id !== id);

    const io = req.app.get('io');
    if (io) {
      io.emit('USER_DELETED', { id });
    }

    res.json({ success: true, id, name: deletedUser.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
};