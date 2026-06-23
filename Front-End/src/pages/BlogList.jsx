import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function BlogList({ blogs, onBlogDeleted, onBlogUpdated }) {
  // 1. Tracking state: holds the _id of the blog currently being edited (null if none)
  const [editingId, setEditingId] = useState(null);

  // Temporary state holders for the text being edited
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);


  const startEditing = (blog) => {
    setEditingId(blog._id);
    setEditTitle(blog.title);
    setEditDescription(blog.description);
    setEditImageFile(null); // Reset file input state for a clean start
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditImageFile(null);
  };

  const handleUpdate = async (id) => {
    const token = localStorage.getItem("blogToken");
    if (!token) {
      alert("You must be logged in to update a post.");
      return;
    }

    try {
      // 1. Initialize FormData shipping container
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("description", editDescription);
      

      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const response = await axios.put(
        `http://localhost:8000/api/blogs/${id}`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        }
      );

      alert(response.data.message);
      setEditingId(null); 
      setEditImageFile(null);

      if (onBlogUpdated) {
        onBlogUpdated(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update the blog post.");
    }
  };

  const triggerDelete = async (idOfBlog) => {
    const confirmChoice = window.confirm("Are you absolutely sure you want to delete this post?");
    if (confirmChoice) {
      const token = localStorage.getItem("blogToken");
      if (!token) {
        alert("You must be logged in to delete a post.");
        return;
      }

      try {
        const response = await axios.delete(
          `http://localhost:8000/api/blogs/${idOfBlog}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        alert(response.data.message);
        if (onBlogDeleted) {
          onBlogDeleted();
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete the blog post.");
      }
    }
  };

  return (
    <div>
      <h2>All Blog Posts</h2>
      {blogs.length === 0 && <p>No blogs published yet!</p>}

      {blogs.map((blog) => {
        const isCurrentlyEditing = editingId === blog._id;

        return (
          <div key={blog._id} style={{ borderBottom: "1px solid #ccc", paddingBottom: "15px", marginBottom: "15px" }}>
            
            {isCurrentlyEditing ? (
              <div>
                <div>
                  <label>Edit Title: </label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label>Upload New Cover Image (Optional): </label>
                  <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files[0])} />
                </div>
                <div>
                  <label>Edit Description: </label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                
                <button type="button" onClick={() => handleUpdate(blog._id)}>Save Changes</button>
                <button type="button" onClick={cancelEditing}>Cancel</button>
              </div>
            ) : (
              <div>
                <h3>
                  <Link to={`/blog/${blog._id}`}>{blog.title}</Link>
                </h3>
                
            

<img 
  src={blog.imageUrl.startsWith("http") ? blog.imageUrl : `http://localhost:8000${blog.imageUrl}`} 
  alt={blog.title} 
  style={{ maxWidth: "250px", height: "auto", objectFit: "cover", display: "block", marginBottom: "10px" }} 
  onError={(e) => {
    console.log("Image failed to load:", blog.imageUrl);
  }}
/>
                
                <p>{blog.description}</p>
                
                <button type="button" onClick={() => startEditing(blog)}>Edit Blog</button>
                <button type="button" onClick={() => triggerDelete(blog._id)}>Delete Blog</button>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}

export default BlogList;