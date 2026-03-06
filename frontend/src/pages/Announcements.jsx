import { useState, useEffect } from 'react';

export default function Announcements() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Announcements</h1>
      <div className="grid gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-600 mb-4">{post.content}</p>
            <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
