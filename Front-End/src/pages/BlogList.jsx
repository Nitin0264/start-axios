import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function BlogList({ blogs, onBlogDeleted, onBlogUpdated }) {
  // 1. Tracking state: holds the _id of the blog currently being edited (null if none)
  const [editingId, setEditingId] = useState(null);

  // Temporary state holders for the text being edited
  const [editTitle, setEditTitle] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Function to turn on the inline form mode and fill it with current data
  const startEditing = (blog) => {
    setEditingId(blog._id);
    setEditTitle(blog.title);
    setEditImageUrl(blog.imageUrl);
    setEditDescription(blog.description);
  };

  // Function to cancel editing mode
  const cancelEditing = () => {
    setEditingId(null);
  };

  // 2. Handle saving the edited changes (The PUT request)
  const handleUpdate = async (id) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/blogs/${id}`, {
        title: editTitle,
        description: editDescription,
        imageUrl: editImageUrl
      });

      alert(response.data.message);
      setEditingId(null); // Close the edit form mode

      if (onBlogUpdated) {
        onBlogUpdated(); // Refresh parent application list state
      }
    } catch (err) {
      alert("Failed to update the blog post.");
    }
  };

  // Existing delete function
  const triggerDelete = async (idOfBlog) => {
    const confirmChoice = window.confirm("Are you absolutely sure you want to delete this post?");
    if (confirmChoice) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/blogs/${idOfBlog}`);
        alert(response.data.message);
        if (onBlogDeleted) {
          onBlogDeleted();
        }
      } catch (err) {
        alert("Failed to delete the blog post.");
      }
    }
  };

  return (
    <div>
      <h2>All Blog Posts</h2>
      {blogs.length === 0 && <p>No blogs published yet!</p>}

      {blogs.map((blog) => {
        // 3. Conditional Rendering Check
        const isCurrentlyEditing = editingId === blog._id;

        return (
          <div key={blog._id} style={{ borderBottom: "1px solid #ccc", paddingBottom: "15px", marginBottom: "15px" }}>
            
            {isCurrentlyEditing ? (
              /* --- VIEW A: THE EDITING FORM VIEW --- */
              <div>
                <div>
                  <label>Edit Title: </label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div>
                  <label>Edit Image URL: </label>
                  <input type="text" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} />
                </div>
                <div>
                  <label>Edit Description: </label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                </div>
                
                <button type="button" onClick={() => handleUpdate(blog._id)}>Save Changes</button>
                <button type="button" onClick={cancelEditing}>Cancel</button>
              </div>
            ) : (
              /* --- VIEW B: THE REGULAR VIEW --- */
              <div>
                <h3>
                  <Link to={`/blog/${blog._id}`}>{blog.title}</Link>
                </h3>
                <img src={blog.imageUrl} alt={blog.title} style={{ maxWidth: "150px" }} />
                <p>{blog.description}</p>
                
                {/* Edit button placed side-by-side right in front of the Delete button */}
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