import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './Forums.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';

const Forums = () => {
  const { currentUser, token } = useContext(AuthContext);
  const userRole = currentUser?.role || (currentUser?.developerOverride ? 'admin' : 'user');
  const canModerate = useMemo(
    () => Boolean(currentUser && (currentUser.developerOverride || userRole === 'admin' || userRole === 'moderator')),
    [currentUser, userRole]
  );
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [threadsTotal, setThreadsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [threadPosts, setThreadPosts] = useState([]);
  const [threadEvent, setThreadEvent] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const location = useLocation();
  const [frontStats, setFrontStats] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  // Background images (rotates like Events)
  const bgImages = useMemo(() => ([
    'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'
  ]), []);
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBgIndex(i => (i + 1) % bgImages.length), 8000);
    return () => clearInterval(id);
  }, [bgImages]);

  const currentBackground = useMemo(
    () => (Array.isArray(bgImages) ? bgImages.at(bgIndex) ?? '' : ''),
    [bgImages, bgIndex]
  );
  function getThreadId(t) {
  return t?.id || t?._id || t?.threadId;
}

  const activeThreadId = activeThread ? getThreadId(activeThread) : null;
  const canManageActiveThread = useMemo(() => {
    if (!currentUser || !activeThread) return false;
    if (canModerate) return true;
    if (threadEvent?.createdByUserId) {
      return String(threadEvent.createdByUserId) === String(currentUser.id);
    }
    return false;
  }, [activeThread, canModerate, currentUser, threadEvent]);

  useEffect(() => {
    (async () => {
      setLoadingCategories(true);
      setLoadError(null);
      try {
        const cats = await api.getForumCategories();
        setCategories(cats);
        try { const stats = await api.getForumStats(); setFrontStats(stats); } catch {}
        const params = new URLSearchParams(location.search);
        const open = params.get('open');
        if (open) {
          try {
            const data = await api.getThreadById(open);
            if (data?.thread) {
              const cat = cats.find(c => c.id === data.thread.categoryId);
              if (cat) setSelectedCategory(cat);
              setActiveThread(data.thread);
              setThreadPosts(data.posts);
            }
          } catch {}
        }
      } catch (err) {
        console.error('Unable to load forum categories', err);
        setCategories([]);
        setLoadError('Forums are still warming up. Please try again shortly or refresh the page.');
      } finally {
        setLoadingCategories(false);
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
      const resp = await api.getThreadsByCategory(cat.id, { search: s, page: p, pageSize });
      if (Array.isArray(resp)) {
        setThreads(resp);
        setThreadsTotal(resp.length);
      } else {
        setThreads(resp.items || []);
        setThreadsTotal(resp.total || 0);
      }
      setPage(p);
      setLoadError(null);
    } catch (e) {
      setThreads([]);
      setThreadsTotal(0);
      setLoadError('We couldn\'t load threads right now. Please try again in a moment.');
    }
  };


  const openThread = async (thread) => {
    const data = await api.getThreadById(getThreadId(thread));
    setActiveThread(data.thread);
    setThreadPosts(data.posts);
    setThreadEvent(data.event || null);
  };

  // Scroll to a specific post if ?post=<id>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get('post');
    if (!postId || !activeThread || threadPosts.length === 0) return;
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight');
      setTimeout(()=> el.classList.remove('highlight'), 1500);
    }
  }, [location.search, activeThread, threadPosts]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please log in to create a thread.'); return; }
    if (!selectedCategory || !newThreadTitle.trim()) return;
    let newThread;
    try {
      if (!token) { alert('Please log in.'); return; }
      newThread = await api.createThread(token, { categoryId: selectedCategory.id, title: newThreadTitle.trim() });
      // Optionally create first post body if provided
      if (newThreadBody.trim()) {
        await api.addPostToThread(token, { threadId: getThreadId(newThread), body: newThreadBody.trim() });
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
      await api.addPostToThread(token, { threadId: getThreadId(activeThread), body: newPostBody.trim() });
      setNewPostBody('');
      const data = await api.getThreadById(getThreadId(activeThread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
    } catch (err) {
      alert(err.message || 'Failed to post');
    }
  };

  const pinToggle = async (thread, pinned) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      const response = await api.pinThread(token, getThreadId(thread), pinned);
      const updatedThread = response?.thread || null;
      if (updatedThread) {
        const threadId = getThreadId(updatedThread);
        setThreads((prev) => prev.map((item) => (getThreadId(item) === threadId ? updatedThread : item)));
        if (activeThreadId && threadId === activeThreadId) {
          setActiveThread(updatedThread);
        }
      } else {
        await loadThreads(selectedCategory, { page });
      }
    } catch (e) { alert(e.message || 'Failed to pin'); }
  };

  const lockToggle = async (thread, locked) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      const response = await api.lockThread(token, getThreadId(thread), locked);
      const updatedThread = response?.thread || null;
      if (updatedThread) {
        const threadId = getThreadId(updatedThread);
        setThreads((prev) => prev.map((item) => (getThreadId(item) === threadId ? updatedThread : item)));
        if (activeThreadId && threadId === activeThreadId) {
          setActiveThread(updatedThread);
        }
      }
      const data = await api.getThreadById(getThreadId(thread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
    } catch (e) { alert(e.message || 'Failed to lock'); }
  };

  const deleteThread = async (thread) => {
    if (!window.confirm('Delete this thread?')) return;
    try {
      if (!token) { alert('Please log in.'); return; }
      await api.deleteThread(token, getThreadId(thread));
      setActiveThread(null);
      await loadThreads(selectedCategory, { page: 1 });
    } catch (e) { alert(e.message || 'Failed to delete'); }
  };

  const reportPost = async (post) => {
    try {
      if (!token) { alert('Please log in.'); return; }
      await api.reportPost(token, post.id, 'inappropriate');
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

  // Formatting helpers (safe construction of limited HTML from plain text)
  const escapeHTML = (s) => s.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
  const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : null);
  const formatPost = (raw) => {
    if (!raw) return '';
    const esc = escapeHTML(raw);
    // blockquote: lines starting with "> "
    let html = esc.split('\n').map(l => l.startsWith('&gt; ') ? `<blockquote>${l.slice(5)}</blockquote>` : l).join('\n');
    // simple bold/italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>');
    // [img](url)
    html = html.replace(/\[img\]\((https?:[^\s)]+)\)/gi, (m, u) => safeUrl(u) ? `<img src="${u}" alt="image" />` : m);
    // autolink
    html = html.replace(/(https?:\/\/[^\s<]+)/g, (m)=>`<a href="${m}" target="_blank" rel="noreferrer">${m}</a>`);
    // line breaks
    html = html.replace(/\n/g,'<br/>');
    return html;
  };

  return (
    <div className="forums-container">
      <div
        className="page-bg forums-bg"
        style={{
          backgroundImage: `linear-gradient(rgba(8,13,23,0.72), rgba(8,13,23,0.72)), url(${currentBackground})`
        }}
      />
      <aside className="forums-sidebar">
        <h2>Forums</h2>
        {loadingCategories ? (
          <div className="forum-empty">Loading forums…</div>
        ) : categories.length === 0 ? (
          <div className="forum-empty">No categories yet. Check back soon!</div>
        ) : (
          <ul>
            {categories.map(cat => (
              <li key={cat.id} className={selectedCategory?.id === cat.id ? 'active' : ''}>
                <button onClick={() => loadThreads(cat)}>{cat.name}</button>
                <p className="cat-desc">{cat.description}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className="forums-main" aria-live="polite">
        {loadingCategories ? (
          <div className="forum-empty">Loading forums…</div>
        ) : loadError ? (
          <div className="forum-empty" role="alert">{loadError}</div>
        ) : categories.length === 0 ? (
          <div className="forum-empty">
            <h3>Forums are almost ready</h3>
            <p>We’re still importing discussion topics. Check back soon or start an event discussion instead.</p>
          </div>
        ) : (
          <>
            <div className="forum-subnav">
              <button className="btn btn-small">Guidelines</button>
              <button className="btn btn-small">Staff</button>
              <button className="btn btn-small">Online Users</button>
              <div style={{marginLeft:'auto', display:'flex', gap:8}}>
                <input type="search" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
                {selectedCategory ? (
                  <button className="btn" onClick={()=> loadThreads(selectedCategory, { page: 1, search })}>Search</button>
                ) : (
                  <button className="btn" onClick={()=> { if (categories[0]) loadThreads(categories[0], { page:1, search }); }}>Go</button>
                )}
              </div>
            </div>
            {!selectedCategory && (
              <div className="forum-front">
                <h1 className="forum-title">CarMatch Forums</h1>
                <div className="forum-sections">
                  {categories.map(cat => {
                    const s = frontStats.find(x => x.id === cat.id) || { threads: 0, posts: 0 };
                    return (
                      <div key={cat.id} className="forum-card" onClick={()=> loadThreads(cat, { page: 1 })}>
                        <div className="forum-card-left">
                          <div className="forum-card-title">{cat.name}</div>
                          <div className="forum-card-desc">{cat.description}</div>
                        </div>
                        <div className="forum-card-right">
                          <div className="forum-count"><strong>{s.posts}</strong><span>posts</span></div>
                          <div className="forum-count"><strong>{s.threads}</strong><span>threads</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="forum-empty-hint">Looking for something specific? Try the Events page to open a discussion from an event.</div>
              </div>
            )}
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
                  {threads.map((th) => {
                    const threadId = getThreadId(th);
                    const isPinned = Boolean(th.pinned);
                    const isLocked = Boolean(th.locked);
                    const replyCount = th.replies || 0;
                    return (
                      <li key={threadId} className="thread-item">
                        <div className="thread-item-header" onClick={()=>openThread(th)}>
                          <div className="thread-title">
                            {isPinned && <span className="thread-chip pinned">Pinned</span>}
                            {isLocked && <span className="thread-chip locked">Locked</span>}
                            <span>{th.title}</span>
                          </div>
                          <div className="thread-meta">by {th.authorUsername || th.author || 'user'} • {new Date(th.lastPostAt).toLocaleString()} • {replyCount} replies</div>
                        </div>
                        {canModerate && (
                          <div className="thread-tool-row">
                            <button onClick={()=>pinToggle(th, !th.pinned)}>{isPinned ? 'Unpin' : 'Pin'}</button>
                            <button onClick={()=>lockToggle(th, !th.locked)}>{isLocked ? 'Unlock' : 'Lock'}</button>
                            <button onClick={()=>deleteThread(th)}>Delete</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
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
              <div className="thread-heading">
                <div className="crumbs">{selectedCategory?.name} ▸ {activeThread.title}</div>
                <div className="thread-chip-row">
                  {activeThread.pinned && <span className="thread-chip pinned">Pinned</span>}
                  {activeThread.locked && <span className="thread-chip locked">Locked</span>}
                </div>
              </div>
              <div className="tools">
                {canManageActiveThread && (
                  <>
                    <button className="btn btn-small" onClick={()=>pinToggle(activeThread, !activeThread.pinned)}>{activeThread.pinned? 'Unpin' : 'Pin'}</button>
                    <button className="btn btn-small" onClick={()=>lockToggle(activeThread, !activeThread.locked)}>{activeThread.locked? 'Unlock' : 'Lock'}</button>
                  </>
                )}
                {threadEvent && (
                  <button className="btn btn-small" onClick={()=>{ window.location.hash = `#/events?event=${threadEvent.id || (threadEvent._id && threadEvent._id.toString())}`; }}>View Event</button>
                )}
              </div>
            </div>
            {threadEvent && (
              <div className="thread-event-card">
                <div className="thread-event-summary">
                  <div>
                    <div className="thread-event-title">{threadEvent.title}</div>
                    <div className="thread-event-meta">
                      <span>📅 {threadEvent.date ? new Date(threadEvent.date).toLocaleDateString() : 'Date TBA'}</span>
                      <span>📍 {threadEvent.location || 'TBD'}</span>
                      <span>🧑‍💼 {String(threadEvent.createdByUserId) === String(currentUser?.id) ? 'You' : threadEvent.createdByUsername || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="thread-event-actions">
                    <button className="btn btn-small" onClick={()=>{ window.location.hash = `#/events?event=${threadEvent.id || (threadEvent._id && threadEvent._id.toString())}`; }}>Open Event</button>
                  </div>
                </div>
              </div>
            )}
            <ul className="post-list">
              {threadPosts.map((p, idx) => {
                const author = p.authorUsername || p.author || 'user';
                const stats = authorStats(author);
                const atts = extractAttachments(p.body);
                return (
                  <li key={p.id} id={`post-${p._id || p.id}`} className="post-item post-row">
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
                      <div className="post-content" dangerouslySetInnerHTML={{__html: formatPost(p.body)}} />
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
                <div className="editor-toolbar">
                  <button type="button" className="btn btn-small" onClick={()=> setNewPostBody(b=> b + '**bold**')}>B</button>
                  <button type="button" className="btn btn-small" onClick={()=> setNewPostBody(b=> b + '_italic_')}>I</button>
                  <button type="button" className="btn btn-small" onClick={()=> setNewPostBody(b=> b + '\n> quote')}>Quote</button>
                  <button type="button" className="btn btn-small" onClick={()=> {
                    const url = prompt('Image URL (https://...)'); if (url) setNewPostBody(b=> b + `\n[img](${url})\n`);
                  }}>Image</button>
                  <button type="button" className="btn btn-small" onClick={()=> setShowEmoji(s=>!s)}>😊</button>
                </div>
                {showEmoji && (
                  <div className="emoji-palette">
                    {['😀','😁','😂','😍','😎','🤙','👍','🔥','🚗','🏁'].map(e => (
                      <button type="button" key={e} onClick={()=> setNewPostBody(b=> b + e)}>{e}</button>
                    ))}
                  </div>
                )}
                <textarea placeholder="Write a reply..." value={newPostBody} onChange={(e)=>setNewPostBody(e.target.value)} />
                <small>Tip: use **bold**, _italic_, [img](url), and &gt; quote.</small>
                <button type="submit">Post Reply</button>
              </form>
            )}
            {activeThread.locked && <p>This thread is locked.</p>}
          </div>
        )}
        </>
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
