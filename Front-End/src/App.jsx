import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import CreateBlog from "./pages/CreateBlog";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";

function App() {
  const [blogs, setBlogs] = useState([]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/blogs");
      setBlogs(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <BrowserRouter>
      <div style={{ padding: "20px" }}>
        <Routes>
          {/* Base Root Layout Route */}
          <Route
            path="/"
            element={
              <>
                <CreateBlog onBlogCreated={fetchBlogs} />
                <hr />
                <BlogList
                  blogs={blogs}
                  onBlogDeleted={fetchBlogs}
                  onBlogUpdated={fetchBlogs}         />
              </>
            }
          />


          <Route path="/blog/:id" element={<BlogDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;