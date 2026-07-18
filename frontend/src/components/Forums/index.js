import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Forums.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import { applySEO } from '../../utils/seo';
import { toast } from '../../utils/toast';

// Relative timestamp helper: "2h ago", "5m ago", "3d ago", "1w ago", "on Jan 15"
function timeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const week = Math.round(day / 7);
  if (sec < 60) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (week < 5) return `${week}w ago`;
  return `on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

// Build a short snippet from a post/thread body (first 100 chars, truncated)
function snippet(text, len = 100) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length > len ? clean.slice(0, len).trimEnd() + '…' : clean;
}

// Build initials from a username/name for avatar circles
function initials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Highlight search term within text (returns React-safe segments)
function highlightSearch(text, term) {
  if (!text || !term || !term.trim()) return text;
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  // eslint-disable-next-line security/detect-object-injection
  const esc = String(text).replace(/[&<>"]/g, (c) => map[c]);
  const t = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // eslint-disable-next-line security/detect-non-literal-regexp
  return esc.replace(new RegExp(`(${t})`, 'gi'), '<mark class="search-highlight">$1</mark>');
}

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
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const replyTextareaRef = useRef(null);
  useEffect(() => {
    return applySEO({
      title: 'Forums',
      description: 'Ask questions, share build logs, and collaborate with fellow automotive enthusiasts in the CarMatch forums.',
      canonical: 'https://bradleymatera.github.io/car-match/#/forums',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        name: 'CarMatch Forums',
        url: 'https://bradleymatera.github.io/car-match/#/forums',
        headline: 'CarMatch Community Forums',
        description: 'Community-driven discussion boards for car owners and enthusiasts.'
      }
    });
  }, []);

  // Close any open modal on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowThreadModal(false);
        setShowEmoji(false);
        setPendingDeleteId(null);
        setShowPreview(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
    setSidebarOpen(false);
    const s = opts.search ?? search;
    const p = opts.page ?? page;
    const append = Boolean(opts.append);
    if (append) setLoadingMore(true); else setLoadingThreads(true);
    try {
      const resp = await api.getThreadsByCategory(cat.id, { search: s, page: p, pageSize });
      let items = [];
      let total = 0;
      if (Array.isArray(resp)) {
        items = resp;
        total = resp.length;
      } else {
        items = resp.items || [];
        total = resp.total || 0;
      }
      if (append) {
        setThreads((prev) => {
          const seen = new Set(prev.map(getThreadId));
          return [...prev, ...items.filter((it) => !seen.has(getThreadId(it)))];
        });
      } else {
        setThreads(items);
      }
      setThreadsTotal(total);
      setHasMoreThreads(items.length >= pageSize && (append ? threads.length + items.length : items.length) < total);
      setPage(p);
      setLoadError(null);
    } catch (e) {
      if (!append) { setThreads([]); setThreadsTotal(0); }
      setLoadError('We couldn\'t load threads right now. Please try again in a moment.');
    } finally {
      setLoadingThreads(false);
      setLoadingMore(false);
    }
  };


  const openThread = async (thread) => {
    setLoadingPosts(true);
    try {
      const data = await api.getThreadById(getThreadId(thread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
      setThreadEvent(data.event || null);
    } catch (e) {
      toast.error('Failed to open thread');
    } finally {
      setLoadingPosts(false);
    }
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
    if (!currentUser) { toast.info('Please log in to create a thread.'); return; }
    if (!selectedCategory || !newThreadTitle.trim()) return;
    let newThread;
    try {
      if (!token) { toast.info('Please log in.'); return; }
      newThread = await api.createThread(token, { categoryId: selectedCategory.id, title: newThreadTitle.trim() });
      // Optionally create first post body if provided
      if (newThreadBody.trim()) {
        await api.addPostToThread(token, { threadId: getThreadId(newThread), body: newThreadBody.trim() });
      }
      setNewThreadTitle('');
      setNewThreadBody('');
      setShowThreadModal(false);
      setShowPreview(false);
      await loadThreads(selectedCategory, { page: 1 });
      openThread(newThread);
    } catch (err) {
      toast.error(err.message || 'Failed to create thread');
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.info('Please log in to reply.'); return; }
    if (!activeThread || !newPostBody.trim()) return;
    try {
      if (!token) { toast.info('Please log in.'); return; }
      await api.addPostToThread(token, { threadId: getThreadId(activeThread), body: newPostBody.trim() });
      setNewPostBody('');
      const data = await api.getThreadById(getThreadId(activeThread));
      setActiveThread(data.thread);
      setThreadPosts(data.posts);
    } catch (err) {
      toast.error(err.message || 'Failed to post');
    }
  };

  const pinToggle = async (thread, pinned) => {
    try {
      if (!token) { toast.info('Please log in.'); return; }
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
    } catch (e) { toast.error(e.message || 'Failed to pin'); }
  };

  const lockToggle = async (thread, locked) => {
    try {
      if (!token) { toast.info('Please log in.'); return; }
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
    } catch (e) { toast.error(e.message || 'Failed to lock'); }
  };

  const confirmDeleteThread = async (thread) => {
    try {
      if (!token) { toast.info('Please log in.'); return; }
      await api.deleteThread(token, getThreadId(thread));
      setPendingDeleteId(null);
      setActiveThread(null);
      await loadThreads(selectedCategory, { page: 1 });
      toast.success('Thread deleted.');
    } catch (e) { toast.error(e.message || 'Failed to delete'); }
  };

  // Insert an emoji at the cursor position in the reply textarea
  const insertEmojiAtCursor = useCallback((emoji) => {
    const ta = replyTextareaRef.current;
    if (!ta) {
      setNewPostBody((b) => b + emoji);
      return;
    }
    const start = ta.selectionStart ?? newPostBody.length;
    const end = ta.selectionEnd ?? newPostBody.length;
    const next = newPostBody.slice(0, start) + emoji + newPostBody.slice(end);
    setNewPostBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [newPostBody]);

  const reportPost = async (post) => {
    try {
      if (!token) { toast.info('Please log in.'); return; }
      await api.reportPost(token, post.id, 'inappropriate');
      toast.success('Reported. A moderator will review it.');
    } catch (e) { toast.error(e.message || 'Failed to report'); }
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
      <div className="page-bg forums-bg" />
      <button
        className={`forums-sidebar-toggle${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-expanded={sidebarOpen}
      >
        <span>{selectedCategory ? selectedCategory.name : 'Browse Categories'}</span>
        <span className="toggle-icon">▾</span>
      </button>
      <aside className={`forums-sidebar${sidebarOpen ? ' open' : ''}`}>
        <h2>Forums</h2>
        {loadingCategories ? (
          <div className="forum-empty">Loading forums…</div>
        ) : categories.length === 0 ? (
          <div className="forum-empty">No categories yet. Check back soon!</div>
        ) : (
          <ul>
            {categories.map(cat => {
              const s = frontStats.find(x => x.id === cat.id) || { threads: 0, posts: 0 };
              return (
              <li key={cat.id} className={selectedCategory?.id === cat.id ? 'active' : ''}>
                <button onClick={() => loadThreads(cat)}>{cat.name}</button>
                <p className="cat-desc">{cat.description}</p>
                <div className="cat-stats">
                  <span>{s.threads || 0} threads</span>
                  <span>{s.posts || 0} posts</span>
                </div>
              </li>
              );
            })}
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
                  {currentUser && (
                    <button className="btn btn-primary" onClick={()=> { setShowThreadModal(true); setShowPreview(false); }}>New Thread</button>
                  )}
                </div>
                {/* Prominent search bar */}
                <div className="forum-search">
                  <span className="search-icon">🔍</span>
                  <input
                    type="search"
                    placeholder="Search threads by title or content…"
                    value={search}
                    onChange={e=>setSearch(e.target.value)}
                    onKeyDown={e=>{ if (e.key === 'Enter') loadThreads(selectedCategory, { page: 1, search }); }}
                  />
                  {search && (
                    <button className="forum-search-clear" onClick={()=>{ setSearch(''); loadThreads(selectedCategory, { page: 1, search: '' }); }} aria-label="Clear search">✕</button>
                  )}
                  <button className="forum-search-btn" onClick={()=> loadThreads(selectedCategory, { page: 1, search })}>Search</button>
                </div>
                {search && (
                  <div className="search-active-indicator">
                    Searching for "{search}"
                  </div>
                )}
                {loadingThreads ? (
                  <div className="skeleton-list" aria-hidden>
                    {[0,1,2,3].map((i) => (
                      <div className="skeleton-thread" key={i}>
                        <div className="skeleton-bar skeleton-title" />
                        <div className="skeleton-bar skeleton-meta" />
                        <div className="skeleton-bar skeleton-snippet" />
                      </div>
                    ))}
                  </div>
                ) : threads.length === 0 ? (
                  <div className="forum-empty">
                    <h3>{search ? 'No threads match your search' : 'No threads in this category yet'}</h3>
                    <p>{search ? 'Try a different search term.' : 'Start the conversation!'}</p>
                    {currentUser && !search && (
                      <button className="btn btn-primary" onClick={()=> { setShowThreadModal(true); setShowPreview(false); }}>Create Thread</button>
                    )}
                  </div>
                ) : (
                  <>
                    <ul className="thread-list">
                      {threads.map((th) => {
                        const threadId = getThreadId(th);
                        const isPinned = Boolean(th.pinned);
                        const isLocked = Boolean(th.locked);
                        const replyCount = th.replies || 0;
                        const author = th.authorUsername || th.author || 'user';
                        const preview = snippet(th.body || th.firstPostBody || th.content || th.excerpt);
                        const confirmingDelete = pendingDeleteId === threadId;
                        const lastActivity = timeAgo(th.lastPostAt || th.createdAt || th.updatedAt);
                        return (
                          <li key={threadId} className="thread-item">
                            <div className="thread-item-header" onClick={()=>openThread(th)}>
                              <div className="thread-row">
                                <div className="thread-avatar" aria-hidden>{initials(author)}</div>
                                <div className="thread-body">
                                  <div className="thread-title">
                                    {isPinned && <span className="thread-chip pinned">📌 Pinned</span>}
                                    {isLocked && <span className="thread-chip locked">🔒 Locked</span>}
                                    <span dangerouslySetInnerHTML={{ __html: highlightSearch(th.title, search) }} />
                                  </div>
                                  {preview && <div className="thread-snippet" dangerouslySetInnerHTML={{ __html: highlightSearch(preview, search) }} />}
                                  <div className="thread-author-line">
                                    <span className="thread-author-name">{author}</span>
                                    <span className="thread-badge">in {selectedCategory.name}</span>
                                  </div>
                                  <div className="thread-meta">
                                    <span className="meta-item">🕒 {lastActivity}</span>
                                  </div>
                                </div>
                                <div className="thread-stats">
                                  <strong>{replyCount}</strong>
                                  <span>{replyCount === 1 ? 'reply' : 'replies'}</span>
                                </div>
                              </div>
                            </div>
                            {canModerate && (
                              <div className="thread-tool-row">
                                <button onClick={()=>pinToggle(th, !th.pinned)}>{isPinned ? 'Unpin' : 'Pin'}</button>
                                <button onClick={()=>lockToggle(th, !th.locked)}>{isLocked ? 'Unlock' : 'Lock'}</button>
                                {confirmingDelete ? (
                                  <span className="inline-confirm">
                                    Are you sure?
                                    <button className="btn btn-warning btn-small" onClick={()=>confirmDeleteThread(th)}>Delete</button>
                                    <button className="btn btn-small" onClick={()=> setPendingDeleteId(null)}>Cancel</button>
                                  </span>
                                ) : (
                                  <button onClick={()=> setPendingDeleteId(threadId)}>Delete</button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="threads-pagination">
                      {hasMoreThreads ? (
                        <button className="btn" disabled={loadingMore} onClick={()=> loadThreads(selectedCategory, { page: page+1, append: true })}>
                          {loadingMore ? 'Loading…' : 'Load More'}
                        </button>
                      ) : (
                        <span className="pagination-info">Page {page} {threadsTotal ? `(~${threadsTotal} total)` : ''}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

        {selectedCategory && activeThread && (
          <div className="thread-view">
            {/* Breadcrumb back to thread list */}
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <button onClick={()=>{ setActiveThread(null); setThreadPosts([]); }}>← Forums</button>
              <span className="crumb-separator">›</span>
              <button onClick={()=>{ setActiveThread(null); setThreadPosts([]); }}>{selectedCategory?.name}</button>
              <span className="crumb-separator">›</span>
              <span className="crumb-current">{activeThread.title}</span>
            </nav>
            <div className="thread-toolbar">
              <div className="thread-heading">
                <div className="crumbs">{activeThread.title}</div>
                <div className="thread-chip-row">
                  {activeThread.pinned && <span className="thread-chip pinned">📌 Pinned</span>}
                  {activeThread.locked && <span className="thread-chip locked">🔒 Locked</span>}
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
              {loadingPosts ? (
                <div className="skeleton-list" aria-hidden>
                  {[0,1].map((i) => (
                    <div className="skeleton-post" key={i}>
                      <div className="skeleton-bar skeleton-title" />
                      <div className="skeleton-bar skeleton-meta" />
                      <div className="skeleton-bar skeleton-line" />
                      <div className="skeleton-bar skeleton-line short" />
                    </div>
                  ))}
                </div>
              ) : threadPosts.length <= 1 ? (
                <div className="forum-empty">
                  <h3>No replies yet</h3>
                  <p>Be the first to reply!</p>
                </div>
              ) : threadPosts.map((p, idx) => {
                const author = p.authorUsername || p.author || 'user';
                const stats = authorStats(author);
                const atts = extractAttachments(p.body);
                const isEdited = Boolean(p.editedAt || (p.updatedAt && p.updatedAt !== p.createdAt));
                return (
                  <li key={p.id} id={`post-${p._id || p.id}`} className="post-item post-row">
                    <aside className="post-author">
                      <div className="avatar" aria-hidden>{initials(author)}</div>
                      <div className="author-name">{author}</div>
                      <div className="author-role-badge member">Member</div>
                      <div className="rank">{'★'.repeat(stats.stars)}</div>
                      <div className="meta">{stats.postsInThread} in thread</div>
                    </aside>
                    <article className="post-main">
                      <header className="post-header">
                        <div className="post-title">{ordinal(idx)}</div>
                        <div className="post-index">
                          {timeAgo(p.createdAt)}
                          {isEdited && <span className="post-edited">(edited)</span>}
                        </div>
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
                        <button className="btn btn-small btn-reply" onClick={()=>{ setNewPostBody(prev => prev + `\n> ${p.body.replaceAll('\n','\n> ')}\n\n`); replyTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Reply</button>
                        <button className="btn btn-small" onClick={()=>{ setNewPostBody(prev => prev + `\n> ${p.body.replaceAll('\n','\n> ')}\n\n`); }}>Quote</button>
                        <button className="btn btn-small" onClick={()=>reportPost(p)}>Report</button>
                      </footer>
                    </article>
                  </li>
                );
              })}
            </ul>
            {currentUser && !activeThread.locked && (
              <form onSubmit={handleAddPost} className="post-composer">
                <div className="editor-toolbar">
                  <button type="button" className="toolbar-btn" onClick={()=> setNewPostBody(b=> b + '**bold**')} title="Bold">B</button>
                  <button type="button" className="toolbar-btn" onClick={()=> setNewPostBody(b=> b + '_italic_')} title="Italic"><em>I</em></button>
                  <span className="toolbar-divider" />
                  <button type="button" className="toolbar-btn" onClick={()=> setNewPostBody(b=> b + '\n> quote')} title="Quote">❝</button>
                  <button type="button" className="toolbar-btn" onClick={()=> {
                    const url = prompt('Image URL (https://...)'); if (url) setNewPostBody(b=> b + `\n[img](${url})\n`);
                  }} title="Insert Image">🖼</button>
                  <button type="button" className="toolbar-btn" onClick={()=> {
                    const url = prompt('Link URL (https://...)'); if (url) setNewPostBody(b=> b + ` ${url} `);
                  }} title="Insert Link">🔗</button>
                  <span className="toolbar-divider" />
                  <button type="button" className="toolbar-btn" onClick={()=> setShowEmoji(s=>!s)} title="Emoji">😊</button>
                </div>
                {showEmoji && (
                  <div className="emoji-palette">
                    {['😀','😁','😂','😍','😎','🤙','👍','🔥','🚗','🏁','👏','🙌','🤔','😅','🚀','💨'].map(e => (
                      <button type="button" key={e} onClick={()=> insertEmojiAtCursor(e)}>{e}</button>
                    ))}
                  </div>
                )}
                <textarea ref={replyTextareaRef} placeholder="Write a reply..." value={newPostBody} onChange={(e)=>setNewPostBody(e.target.value)} maxLength={5000} />
                <div className="composer-footer">
                  <span className={`composer-charcount${newPostBody.length > 4500 ? ' warn' : ''}${newPostBody.length >= 5000 ? ' danger' : ''}`}>
                    {newPostBody.length} / 5000
                  </span>
                  <button type="submit">Post Reply</button>
                </div>
                <small>Tip: use **bold**, _italic_, [img](url), and &gt; quote.</small>
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
            <div className="modal-tabs">
              <button className={`modal-tab${!showPreview ? ' active' : ''}`} onClick={()=> setShowPreview(false)}>Compose</button>
              <button className={`modal-tab${showPreview ? ' active' : ''}`} onClick={()=> setShowPreview(true)} disabled={!newThreadTitle.trim() && !newThreadBody.trim()}>Preview</button>
            </div>
            <form onSubmit={handleCreateThread}>
              <div className="content">
                {!showPreview ? (
                  <>
                    <div className="row">
                      <label>Category</label>
                      <select value={selectedCategory?.id || ''} onChange={e=>{ const c = categories.find(x=>x.id===e.target.value); if (c) setSelectedCategory(c); }} required>
                        {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                    <div className="row">
                      <label>Title</label>
                      <input value={newThreadTitle} onChange={e=>setNewThreadTitle(e.target.value)} placeholder="Thread title" required maxLength={120} />
                    </div>
                    <div className="row">
                      <label>Body (optional)</label>
                      <textarea value={newThreadBody} onChange={e=>setNewThreadBody(e.target.value)} placeholder="Write the first post... (supports **bold**, _italic_, > quote, [img](url))" rows={8} maxLength={5000} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="modal-preview-title">{newThreadTitle || 'Untitled Thread'}</div>
                    <div className="modal-preview" dangerouslySetInnerHTML={{ __html: formatPost(newThreadBody) || '<em style="color: var(--text-muted)">No body content yet.</em>' }} />
                  </>
                )}
              </div>
              <footer>
                <button type="button" className="btn" onClick={()=> setShowThreadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newThreadTitle.trim()}>Create Thread</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forums;
