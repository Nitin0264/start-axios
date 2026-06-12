import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const app = express();
const Port = 8000;

// ==========================================
// 1. MIDDLEWARE SETUP
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. DATABASE CONNECTION
// ==========================================
mongoose.connect("mongodb://127.0.0.1:27017/auth_craft_db")
  .then(() => {
    console.log("connected to the mongodb ");
  })
  .catch((err) => {
    console.error("database connection error", err);
  });

// ==========================================
// 3. MONGOOSE MODELS & SCHEMAS
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
// CUSTOM SECURITY MIDDLEWARE (Moved Above Routes)
// ==========================================
const verifyToken = (req, res, next) => {
  // 1. Grab the Authorization header from the request
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  // 2. If no token is provided, block access instantly
  if (!token) {
    return res.status(401).json({ message: "Access Denied. You must be logged in to do this." });
  }

  try {
    // 3. Verify the token using your exact secret key
    const verifiedData = jwt.verify(token, "SUPER_SECRET_KEY_123");
    
    // 4. Attach the verified user details (id, role) directly onto the 'req' object
    req.user = verifiedData; 
    
    // 5. CRITICAL: Pass control over to the actual route handler
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired authorization token." });
  }
};

// ==========================================
// 4. API ROUTES
// ==========================================

// [CREATE BLOG] - Post a brand new blog (Protected)
app.post("/api/blogs", verifyToken, async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const newBlog = new Blog({
      title,
      description,
      imageUrl
    });

    const savedBlog = await newBlog.save();
    res.status(201).json({
      message: "blog created successfully",
      blog: savedBlog
    });
  } catch (error) { 
    console.error("error creating the blog", error);
    res.status(500).json({ message: "server error. Could not create the blog " });
  }
});

// [READ ALL BLOGS] - Fetch every single blog inside MongoDB (Public)
app.get("/api/blogs", async (req, res) => {
  try {
    const allBlogs = await Blog.find();
    res.status(200).json(allBlogs);
  } catch (error) {
    console.error("error fetching the blogs", error);
    res.status(500).json({ message: "server error " });
  }
});

// [READ SINGLE BLOG] - Fetch one specific blog by its URL ID parameter (Public)
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

// [UPDATE BLOG] - Edit an existing blog using body data packets and ID parameters (Protected)
app.put("/api/blogs/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { title, description, imageUrl } = req.body;

    if (!title || !description || !imageUrl) {
      return res.status(400).json({ message: "All fields are required to update the blog." });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      targetId,
      { title, description, imageUrl },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    res.status(200).json({ message: "Blog updated successfully!", blog: updatedBlog });
  } catch (error) {
    console.error("Update API error:", error);
    res.status(500).json({ message: "Server error. Could not update the blog." });
  }
});

// [DELETE BLOG] - Erase a blog document permanently from the cluster (Protected)
app.delete("/api/blogs/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const deletedDocument = await Blog.findByIdAndDelete(targetId);

    if (!deletedDocument) {
      return res.status(404).json({ message: "This blog could not be found. It might already be deleted." });
    }

    res.status(200).json({ message: "Blog post deleted successfully!" });
  } catch (error) {
    console.error("Deletion API error:", error);
    res.status(500).json({ message: "Server error. Could not delete the post." });
  }
});

// [USER REGISTRATION] - Secure registration with bcrypt hashing (Public)
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

// [USER LOGIN] - Verify credentials and issue a secure JWT ticket (Public)
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
// 5. SERVER STARTUP
// ==========================================
app.listen(Port, () => {
  console.log(`server is running on the port ${Port}`);
});