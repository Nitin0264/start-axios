import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // ◄ Added built-in Node File System to handle disk cleanup

const app = express();
const Port = 8000;

// ==========================================
// 1. STANDARD MIDDLEWARE SETUP
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. NATIVE CLOUDINARY CONFIGURATION
// ==========================================
cloudinary.config({
  cloud_name: "dtxglqboa",   
  api_key: "377841397232461",         
  api_secret: "4f-pwn_emiB6n3Mmgfb_XoOue38"    
});

// 🌟 FIXED: Swapped out the buggy wrapper for standard Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Keeps file temporarily in your local uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
mongoose.connect("mongodb://127.0.0.1:27017/auth_craft_db")
  .then(() => {
    console.log("connected to the mongodb ");
  })
  .catch((err) => {
    console.error("database connection error", err);
  });

// ==========================================
// 4. MONGOOSE DATA SCHEMAS
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true } 
}, { timestamps: true });

const Blog = mongoose.model("Blog", blogSchema);

// ==========================================
// CUSTOM HANDSHAKE ROUTE GUARD (MIDDLEWARE)
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token) {
    return res.status(401).json({ message: "Access Denied. You must be logged in to do this." });
  }

  try {
    const verifiedData = jwt.verify(token, "SUPER_SECRET_KEY_123");
    req.user = verifiedData; 
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired authorization token." });
  }
};

// ==========================================
// 5. RESTFUL API ENDPOINTS
// ==========================================

// [CREATE BLOG] - Uploads via local temp file to Cloudinary and wipes disk
app.post("/api/blogs", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "An image file upload is required." });
    }

    if (!title || !description) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "All text fields are required" });
    }

    // 1. Send the file from your local uploads folder to Cloudinary manually
    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "auth_craft_blogs",
    });

    // 2. Delete the temporary file from your local hard drive
    fs.unlinkSync(req.file.path);

    // 3. CRITICAL: Save the secure cloud URL string to your variable
    const imageUrl = cloudResult.secure_url; // ◄ Make sure this matches!

    const newBlog = new Blog({
      title,
      description,
      imageUrl 
    });

    const savedBlog = await newBlog.save();
    res.status(201).json({
      message: "Blog created successfully and hosted on Cloudinary!",
      blog: savedBlog
    });
  } catch (error) { 
    console.error("error creating the blog", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error. Could not build post." });
  }
});

// [READ ALL BLOGS]
app.get("/api/blogs", async (req, res) => {
  try {
    const allBlogs = await Blog.find();
    res.status(200).json(allBlogs);
  } catch (error) {
    console.error("error fetching the blogs", error);
    res.status(500).json({ message: "server error " });
  }
});

// [READ SINGLE BLOG]
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const structuralId = req.params.id;
    const singleBlog = await Blog.findById(structuralId);
    
    if (!singleBlog) {
      return res.status(404).json({ message: "blog does not exist." });
    }
    res.status(200).json(singleBlog);
  } catch (error) {
    console.error("parameter lookup error", error);
    res.status(500).json({ message: "server error. invalid id format." });
  }
});

// [UPDATE BLOG] - Edit a post with an optional native cloud image rewrite
app.put("/api/blogs/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const targetId = req.params.id;
    const { title, description } = req.body;

    if (!title || !description) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Title and description are required fields." });
    }

    let updateData = { title, description };

    // 🌟 FIXED: If a fresh file is chosen during edit, route it up natively and wipe local storage
    if (req.file) {
      const cloudResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "auth_craft_blogs",
      });
      fs.unlinkSync(req.file.path); // Delete local temp file
      
      updateData.imageUrl = cloudResult.secure_url;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      targetId,
      updateData,
      { new: true } 
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    res.status(200).json({ message: "Blog updated successfully with cloud assets!", blog: updatedBlog });
  } catch (error) {
    console.error("Update API error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error. Could not update the blog." });
  }
});

// [DELETE BLOG]
app.delete("/api/blogs/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const deletedDocument = await Blog.findByIdAndDelete(targetId);

    if (!deletedDocument) {
      return res.status(404).json({ message: "This blog could not be found. It might already be deleted." });
    }

    res.status(200).json({ message: "Blog post deleted successfully from storage!" });
  } catch (error) {
    console.error("Deletion API error:", error);
    res.status(500).json({ message: "Server error. Could not delete the post." });
  }
});

// [USER REGISTRATION]
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already registered" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      username,
      password: hashedPassword
    });
    
    await newUser.save();
    res.status(201).json({ message: "user registered successfully" });
  } catch (error) {
    console.error("registration error:", error);
    res.status(500).json({ message: "server error during registration" });
  }
});

// [USER LOGIN]
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid username or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      "SUPER_SECRET_KEY_123", 
      { expiresIn: "1h" }     
    );

    res.status(200).json({
      message: "Login successful!",
      token: token,
      user: { username: user.username, role: user.role }
    });

  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ==========================================
// 6. INITIALIZE SERVER EXECUTION
// ==========================================
app.listen(Port, () => {
  console.log(`server is running on the port ${Port}`);
});