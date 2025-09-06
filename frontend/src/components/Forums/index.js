import React, { useEffect, useState, useContext, useMemo } from 'react';
import './Forums.css';
import mockApi from '../../api/mockApi';
import AuthContext from '../../context/AuthContext';

const Forums = () => {
  const { currentUser, token } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');

  const canModerate = useMemo(() => !!currentUser, [currentUser]);

  useEffect(() => {
    (async () => {
      const cats = await mockApi.getForumCategories();
      setCategories(cats);
    })();
  }, []);

  const loadThreads = async (cat, opts = {}) => {
    setSelectedCategory(cat);
    setActiveThread(null);
    setThreadPosts([]);
    const s = opts.search ?? search;
    const p = opts.page ?? page;
    try {
      const resp = await mockApi.getThreadsByCategory(cat.id, { search: s, page: p, pageSize });
      if (Array.isArray(resp)) {
        setThreads(resp);
        setThreadsTotal(resp.length);
      } else {
        setThreads(resp.items || []);
        setThreadsTotal(resp.total || 0);
      }
      setPage(p);
    } catch (e) {
      setThreads([]);
      setThreadsTotal(0);
    }
  };

  const getThreadId = (t) => t?.id || t?._id || t?.threadId;

  const openThread = async (thread) => {
    const data = await mockApi.getThreadById(getThreadId(thread));
    setActiveThread(data.thread);
    setThreadPosts(data.posts);
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to create a thread.'); return; }
    if (!selectedCategory || !newThreadTitle.trim()) return;
    let newThread;
    try {
      if (!token) { alert('Please log in.'); return; }
      newThread = await mockApi.createThread(token, { categoryId: selectedCategory.id, title: newThreadTitle.trim() });
      setNewThreadTitle('');
      await loadThreads(selectedCategory, { page: 1 });
      openThread(newThread);
    } catch (err) {
      alert(err.message || 'Failed to create thread');
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to reply.'); return; }
    if (!activeThread || !newPostBody.trim()) return;
    try {
      if (!token) { alert('Please log in.'); return; }
      await mockApi.addPostToThread(token, { threadId: getThreadId(activeThread), body: newPostBody.trim() });
      setNewPostBody('');
      const data = await mockApi.getThreadById(getThreadId(activeThread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
    } catch (err) {
      alert(err.message || 'Failed to post');
    }
  };

  const pinToggle = async (thread, pinned) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      await mockApi.pinThread(token, getThreadId(thread), pinned);
      await loadThreads(selectedCategory, { page });
    } catch (e) { alert(e.message || 'Failed to pin'); }
  };

  const lockToggle = async (thread, locked) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      await mockApi.lockThread(token, getThreadId(thread), locked);
      const data = await mockApi.getThreadById(getThreadId(thread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
    } catch (e) { alert(e.message || 'Failed to lock'); }
  };

  const deleteThread = async (thread) => {
    if (!window.confirm('Delete this thread?')) return;
    try {
      if (!token) { alert('Please log in.'); return; }
      await mockApi.deleteThread(token, getThreadId(thread));
      setActiveThread(null);
      await loadThreads(selectedCategory, { page: 1 });
    } catch (e) { alert(e.message || 'Failed to delete'); }
  };

  const reportPost = async (post) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      await mockApi.reportPost(token, post.id, 'inappropriate');
      alert('Reported');
    } catch (e) { alert(e.message || 'Failed to report'); }
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
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="search" placeholder="Search threads" value={search} onChange={e=>setSearch(e.target.value)} />
                <button onClick={()=> loadThreads(selectedCategory, { page: 1, search })}>Search</button>
              </div>
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
                <li key={getThreadId(th)} className="thread-item">
                  <div className="title" onClick={()=>openThread(th)}>
                    {th.pinned ? '📌 ' : ''}{th.title}
                  </div>
                  <div className="meta">by {th.authorUsername || th.author} • {new Date(th.lastPostAt).toLocaleString()} • {th.replies||0} replies</div>
                  {canModerate && (
                    <div style={{display:'flex',gap:8,marginTop:6}}>
                      <button onClick={()=>pinToggle(th, !th.pinned)}>{th.pinned?'Unpin':'Pin'}</button>
                      <button onClick={()=>lockToggle(th, !th.locked)}>{th.locked?'Unlock':'Lock'}</button>
                      <button onClick={()=>deleteThread(th)}>Delete</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
              <button disabled={page<=1} onClick={()=> loadThreads(selectedCategory, { page: page-1 })}>Prev</button>
              <span>Page {page} {threadsTotal? `(~${threadsTotal} total)`:''}</span>
              <button disabled={threads.length < pageSize} onClick={()=> loadThreads(selectedCategory, { page: page+1 })}>Next</button>
            </div>
          </div>
        )}

        {selectedCategory && activeThread && (
          <div className="thread-view">
            <button className="back-link" onClick={()=>{ setActiveThread(null); setThreadPosts([]); }}>← Back to threads</button>
            <h3>{activeThread.title}</h3>
            <ul className="post-list">
              {threadPosts.map(p => (
                <li key={p.id} className="post-item">
                  <div className="post-meta">{p.author || p.authorUsername} • {new Date(p.createdAt).toLocaleString()}</div>
                  <div className="post-body">{p.body}</div>
                  <div style={{marginTop:6}}>
                    <button onClick={()=>reportPost(p)}>Report</button>
                  </div>
                </li>
              ))}
            </ul>
            {currentUser && !activeThread.locked && (
              <form onSubmit={handleAddPost} className="reply-form">
                <textarea placeholder="Write a reply..." value={newPostBody} onChange={(e)=>setNewPostBody(e.target.value)} />
                <button type="submit">Post Reply</button>
              </form>
            )}
            {activeThread.locked && <p>This thread is locked.</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default Forums;
