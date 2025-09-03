import React, { useEffect, useState, useContext } from 'react';
import './Forums.css';
import mockApi from '../../api/mockApi';
import AuthContext from '../../context/AuthContext';

const Forums = () => {
  const { currentUser } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');

  useEffect(() => {
    mockApi.initMockData().then(async () => {
      const cats = await mockApi.getForumCategories();
      setCategories(cats);
    });
  }, []);

  const loadThreads = async (cat) => {
    setSelectedCategory(cat);
    setActiveThread(null);
    setThreadPosts([]);
    const t = await mockApi.getThreadsByCategory(cat.id);
    setThreads(t);
  };

  const openThread = async (thread) => {
    const data = await mockApi.getThreadById(thread.id);
    setActiveThread(data.thread);
    setThreadPosts(data.posts);
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to create a thread.'); return; }
    if (!selectedCategory || !newThreadTitle.trim()) return;
    const newThread = await mockApi.createThread({ categoryId: selectedCategory.id, title: newThreadTitle.trim(), author: currentUser.username || currentUser.name || 'user' });
    setNewThreadTitle('');
    const t = await mockApi.getThreadsByCategory(selectedCategory.id);
    setThreads(t);
    openThread(newThread);
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to reply.'); return; }
    if (!activeThread || !newPostBody.trim()) return;
    await mockApi.addPostToThread({ threadId: activeThread.id, author: currentUser.username || currentUser.name || 'user', body: newPostBody.trim() });
    setNewPostBody('');
    const data = await mockApi.getThreadById(activeThread.id);
    setActiveThread(data.thread);
    setThreadPosts(data.posts);
  };

  return (
    <div className="forums-container">
      <aside className="forums-sidebar">
        <h2>Forums</h2>
        <ul>
          {categories.map(cat => (
            <li key={cat.id} className={selectedCategory?.id === cat.id ? 'active' : ''}>
              <button onClick={() => loadThreads(cat)}>{cat.name}</button>
              <p className="cat-desc">{cat.description}</p>
            </li>
          ))}
        </ul>
      </aside>
      <section className="forums-main">
        {!selectedCategory && <p>Select a forum category to view threads.</p>}
        {selectedCategory && !activeThread && (
          <div className="threads-view">
            <div className="threads-header">
              <h3>{selectedCategory.name}</h3>
              {currentUser && (
                <form onSubmit={handleCreateThread} className="new-thread-form">
                  <input type="text" placeholder="Start a new thread..." value={newThreadTitle} onChange={(e)=>setNewThreadTitle(e.target.value)} />
                  <button type="submit">Create</button>
                </form>
              )}
            </div>
            {threads.length === 0 && <p>No threads yet. Be the first to post!</p>}
            <ul className="thread-list">
              {threads.map(th => (
                <li key={th.id} className="thread-item" onClick={()=>openThread(th)}>
                  <div className="title">{th.title}</div>
                  <div className="meta">by {th.author} • {new Date(th.lastPostAt).toLocaleString()} • {th.replies} replies</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedCategory && activeThread && (
          <div className="thread-view">
            <button className="back-link" onClick={()=>{ setActiveThread(null); setThreadPosts([]); }}>← Back to threads</button>
            <h3>{activeThread.title}</h3>
            <ul className="post-list">
              {threadPosts.map(p => (
                <li key={p.id} className="post-item">
                  <div className="post-meta">{p.author} • {new Date(p.createdAt).toLocaleString()}</div>
                  <div className="post-body">{p.body}</div>
                </li>
              ))}
            </ul>
            {currentUser && (
              <form onSubmit={handleAddPost} className="reply-form">
                <textarea placeholder="Write a reply..." value={newPostBody} onChange={(e)=>setNewPostBody(e.target.value)} />
                <button type="submit">Post Reply</button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Forums;

