import { confirmToast } from '../../utils/confirmToast';
import toast from 'react-hot-toast';
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
    confirmToast('Bạn có chắc muốn xóa đánh giá này không?', async () => {
      try {
        await axiosClient.delete(`/reviews/${reviewId}`);
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        toast.success('Đã xóa đánh giá thành công');
      } catch (e) {
        toast.error('Không thể xóa đánh giá này.');
      }
    });
  };

  const handleDeleteComment = async (commentId) => {
    confirmToast('Bạn có chắc muốn xóa bình luận này không?', async () => {
      try {
        await axiosClient.delete(`/comments/${commentId}`);
        fetchComments(selectedMovieId);
        toast.success('Đã xóa bình luận thành công');
      } catch (e) {
        toast.error('Không thể xóa bình luận này.');
      }
    });
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
        <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#334155', fontSize: '16px' }}>★</span>
      ))}
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Đánh giá & Bình luận</h1>
          <p className="page-subtitle">Theo dõi và kiểm duyệt nội dung từ người dùng</p>
        </div>
        {activeTab === 'reviews' && reviews.length > 0 && (
          <div className="card" style={{ padding: '10px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-warning)' }}>⭐ {avgRating}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reviews.length} lượt đánh giá</div>
          </div>
        )}
      </div>

      {/* FILTERS ROW */}
      <div className="filter-bar" style={{ borderBottom: 'none', marginBottom: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
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
          placeholder="Tìm theo tên / nội dung..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ flex: 1, minWidth: '220px' }}
        />
      </div>

      {/* TABS */}
      <div className="tab-bar" style={{ marginBottom: '24px' }}>
        {[
          { key: 'reviews', label: 'Đánh giá sao', count: reviews.length },
          { key: 'comments', label: 'Bình luận', count: comments.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
            <span className="badge badge-gray">{tab.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '600' }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : activeTab === 'reviews' ? (
        // ===== REVIEWS TAB =====
        filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</p>
            <h4>Chưa có đánh giá nào</h4>
            <p>Phim "{selectedMovie?.title}" chưa có lượt đánh giá nào từ khán giả.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
            {filteredReviews.map(review => (
              <div key={review.id} className="card card-pad">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-warning), #ef4444)' }}>
                      {(review.userName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{review.userName || 'Ẩn danh'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(review.createdAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Xóa
                  </button>
                </div>
                {renderStars(review.rating)}
                {review.comment && (
                  <p style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-warning)' }}>
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
          <div className="empty-state">
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>💬</p>
            <h4>Chưa có bình luận nào</h4>
            <p>Phim "{selectedMovie?.title}" chưa có bình luận nào từ người xem.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredComments.map(comment => (
              <div key={comment.id} className="card card-pad">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)' }}>
                      {(comment.userName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{comment.userName || 'Ẩn danh'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Xóa
                  </button>
                </div>
                <p style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
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
                          className="btn btn-danger btn-sm"
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
