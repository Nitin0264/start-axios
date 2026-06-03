import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import useParams to scan the URL
import axios from 'axios';

function BlogDetail() {
 
  const { id } = useParams(); 

  const [blog, setBlog] = useState(null);
  const [error, setError] = useState("");

  
  useEffect(() => {
    const getSinglePost = async () => {
      try {
       
        const response = await axios.get(`http://localhost:8000/api/blogs/${id}`);
        setBlog(response.data);
      } catch (err) {
        setError("Could not retrieve this post.");
      }
    };

    getSinglePost();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!blog) return <p>Loading individual post details...</p>;

  return (
    <div>
      <Link to="/">← Back to Dashboard List</Link>
      
      <h1>{blog.title}</h1>
      <img src={blog.imageUrl} alt={blog.title} style={{ maxWidth: "400px" }} />
      <p>{blog.description}</p>
    </div>
  );
}

export default BlogDetail;