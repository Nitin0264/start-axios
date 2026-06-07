import React from 'react'
import { useState } from 'react'
import axios from 'axios'

function CreateBlog({ onBlogCreated }) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("http://localhost:8000/api/blogs", {
        title,
        description,  
        imageUrl
      });

      setMessage(response.data.message);
      
      if (onBlogCreated) {
        onBlogCreated();
      }

      setTitle("");
      setImageUrl("");
      setDescription("");

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Cannot connect to server. Is your backend running?");
      }
    }
  };

  return (
    <div>
      <h2>Creating a New Blog Post</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
        
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input type="text" placeholder='Enter the Title' value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label>Image URL :</label>
          <input type="text" placeholder='enter image link' value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>

        <div>
          <label>Description</label>
          <input type="text" placeholder='Enter the Description' value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <button type="submit">Post Blog</button>
      </form>
    </div>
  )
}

export default CreateBlog;