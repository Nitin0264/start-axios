import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

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
// 4. API ROUTES (Arranged Logically)
// ==========================================

// [CREATE] - Post a brand new blog
app.post("/api/blogs", async (req, res) => {
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

// [READ ALL] - Fetch every single blog inside MongoDB
app.get("/api/blogs", async (req, res) => {
  try {
    const allBlogs = await Blog.find();
    res.status(200).json(allBlogs);
  } catch (error) {
    console.error("error fetching the blogs", error);
    res.status(500).json({ message: "server error " });
  }
});

// [READ SINGLE] - Fetch one specific blog by its URL ID parameter
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const structuralId = req.params.id;
    const singleBlog = await Blog.findById(structuralId);
    
    if (!singleBlog) {
      // FIXED: Added 'res.' context before the status call to prevent engine crashes
      return res.status(404).json({ message: "blog does not exist." });
    }
    res.status(200).json(singleBlog);
  } catch (error) {
    console.error("parameter lookup error", error);
    res.status(500).json({ message: "server error. invalid id format." });
  }
});

// [UPDATE] - Edit an existing blog using body data packets and ID parameters
app.put("/api/blogs/:id", async (req, res) => {
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

    res.status(200).json({ message: "Blog updated success
      fully!", blog: updatedBlog });
  } catch (error) {
    console.error("Update API error:", error);
    res.status(500).json({ message: "Server error. Could not update the blog." });
  }
});

// [DELETE] - Erase a blog document permanently from the cluster 
// index
app.delete("/api/blogs/:id", async (req, res) => {
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

// ==========================================
// 5. SERVER STARTUP
// ==========================================
app.listen(Port, () => {
  console.log(`server is running on the port ${Port}`);
});