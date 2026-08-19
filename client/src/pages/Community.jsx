import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Hash,
  Loader2,
  Trash2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import usePostStore from '../store/postStore';
import useAuthStore from '../store/authStore';

const POPULAR_TAGS = [
  'webdev', 'career-advice', 'dsa', 'react', 'python',
  'machine-learning', 'study-group', 'hackathon', 'resources', 'motivation',
];

const Community = () => {
  const { user } = useAuthStore();
  const {
    posts, pagination, isLoading,
    fetchFeed, createPost, toggleUpvote, deletePost,
    fetchComments, addComment,
  } = usePostStore();

  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterTag, setFilterTag] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchFeed(1, sortBy, filterTag);
  }, [fetchFeed, sortBy, filterTag]);

  // ── Create post ──────────────────────────────────────────────
  const handlePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsPosting(true);
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await createPost(newContent.trim(), tags);
      setNewContent('');
      setNewTags('');
    } catch {
      // Error handled by store/toast
    } finally {
      setIsPosting(false);
    }
  };

  // ── Toggle comments ─────────────────────────────────────────
  const toggleComments = useCallback(async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      const loaded = await fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: loaded }));
    }
  }, [expandedPost, comments, fetchComments]);

  // ── Submit comment ──────────────────────────────────────────
  const handleComment = async (postId) => {
    const text = (commentInput[postId] || '').trim();
    if (!text) return;
    try {
      const newComment = await addComment(postId, text);
      setComments((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }));
      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      // Error handled by store/toast
    }
  };

  // ── Load more ───────────────────────────────────────────────
  const loadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchFeed(pagination.page + 1, sortBy, filterTag);
    }
  };

  return (
    <DashboardLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-heading)' }}>
          Community Feed
        </h1>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
          Share knowledge, ask questions, and connect with peers.
        </p>
      </div>

      {/* ── Compose ─────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handlePost}>
          <textarea
            id="community-post-input"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Share something with the community…"
            maxLength={2000}
            rows={3}
            style={{
              width: '100%', resize: 'vertical', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem',
              fontSize: '0.9375rem', fontFamily: 'inherit', background: 'var(--color-page-bg)',
              color: 'var(--color-heading)', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <Hash size={16} color="var(--color-muted)" />
              <input
                id="community-tags-input"
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                style={{
                  flex: 1, border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem', fontFamily: 'inherit', background: 'var(--color-page-bg)',
                  color: 'var(--color-heading)', outline: 'none',
                }}
              />
            </div>
            <button
              id="community-post-btn"
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!newContent.trim() || isPosting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            >
              {isPosting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              Post
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.375rem', textAlign: 'right' }}>
            {newContent.length}/2000
          </div>
        </form>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Filter size={14} color="var(--color-muted)" />
          <select
            id="community-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
              padding: '0.375rem 0.625rem', fontSize: '0.8125rem', fontFamily: 'inherit',
              background: 'var(--color-card)', color: 'var(--color-heading)', cursor: 'pointer',
            }}
          >
            <option value="recent">Newest</option>
            <option value="popular">Most Upvoted</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTag('')}
            style={{
              padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem',
              fontWeight: 500, border: '1px solid var(--color-border)', cursor: 'pointer',
              background: !filterTag ? 'var(--color-primary)' : 'var(--color-card)',
              color: !filterTag ? '#fff' : 'var(--color-muted)',
              transition: 'all 0.15s',
            }}
          >
            All
          </button>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              style={{
                padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem',
                fontWeight: 500, border: '1px solid var(--color-border)', cursor: 'pointer',
                background: filterTag === tag ? 'var(--color-primary)' : 'var(--color-card)',
                color: filterTag === tag ? '#fff' : 'var(--color-muted)',
                transition: 'all 0.15s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts ────────────────────────────────────────────── */}
      {isLoading && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.75rem' }} />
          Loading feed…
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-muted)' }}>
          <MessageSquare size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map((post) => {
            const isOwn = post.author?._id === user?._id;
            const hasUpvoted = post.upvotes?.some?.((id) => {
              const uid = typeof id === 'object' ? id._id || id : id;
              return uid?.toString() === user?._id?.toString();
            });
            const isExpanded = expandedPost === post._id;

            return (
              <div
                key={post._id}
                className="card"
                style={{ padding: '1.25rem 1.5rem', transition: 'box-shadow 0.15s' }}
              >
                {/* Author + time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                        background: 'var(--color-primary)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.875rem', flexShrink: 0,
                      }}
                    >
                      {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '0.9375rem' }}>
                        {post.author?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                        {post.author?.role && (
                          <span
                            style={{
                              marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '9999px',
                              background: post.author.role === 'mentor' ? '#DBEAFE' : '#F3F4F6',
                              color: post.author.role === 'mentor' ? '#1D4ED8' : '#6B7280',
                              fontSize: '0.6875rem', fontWeight: 500,
                            }}
                          >
                            {post.author.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => deletePost(post._id)}
                      title="Delete post"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: '0.25rem' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p style={{ color: 'var(--color-body)', fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>
                  {post.content}
                </p>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setFilterTag(tag)}
                        style={{
                          padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem',
                          fontWeight: 500, background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)', cursor: 'pointer',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <button
                    onClick={() => toggleUpvote(post._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: hasUpvoted ? 'var(--color-primary)' : 'var(--color-muted)',
                      fontWeight: hasUpvoted ? 600 : 400, fontSize: '0.8125rem',
                      transition: 'color 0.15s',
                    }}
                  >
                    <ThumbsUp size={15} fill={hasUpvoted ? 'var(--color-primary)' : 'none'} />
                    {post.upvotes?.length || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: isExpanded ? 'var(--color-primary)' : 'var(--color-muted)',
                      fontSize: '0.8125rem', transition: 'color 0.15s',
                    }}
                  >
                    <MessageSquare size={15} />
                    {post.commentCount || 0}
                  </button>
                </div>

                {/* Comment section */}
                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    {/* Comment input */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        value={commentInput[post._id] || ''}
                        onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post._id)}
                        placeholder="Write a comment…"
                        style={{
                          flex: 1, border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-lg)', padding: '0.5rem 0.75rem',
                          fontSize: '0.8125rem', fontFamily: 'inherit', background: 'var(--color-page-bg)',
                          color: 'var(--color-heading)', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="btn btn-primary btn-sm"
                        disabled={!(commentInput[post._id] || '').trim()}
                        style={{ padding: '0.5rem 0.75rem' }}
                      >
                        <Send size={13} />
                      </button>
                    </div>

                    {/* Comments list */}
                    {(comments[post._id] || []).map((c) => (
                      <div key={c._id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <div
                            style={{
                              width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                              background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 600, fontSize: '0.6875rem', flexShrink: 0,
                            }}
                          >
                            {c.author?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-heading)' }}>
                            {c.author?.name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-muted)' }}>
                            {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-body)', marginLeft: '2rem' }}>
                          {c.content}
                        </p>
                      </div>
                    ))}
                    {(comments[post._id] || []).length === 0 && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                        No comments yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Load more */}
          {pagination.page < pagination.pages && (
            <button
              id="community-load-more"
              onClick={loadMore}
              className="btn"
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                margin: '0 auto', padding: '0.625rem 1.5rem', background: 'var(--color-card)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
                cursor: 'pointer', color: 'var(--color-heading)', fontSize: '0.875rem',
              }}
            >
              {isLoading ? <Loader2 size={14} className="spin" /> : <ChevronDown size={14} />}
              Load more
            </button>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Community;
