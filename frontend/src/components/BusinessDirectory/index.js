import React, { useState, useEffect, useCallback, useContext } from 'react';
import './BusinessDirectory.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { applySEO } from '../../utils/seo';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'repair-shop', label: 'Repair Shop' },
  { value: 'parts-store', label: 'Parts Store' },
  { value: 'performance-shop', label: 'Performance Shop' },
  { value: 'fabrication', label: 'Fabrication / Custom' },
  { value: 'roadside-service', label: 'Roadside Service' },
  { value: 'detailing', label: 'Detailing' },
  { value: 'towing', label: 'Towing' },
  { value: 'general-automotive', label: 'General Automotive' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

const StarDisplay = ({ rating, count }) => {
  const n = parseFloat(rating) || 0;
  return (
    <span className="stars-display">
      <span className="stars-filled">{'★'.repeat(Math.round(n))}</span>
      <span className="stars-empty">{'☆'.repeat(5 - Math.round(n))}</span>
      {count != null && <span className="review-count">({count})</span>}
    </span>
  );
};

const BusinessDirectory = () => {
  const { currentUser, token } = useContext(AuthContext);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });

  useEffect(() => {
    applySEO({
      title: 'Business Directory',
      description: 'Find automotive businesses near you — repair shops, parts stores, performance shops, fabrication, roadside service, and more.',
      canonical: 'https://bradleymatera.github.io/car-match/#/businesses'
    });
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (stateFilter) params.state = stateFilter;
      const result = await api.getBusinesses(params);
      setBusinesses(result.data || result.businesses || result || []);
    } catch (err) {
      setError(err.message || 'Failed to load businesses.');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, stateFilter]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const openBusiness = async (biz) => {
    setSelectedBusiness(biz);
    setLoadingReviews(true);
    try {
      const result = await api.getReviews(biz.id || biz._id);
      setReviews(result.data || result.reviews || result || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddReview = async () => {
    if (!token) { toast.info('Please log in to leave a review.'); return; }
    if (!newReview.text.trim()) { toast.info('Please write a review.'); return; }
    try {
      await api.addReview(token, selectedBusiness.id || selectedBusiness._id, newReview.rating, newReview.text);
      toast.success('Review posted!');
      setNewReview({ rating: 5, text: '' });
      const result = await api.getReviews(selectedBusiness.id || selectedBusiness._id);
      setReviews(result.data || result.reviews || result || []);
      const updated = await api.getBusiness(selectedBusiness.id || selectedBusiness._id);
      setSelectedBusiness(updated.data || updated.business || updated);
    } catch (err) {
      toast.error(err.message || 'Failed to post review.');
    }
  };

  if (selectedBusiness) {
    return (
      <div className="bd-container">
        <button className="btn bd-back" onClick={() => setSelectedBusiness(null)}>← Back to Directory</button>
        <div className="bd-detail">
          <div className="bd-detail-header">
            {selectedBusiness.logo && <img src={selectedBusiness.logo} alt={selectedBusiness.businessName} className="bd-detail-logo" onError={(e) => e.target.style.display = 'none'} />}
            <div className="bd-detail-title">
              <h2>{selectedBusiness.businessName}</h2>
              <span className="bd-category-badge">{CATEGORY_LABELS[selectedBusiness.category] || selectedBusiness.category}</span>
              {selectedBusiness.verified && <span className="bd-verified">✓ Verified</span>}
              <StarDisplay rating={selectedBusiness.rating} count={selectedBusiness.reviewCount} />
            </div>
          </div>

          {selectedBusiness.description && <p className="bd-detail-desc">{selectedBusiness.description}</p>}

          {selectedBusiness.services && selectedBusiness.services.length > 0 && (
            <div className="bd-section">
              <h4>Services</h4>
              <div className="bd-service-tags">
                {selectedBusiness.services.map((s, i) => <span key={i} className="bd-service-tag">{s}</span>)}
              </div>
            </div>
          )}

          <div className="bd-contact-grid">
            {selectedBusiness.phone && <div className="bd-contact-item"><span className="bd-contact-label">Phone</span><a href={`tel:${selectedBusiness.phone}`}>{selectedBusiness.phone}</a></div>}
            {selectedBusiness.email && <div className="bd-contact-item"><span className="bd-contact-label">Email</span><a href={`mailto:${selectedBusiness.email}`}>{selectedBusiness.email}</a></div>}
            {selectedBusiness.website && <div className="bd-contact-item"><span className="bd-contact-label">Website</span><a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer">{selectedBusiness.website}</a></div>}
            {selectedBusiness.hours && <div className="bd-contact-item"><span className="bd-contact-label">Hours</span><span>{selectedBusiness.hours}</span></div>}
            {selectedBusiness.city && <div className="bd-contact-item"><span className="bd-contact-label">Location</span><span>{selectedBusiness.city}{selectedBusiness.state ? ', ' + selectedBusiness.state : ''}</span></div>}
          </div>

          {selectedBusiness.certifications && selectedBusiness.certifications.length > 0 && (
            <div className="bd-section">
              <h4>Certifications</h4>
              <div className="bd-cert-tags">
                {selectedBusiness.certifications.map((c, i) => <span key={i} className="bd-cert-tag">{c}</span>)}
              </div>
            </div>
          )}

          {selectedBusiness.photos && selectedBusiness.photos.length > 0 && (
            <div className="bd-section">
              <h4>Photos</h4>
              <div className="bd-photos-grid">
                {selectedBusiness.photos.map((p, i) => <img key={i} src={p} alt={`${selectedBusiness.businessName} ${i+1}`} className="bd-photo" onError={(e) => e.target.style.display = 'none'} />)}
              </div>
            </div>
          )}

          <div className="bd-reviews-section">
            <h4>Reviews ({reviews.length})</h4>
            {loadingReviews && <p className="bd-loading">Loading reviews...</p>}
            {!loadingReviews && reviews.length === 0 && <p className="bd-empty">No reviews yet. Be the first to review!</p>}
            {reviews.map((r, i) => (
              <div key={i} className="bd-review-card">
                <div className="bd-review-header">
                  <span className="bd-reviewer">{r.reviewerUsername}</span>
                  <StarDisplay rating={r.rating} />
                </div>
                <p className="bd-review-text">{r.text}</p>
              </div>
            ))}
            {token && (
              <div className="bd-review-form">
                <h5>Write a Review</h5>
                <div className="bd-rating-select">
                  <label>Rating: </label>
                  <select value={newReview.rating} onChange={e => setNewReview(r => ({ ...r, rating: parseInt(e.target.value) }))}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
                <textarea placeholder="Share your experience..." value={newReview.text} onChange={e => setNewReview(r => ({ ...r, text: e.target.value }))} rows={3} maxLength={1000} />
                <button className="btn btn-primary" onClick={handleAddReview}>Post Review</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return <CreateBusinessForm currentUser={currentUser} token={token} onClose={() => setShowCreateForm(false)} onCreated={() => { setShowCreateForm(false); fetchBusinesses(); }} />;
  }

  return (
    <div className="bd-container">
      <div className="bd-hero">
        <h2>Automotive Business Directory</h2>
        <p>Find trusted repair shops, parts stores, performance shops, and more — or list your own business.</p>
        {currentUser && <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>List Your Business</button>}
      </div>

      <div className="bd-filters">
        <input type="text" placeholder="Search by name, service, or keyword..." value={search} onChange={e => setSearch(e.target.value)} className="bd-search-input" />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="text" placeholder="State (e.g. IL)" value={stateFilter} onChange={e => setStateFilter(e.target.value.toUpperCase())} maxLength={2} className="bd-state-input" />
      </div>

      {loading && <div className="bd-skeleton-grid">
        {[1,2,3].map(i => <div key={i} className="bd-skeleton-card"><div className="skeleton-bar" style={{width:'60%',height:'20px'}} /><div className="skeleton-bar" style={{width:'40%',height:'14px',marginTop:'8px'}} /><div className="skeleton-bar" style={{width:'80%',height:'12px',marginTop:'12px'}} /></div>)}
      </div>}

      {error && <div className="bd-error">{error}</div>}

      {!loading && !error && businesses.length === 0 && (
        <div className="bd-empty-state">
          <div className="bd-empty-icon">🏪</div>
          <h3>No businesses found</h3>
          <p>{currentUser ? 'Be the first to list your business!' : 'Log in to list your business.'}</p>
        </div>
      )}

      {!loading && !error && businesses.length > 0 && (
        <div className="bd-grid">
          {businesses.map(biz => (
            <div key={biz.id || biz._id} className="bd-card" onClick={() => openBusiness(biz)}>
              <div className="bd-card-header">
                {biz.logo ? <img src={biz.logo} alt={biz.businessName} className="bd-card-logo" onError={(e) => e.target.style.display = 'none'} /> : <div className="bd-card-logo-placeholder">🔧</div>}
                <div>
                  <h3>{biz.businessName}</h3>
                  <span className="bd-card-category">{CATEGORY_LABELS[biz.category] || biz.category}</span>
                </div>
              </div>
              <p className="bd-card-desc">{biz.description ? (biz.description.length > 100 ? biz.description.slice(0, 100) + '...' : biz.description) : 'No description provided.'}</p>
              <div className="bd-card-footer">
                <StarDisplay rating={biz.rating} count={biz.reviewCount} />
                <span className="bd-card-location">{biz.city ? `${biz.city}, ${biz.state || ''}` : biz.state || 'Location not set'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateBusinessForm = ({ currentUser, token, onClose, onCreated }) => {
  const [form, setForm] = useState({
    businessName: '', category: 'repair-shop', description: '', services: '',
    address: '', city: '', state: '', zipCode: '', phone: '', email: '', website: '',
    hours: '', certifications: '', logo: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.businessName || !form.category) { toast.info('Business name and category are required.'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      await api.createBusiness(token, data);
      toast.success('Business listed successfully!');
      onCreated();
    } catch (err) {
      toast.error(err.message || 'Failed to create business listing.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="bd-container">
      <button className="btn bd-back" onClick={onClose}>← Cancel</button>
      <div className="bd-form">
        <h2>List Your Business</h2>
        <p className="bd-form-desc">Reach car enthusiasts in your area who need your services.</p>

        <div className="bd-form-grid">
          <div className="bd-form-item"><label>Business Name *</label><input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} placeholder="BOSSEN INC" /></div>
          <div className="bd-form-item"><label>Category *</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div className="bd-form-item bd-form-full"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Tell customers what you do..." maxLength={1000} /></div>
          <div className="bd-form-item bd-form-full"><label>Services (comma-separated)</label><input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Brake repair, Suspension, Electrical, DOT inspections" /></div>
          <div className="bd-form-item"><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Rockford" /></div>
          <div className="bd-form-item"><label>State</label><input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} placeholder="IL" maxLength={2} /></div>
          <div className="bd-form-item"><label>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(815) 555-0100" /></div>
          <div className="bd-form-item"><label>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@yourbusiness.com" /></div>
          <div className="bd-form-item"><label>Website</label><input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yourbusiness.com" /></div>
          <div className="bd-form-item"><label>Hours</label><input value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="Mon-Fri 8am-6pm" /></div>
          <div className="bd-form-item bd-form-full"><label>Certifications (comma-separated)</label><input value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} placeholder="ASE Certified, FMCSA Registered, DOT Approved" /></div>
          <div className="bd-form-item bd-form-full"><label>Logo</label><input type="file" accept="image/*" onChange={handleLogoUpload} /></div>
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'List My Business'}</button>
      </div>
    </div>
  );
};

export default BusinessDirectory;
