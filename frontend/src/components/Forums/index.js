import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const location = useLocation();

  const canModerate = useMemo(() => !!currentUser, [currentUser]);

  useEffect(() => {
    (async () => {
      const cats = await mockApi.getForumCategories();
      setCategories(cats);
      const params = new URLSearchParams(location.search);
      const open = params.get('open');
      if (open) {
        try {
          const data = await mockApi.getThreadById(open);
          if (data?.thread) {
            const cat = cats.find(c => c.id === data.thread.categoryId);
            if (cat) setSelectedCategory(cat);
            setActiveThread(data.thread);
            setThreadPosts(data.posts);
          }
        } catch {}
      }
    })();
  }, [location.search]);

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
      // Optionally create first post body if provided
      if (newThreadBody.trim()) {
        await mockApi.addPostToThread(token, { threadId: getThreadId(newThread), body: newThreadBody.trim() });
      }
      setNewThreadTitle('');
      setNewThreadBody('');
      setShowThreadModal(false);
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

  // --- Helpers for forum-like presentation ---
  const ordinal = (i) => `#${i+1}`;
  const extractAttachments = (text) => {
    if (!text) return [];
    const rgx = /(https?:\/\/\S+?\.(zip|rar|7z|pdf|png|jpg|jpeg|gif))(?!\S)/gi;
    const out = []; let m;
    while ((m = rgx.exec(text)) !== null) out.push({ url: m[1], name: m[1].split('/').pop() });
    return out;
  };
  const authorStats = (username) => {
    const count = threadPosts.filter(p => (p.authorUsername||p.author) === username).length;
    const stars = Math.max(1, Math.min(5, Math.ceil(count/3)));
    return { postsInThread: count, stars };
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
                <button className="btn btn-primary" onClick={()=> setShowThreadModal(true)}>New Thread</button>
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
            <div className="thread-toolbar">
              <div className="crumbs">{selectedCategory?.name} ▸ {activeThread.title}</div>
              <div className="tools">
                {canModerate && (
                  <>
                    <button className="btn btn-small" onClick={()=>pinToggle(activeThread, !activeThread.pinned)}>{activeThread.pinned? 'Unpin' : 'Pin'}</button>
                    <button className="btn btn-small" onClick={()=>lockToggle(activeThread, !activeThread.locked)}>{activeThread.locked? 'Unlock' : 'Lock'}</button>
                  </>
                )}
              </div>
            </div>
            <ul className="post-list">
              {threadPosts.map((p, idx) => {
                const author = p.authorUsername || p.author || 'user';
                const stats = authorStats(author);
                const atts = extractAttachments(p.body);
                return (
                  <li key={p.id} className="post-item post-row">
                    <aside className="post-author">
                      <div className="avatar" aria-hidden>👤</div>
                      <div className="author-name">{author}</div>
                      <div className="rank">Member {'★'.repeat(stats.stars)}</div>
                      <div className="meta">Posts (thread): {stats.postsInThread}</div>
                    </aside>
                    <article className="post-main">
                      <header className="post-header">
                        <div className="post-title">{activeThread.title}</div>
                        <div className="post-index">{ordinal(idx)} • {new Date(p.createdAt).toLocaleString()}</div>
                      </header>
                      <div className="post-content">{p.body}</div>
                      {atts.length>0 && (
                        <div className="post-attachments">
                          <div className="label">Attached Files</div>
                          <ul>
                            {atts.map(a => (<li key={a.url}><a href={a.url} target="_blank" rel="noreferrer">{a.name}</a></li>))}
                          </ul>
                        </div>
                      )}
                      <footer className="post-actions">
                        <button className="btn btn-small" onClick={()=>{ setNewPostBody(prev => prev + `\n> ${p.body.replaceAll('\n','\n> ')}\n\n`); }}>Quote</button>
                        <button className="btn btn-small" onClick={()=>reportPost(p)}>Report</button>
                      </footer>
                    </article>
                    <aside className="post-side">
                      <div>Joined: —</div>
                      <div>Thanks Given: —</div>
                      <div>Thanks Recv: —</div>
                    </aside>
                  </li>
                );
              })}
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
      {showThreadModal && (
        <div className="modal-backdrop" onClick={(e)=>{ if (e.target.classList.contains('modal-backdrop')) setShowThreadModal(false); }}>
          <div className="modal" role="dialog" aria-modal="true">
            <header>
              <span>New Thread — {selectedCategory?.name || ''}</span>
              <button className="btn" onClick={()=> setShowThreadModal(false)}>✕</button>
            </header>
            <form onSubmit={handleCreateThread}>
              <div className="content">
                <div className="row">
                  <label>Title</label>
                  <input value={newThreadTitle} onChange={e=>setNewThreadTitle(e.target.value)} placeholder="Thread title" required />
                </div>
                <div className="row">
                  <label>Body (optional)</label>
                  <textarea value={newThreadBody} onChange={e=>setNewThreadBody(e.target.value)} placeholder="Write the first post..." rows={8} />
                </div>
              </div>
              <footer>
                <button type="button" className="btn" onClick={()=> setShowThreadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Thread</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forums;
