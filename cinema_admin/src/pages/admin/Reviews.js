import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const Reviews = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (selectedMovieId) {
      if (activeTab === 'reviews') fetchReviews(selectedMovieId);
      else fetchComments(selectedMovieId);
    }
  }, [selectedMovieId, activeTab]);

  const fetchMovies = async () => {
    try {
      const res = await axiosClient.get('/movies');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setMovies(list);
      if (list.length > 0) setSelectedMovieId(list[0].id);
    } catch (e) {
      setError('Không thể tải danh sách phim.');
    }
  };

  const fetchReviews = async (movieId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/reviews/movie/${movieId}`);
      const data = res.data || res;
      setReviews(data.reviews || []);
    } catch (e) {
      setError('Không thể tải đánh giá.');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async (movieId) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/comments/movie/${movieId}`);
      const data = res.data || res;
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Không thể tải bình luận.');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này không?')) return;
    try {
      await axiosClient.delete(`/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (e) {
      alert('Không thể xóa đánh giá này.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này không?')) return;
    try {
      await axiosClient.delete(`/comments/${commentId}`);
      fetchComments(selectedMovieId);
    } catch (e) {
      alert('Không thể xóa bình luận này.');
    }
  };

  const filteredReviews = reviews.filter(r =>
    !searchTerm || r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredComments = comments.filter(c =>
    !searchTerm || c.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMovie = movies.find(m => String(m.id) === String(selectedMovieId));
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  const renderStars = (rating) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>★</span>
      ))}
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const CountBadge = ({ count, color = '#6366f1' }) => (
    <span style={{ background: color, color: 'white', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: '700' }}>
      {count}
    </span>
  );

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đánh giá & Bình luận</h1>
          <p className="page-subtitle">Theo dõi và kiểm duyệt nội dung từ người dùng</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'reviews' && reviews.length > 0 && (
            <div className="card" style={{ padding: '10px 18px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-warning)' }}>⭐ {avgRating}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reviews.length} lượt đánh giá</div>
            </div>
          )}
        </div>
      </div>

      {/* FILTERS ROW */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={selectedMovieId}
          onChange={e => setSelectedMovieId(e.target.value)}
          className="form-control"
          style={{ minWidth: '200px', flex: '0 1 auto' }}
        >
          {movies.map(m => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên / nội dung..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ flex: 1, minWidth: '220px' }}
        />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: 'var(--radius-lg)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { key: 'reviews', label: '⭐ Đánh giá sao', count: reviews.length, color: 'var(--accent-warning)' },
          { key: 'comments', label: '💬 Bình luận', count: comments.length, color: 'var(--accent-primary)' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="btn"
            style={{
              background: activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: activeTab === tab.key ? '1px solid var(--border)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {tab.label}
            <CountBadge count={tab.count} color={activeTab === tab.key ? tab.color : 'var(--bg-elevated)'} />
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '600' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : activeTab === 'reviews' ? (
        // ===== REVIEWS TAB =====
        filteredReviews.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: 'var(--text-primary)' }}>Chưa có đánh giá nào</p>
            <p style={{ fontSize: '14px' }}>Phim "{selectedMovie?.title}" chưa có lượt đánh giá nào từ khán giả.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
            {filteredReviews.map(review => (
              <div key={review.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-warning), #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px', flexShrink: 0 }}>
                      {(review.userName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{review.userName || 'Ẩn danh'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(review.createdAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="btn"
                    style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }}
                  >
                    Xóa
                  </button>
                </div>
                {renderStars(review.rating)}
                {review.comment && (
                  <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-warning)' }}>
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        // ===== COMMENTS TAB =====
        filteredComments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: 'var(--text-primary)' }}>Chưa có bình luận nào</p>
            <p style={{ fontSize: '14px' }}>Phim "{selectedMovie?.title}" chưa có bình luận nào từ người xem.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredComments.map(comment => (
              <div key={comment.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px', flexShrink: 0 }}>
                      {(comment.userName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>{comment.userName || 'Ẩn danh'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn"
                    style={{ background: '#ef4444', color: 'white', padding: '6px 12px' }}
                  >
                    Xóa
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                  {comment.content}
                </p>
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginTop: '12px', marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '2px solid var(--border)', paddingLeft: '16px' }}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', padding: '8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-muted)' }}>↪ {reply.userName || 'Ẩn danh'}</div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{reply.content}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(reply.id)}
                          className="btn"
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', fontSize: '11px' }}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Reviews;
