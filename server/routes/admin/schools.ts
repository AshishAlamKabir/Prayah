import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/schools';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos, and documents are allowed'));
    }
  }
});

// Create new school
router.post('/schools', upload.array('mediaFiles'), async (req, res) => {
  try {
    const {
      name,
      location,
      description,
      contactInfo,
      establishedYear,
      studentCount,
      teacherCount,
      programs,
      facilities
    } = req.body;

    // Process media files
    const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    // Here you would save to database
    const schoolData = {
      name,
      location,
      description,
      contactInfo: JSON.parse(contactInfo || '{}'),
      establishedYear: parseInt(establishedYear) || new Date().getFullYear(),
      studentCount: parseInt(studentCount) || 0,
      teacherCount: parseInt(teacherCount) || 0,
      programs: JSON.parse(programs || '[]'),
      facilities: JSON.parse(facilities || '[]'),
      mediaFiles
    };

    res.json({ 
      success: true, 
      message: 'School created successfully',
      data: schoolData
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create school' 
    });
  }
});

// Create school notification
router.post('/school-notifications', upload.array('mediaFiles'), async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      schoolId,
      priority,
      publishDate
    } = req.body;

    // Process media files
    const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    const notificationData = {
      title,
      content,
      type,
      schoolId: schoolId ? parseInt(schoolId) : null,
      priority,
      publishDate,
      mediaFiles,
      createdAt: new Date().toISOString()
    };

    res.json({ 
      success: true, 
      message: 'Notification published successfully',
      data: notificationData
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to publish notification' 
    });
  }
});

// Get school notifications
router.get('/school-notifications', async (req, res) => {
  try {
    // Here you would fetch from database
    const notifications = []; // Placeholder

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
});

export default router;