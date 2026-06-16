import React, { useState } from "react";
import axios from "axios";

function CreateBlog({ onBlogCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null); // Track the actual binary file object
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const token = localStorage.getItem("blogToken");
    if (!token) {
      setError("You must be logged in to create a blog post.");
      return;
    }

    if (!imageFile) {
      setError("Please select an image file to upload.");
      return;
    }

    try {
      // 1. CRITICAL: Instantiate a fresh browser FormData container
      const formData = new FormData();
      
      // 2. Pack text data and the image file into the container
      // Note: The key "image" must match upload.single("image") exactly on the backend!
      formData.append("title", title);
      formData.append("description", description);
      formData.append("image", imageFile);

      // 3. Post the formData container to your backend API
      const response = await axios.post(
        "http://localhost:8000/api/blogs", 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Inform Axios to set the correct multipart formatting header automatically
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMessage(response.data.message);
      
      // Clear out form fields
      setTitle("");
      setDescription("");
      setImageFile(null);
      
      // Reset the file input element on the page layout view
      document.getElementById("fileInput").value = "";

      if (onBlogCreated) {
        onBlogCreated();
      }

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Cannot connect to server. Check your backend status.");
      }
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h2>Create a New Blog Post</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Blog Title:</label>
          <input 
            type="text" 
            placeholder="Enter title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea 
            placeholder="Write your blog description..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label>Select Cover Image:</label>
          {/* Changed input type from "text" to "file" */}
          <input 
            id="fileInput"
            type="file" 
            accept="image/*" // Restrict input selection to image types only
            onChange={(e) => setImageFile(e.target.files[0])} // Grab the single chosen file
            required 
          />
        </div>

        <button type="submit" style={{ marginTop: "10px" }}>Publish Post</button>
      </form>
    </div>
  );
}

export default CreateBlog;