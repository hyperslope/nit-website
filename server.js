const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-chemistry-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============ MODELS ============

// Admin User Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

// Publication Schema
const publicationSchema = new mongoose.Schema({
  authors: { type: String, required: true },
  title: { type: String, required: true },
  journal: { type: String, required: true },
  year: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Publication = mongoose.model('Publication', publicationSchema);

// Person Schema
const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['pi', 'postdoc', 'phd', 'technician']
  },
  photo: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Person = mongoose.model('Person', personSchema);

// News Schema
const newsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  headline: { type: String, required: true },
  content: { type: String, required: true },
  tag: { 
    type: String, 
    required: true,
    enum: ['Funding', 'Award', 'Publication', 'Conference', 'Outreach', 'Team']
  },
  createdAt: { type: Date, default: Date.now }
});

const News = mongoose.model('News', newsSchema);

// Research Area Schema
const researchAreaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  photo: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ResearchArea = mongoose.model('ResearchArea', researchAreaSchema);

// Home Page Schema with Logo Support
const homePageSchema = new mongoose.Schema({
  siteTitle: { type: String, default: 'Green Chemistry Research Group' },
  useLogo: { type: Boolean, default: false },
  logoImage: { type: String },
  heroTitle: { type: String, required: true },
  heroDescription: { type: String, required: true },
  aboutParagraph1: { type: String, required: true },
  aboutParagraph2: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const HomePage = mongoose.model('HomePage', homePageSchema);

// ============ MIDDLEWARE ============

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ ROUTES ============

// === AUTH ROUTES ===

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email });
    
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/verify', authenticate, (req, res) => {
  res.json({ 
    success: true, 
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      name: req.admin.name
    }
  });
});

// === HOME PAGE ROUTES ===

app.get('/api/homepage', async (req, res) => {
  try {
    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      homePage = new HomePage({
        siteTitle: 'Green Chemistry Research Group',
        useLogo: false,
        logoImage: null,
        heroTitle: 'Advancing Sustainable Chemistry',
        heroDescription: 'Pioneering research in green chemistry, organocatalysis, and physical organic chemistry to develop environmentally benign chemical processes for a sustainable future.',
        aboutParagraph1: 'The Green Chemistry Research Group is dedicated to developing innovative chemical methodologies that minimize environmental impact while maximizing efficiency and selectivity.',
        aboutParagraph2: 'We focus on designing sustainable synthetic routes, understanding reaction mechanisms at a molecular level, and developing novel catalytic systems.'
      });
      await homePage.save();
    }
    
    res.json({ success: true, data: homePage });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching home page data' });
  }
});

app.put('/api/homepage', authenticate, async (req, res) => {
  try {
    const { siteTitle, useLogo, logoImage, heroTitle, heroDescription, aboutParagraph1, aboutParagraph2 } = req.body;

    if (!heroTitle || !heroDescription || !aboutParagraph1 || !aboutParagraph2) {
      return res.status(400).json({ error: 'All fields required' });
    }

    let homePage = await HomePage.findOne();
    
    if (!homePage) {
      homePage = new HomePage({
        siteTitle: siteTitle || 'Green Chemistry Research Group',
        useLogo: useLogo || false,
        logoImage: logoImage || null,
        heroTitle,
        heroDescription,
        aboutParagraph1,
        aboutParagraph2
      });
    } else {
      homePage.siteTitle = siteTitle || homePage.siteTitle;
      homePage.useLogo = useLogo !== undefined ? useLogo : homePage.useLogo;
      homePage.logoImage = logoImage !== undefined ? logoImage : homePage.logoImage;
      homePage.heroTitle = heroTitle;
      homePage.heroDescription = heroDescription;
      homePage.aboutParagraph1 = aboutParagraph1;
      homePage.aboutParagraph2 = aboutParagraph2;
      homePage.updatedAt = Date.now();
    }
    
    await homePage.save();
    res.json({ success: true, data: homePage });
  } catch (error) {
    console.error('Error updating home page:', error);
    res.status(500).json({ error: 'Error updating home page' });
  }
});

// === PUBLICATIONS ROUTES ===

app.get('/api/publications', async (req, res) => {
  try {
    const publications = await Publication.find().sort({ year: -1, timestamp: -1 });
    res.json(publications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching publications' });
  }
});

app.post('/api/publications', authenticate, async (req, res) => {
  try {
    const { authors, title, journal, year } = req.body;

    if (!authors || !title || !journal || !year) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const publication = new Publication({ authors, title, journal, year });
    await publication.save();

    res.status(201).json(publication);
  } catch (error) {
    res.status(500).json({ error: 'Error adding publication' });
  }
});

app.delete('/api/publications/:id', authenticate, async (req, res) => {
  try {
    const publication = await Publication.findByIdAndDelete(req.params.id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Publication not found' });
    }

    res.json({ success: true, message: 'Publication deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting publication' });
  }
});

// === PEOPLE ROUTES ===

app.get('/api/people', async (req, res) => {
  try {
    const people = await Person.find().sort({ createdAt: 1 });
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching people' });
  }
});

app.post('/api/people', authenticate, async (req, res) => {
  try {
    const { name, role, email, category, photo } = req.body;

    if (!name || !role || !email || !category) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const person = new Person({ name, role, email, category, photo });
    await person.save();

    res.status(201).json(person);
  } catch (error) {
    console.error('Error adding person:', error);
    res.status(500).json({ error: 'Error adding person' });
  }
});

app.delete('/api/people/:id', authenticate, async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json({ success: true, message: 'Person deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting person' });
  }
});

// === NEWS ROUTES ===

app.get('/api/news', async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching news' });
  }
});

app.get('/api/news/latest', async (req, res) => {
  try {
    const news = await News.find().sort({ date: -1 }).limit(5);
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching news' });
  }
});

app.post('/api/news', authenticate, async (req, res) => {
  try {
    const { date, headline, content, tag } = req.body;

    if (!date || !headline || !content || !tag) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const news = new News({ date, headline, content, tag });
    await news.save();

    res.status(201).json(news);
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(500).json({ error: 'Error adding news' });
  }
});

app.delete('/api/news/:id', authenticate, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ success: true, message: 'News deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting news' });
  }
});

// === RESEARCH AREAS ROUTES ===

app.get('/api/research-areas', async (req, res) => {
  try {
    const areas = await ResearchArea.find().sort({ createdAt: 1 });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching research areas' });
  }
});

app.post('/api/research-areas', authenticate, async (req, res) => {
  try {
    const { title, description, photo } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const area = new ResearchArea({ title, description, photo });
    await area.save();

    res.status(201).json(area);
  } catch (error) {
    console.error('Error adding research area:', error);
    res.status(500).json({ error: 'Error adding research area' });
  }
});

app.delete('/api/research-areas/:id', authenticate, async (req, res) => {
  try {
    const area = await ResearchArea.findByIdAndDelete(req.params.id);
    
    if (!area) {
      return res.status(404).json({ error: 'Research area not found' });
    }

    res.json({ success: true, message: 'Research area deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting research area' });
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});