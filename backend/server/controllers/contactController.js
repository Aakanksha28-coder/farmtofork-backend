const ContactMessage = require('../models/ContactMessage');
const jwt = require('jsonwebtoken');

// Try to decode token if provided to attach user and role
const tryDecodeUser = (req) => {
  try {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      return { id: decoded.id };
    }
  } catch (e) {
    // ignore
  }
  return null;
};

exports.createMessage = async (req, res) => {
  try {
    // Ensure database connection
    const mongoose = require('mongoose');
    const connectDB = require('../config/db');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const { name, email, phone, subject, message, role } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let userInfo = tryDecodeUser(req);

    const doc = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      role: (req.user?.role) || role || 'guest',
      user: (req.user?._id) || userInfo?.id || undefined
    });

    res.status(201).json({ message: 'Message received', id: doc._id });
  } catch (error) {
    console.error('Create contact message error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.listMessages = async (req, res) => {
  try {
    // Ensure database connection
    const mongoose = require('mongoose');
    const connectDB = require('../config/db');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const { role, status, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } }
      ];
    }

    const items = await ContactMessage.find(filter).sort({ createdAt: -1 });
    res.json(items || []);
  } catch (error) {
    console.error('List contact messages error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json(msg);
  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    msg.status = status;
    await msg.save();
    res.json(msg);
  } catch (error) {
    console.error('Update contact message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};