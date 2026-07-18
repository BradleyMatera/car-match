import React, { useState, useEffect, useCallback, useContext } from 'react';
import './Marketplace.css';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { applySEO } from '../../utils/seo';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'parts', label: 'Parts' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'tools', label: 'Tools' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: '', label: 'Any Condition' },
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'for-parts', label: 'For Parts' },
];

const Marketplace = () => {
  const { currentUser, token } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    applySEO({
      title: 'Marketplace',
      description: 'Buy and sell car parts, vehicles, tools, and automotive services. Browse classifieds from enthusiasts and businesses.',
      canonical: 'https://bradleymatera.github.io/car-match/#/marketplace'
    });
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.q = search;
      if (category) params.category = category;
      if (condition) params.condition = condition;
      const result = await api.getListings(params);
      setListings(result.listings || result || []);
    } catch (err) {
      setError(err.message || 'Failed to load listings.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, condition]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleMarkSold = async (id) => {
    if (!token) return;
    try {
      await api.markListingSold(token, id);
      toast.success('Listing marked as sold!');
      fetchListings();
      if (selectedListing) setSelectedListing(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update listing.');
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await api.deleteListing(token, id);
      toast.success('Listing removed.');
      fetchListings();
      if (selectedListing) setSelectedListing(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove listing.');
    }
  };

  if (selectedListing) {
    const isOwner = currentUser && (selectedListing.sellerId === currentUser.id || selectedListing.sellerId === currentUser._id);
    return (
      <div className="mp-container">
        <button className="btn mp-back" onClick={() => setSelectedListing(null)}>← Back to Marketplace</button>
        <div className="mp-detail">
          {selectedListing.photos && selectedListing.photos.length > 0 && (
            <div className="mp-detail-photos">
              {selectedListing.photos.map((p, i) => <img key={i} src={p} alt={selectedListing.title} className="mp-detail-photo" onError={(e) => e.target.style.display = 'none'} />)}
            </div>
          )}
          <div className="mp-detail-header">
            <h2>{selectedListing.title}</h2>
            {selectedListing.price != null && <span className="mp-price">${selectedListing.price.toLocaleString()}</span>}
          </div>
          <div className="mp-detail-meta">
            <span className="mp-badge mp-cat-badge">{selectedListing.category}</span>
            {selectedListing.condition && <span className="mp-badge mp-cond-badge">{selectedListing.condition}</span>}
            {selectedListing.status === 'sold' && <span className="mp-badge mp-sold-badge">SOLD</span>}
            <span className="mp-seller">by {selectedListing.sellerUsername} ({selectedListing.sellerType})</span>
            <span className="mp-location">{selectedListing.location?.city}{selectedListing.location?.state ? ', ' + selectedListing.location.state : ''}</span>
          </div>
          <p className="mp-detail-desc">{selectedListing.description}</p>
          {selectedListing.contactPhone && <p className="mp-contact">📞 {selectedListing.contactPhone}</p>}
          {selectedListing.contactEmail && <p className="mp-contact">✉️ <a href={`mailto:${selectedListing.contactEmail}`}>{selectedListing.contactEmail}</a></p>}
          {isOwner && selectedListing.status === 'active' && (
            <div className="mp-owner-actions">
              <button className="btn btn-primary" onClick={() => handleMarkSold(selectedListing.id || selectedListing._id)}>Mark as Sold</button>
              <button className="btn btn-danger" onClick={() => handleDelete(selectedListing.id || selectedListing._id)}>Remove Listing</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return <CreateListingForm currentUser={currentUser} token={token} onClose={() => setShowCreateForm(false)} onCreated={() => { setShowCreateForm(false); fetchListings(); }} />;
  }

  return (
    <div className="mp-container">
      <div className="mp-hero">
        <h2>Marketplace</h2>
        <p>Buy and sell parts, vehicles, tools, and services.</p>
        {currentUser && <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>Post a Listing</button>}
      </div>

      <div className="mp-filters">
        <input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="mp-search-input" />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={condition} onChange={e => setCondition(e.target.value)}>
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading && <div className="mp-skeleton-grid">
        {[1,2,3,4].map(i => <div key={i} className="mp-skeleton-card"><div className="skeleton-bar" style={{width:'100%',height:'120px'}} /><div className="skeleton-bar" style={{width:'60%',height:'16px',marginTop:'8px'}} /><div className="skeleton-bar" style={{width:'30%',height:'14px',marginTop:'4px'}} /></div>)}
      </div>}

      {error && <div className="mp-error">{error}</div>}

      {!loading && !error && listings.length === 0 && (
        <div className="mp-empty-state">
          <div className="mp-empty-icon">📦</div>
          <h3>No listings found</h3>
          <p>{currentUser ? 'Post the first listing!' : 'Log in to post a listing.'}</p>
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="mp-grid">
          {listings.map(item => (
            <div key={item.id || item._id} className={`mp-card ${item.status === 'sold' ? 'mp-card-sold' : ''}`} onClick={() => setSelectedListing(item)}>
              <div className="mp-card-image">
                {item.photos && item.photos[0] ? <img src={item.photos[0]} alt={item.title} onError={(e) => e.target.style.display = 'none'} /> : <div className="mp-card-no-image">🚗</div>}
                {item.status === 'sold' && <div className="mp-sold-overlay">SOLD</div>}
              </div>
              <div className="mp-card-body">
                <h3>{item.title}</h3>
                {item.price != null && <span className="mp-card-price">${item.price.toLocaleString()}</span>}
                <div className="mp-card-meta">
                  <span className="mp-badge-small">{item.category}</span>
                  {item.condition && <span className="mp-badge-small">{item.condition}</span>}
                </div>
                <p className="mp-card-location">{item.location?.city ? `${item.location.city}, ${item.location.state || ''}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateListingForm = ({ currentUser, token, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'parts', price: '', condition: 'used',
    city: '', state: '', contactPhone: '', contactEmail: '', sellerType: 'individual'
  });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.category) { toast.info('Title, description, and category are required.'); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        price: form.price ? parseFloat(form.price) : undefined,
        location: { city: form.city, state: form.state },
        photos,
      };
      delete data.city; delete data.state;
      await api.createListing(token, data);
      toast.success('Listing posted!');
      onCreated();
    } catch (err) {
      toast.error(err.message || 'Failed to create listing.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result].slice(0, 5));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="mp-container">
      <button className="btn mp-back" onClick={onClose}>← Cancel</button>
      <div className="mp-form">
        <h2>Post a Listing</h2>
        <div className="mp-form-grid">
          <div className="mp-form-item mp-form-full"><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="BBS RS Wheels — Set of 4" /></div>
          <div className="mp-form-item mp-form-full"><label>Description *</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe what you're selling..." maxLength={2000} /></div>
          <div className="mp-form-item"><label>Category *</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div className="mp-form-item"><label>Condition</label><select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>{CONDITIONS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div className="mp-form-item"><label>Price ($)</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1200" /></div>
          <div className="mp-form-item"><label>Seller Type</label><select value={form.sellerType} onChange={e => setForm(f => ({ ...f, sellerType: e.target.value }))}><option value="individual">Individual</option><option value="business">Business</option></select></div>
          <div className="mp-form-item"><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Rockford" /></div>
          <div className="mp-form-item"><label>State</label><input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))} placeholder="IL" maxLength={2} /></div>
          <div className="mp-form-item"><label>Contact Phone</label><input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="(815) 555-0100" /></div>
          <div className="mp-form-item"><label>Contact Email</label><input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="you@email.com" /></div>
          <div className="mp-form-item mp-form-full"><label>Photos (up to 5)</label><input type="file" accept="image/*" multiple onChange={handlePhotoUpload} /></div>
          {photos.length > 0 && <div className="mp-form-full mp-photo-preview-row">{photos.map((p, i) => <img key={i} src={p} alt={`preview ${i+1}`} className="mp-photo-preview" />)}</div>}
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Posting...' : 'Post Listing'}</button>
      </div>
    </div>
  );
};

export default Marketplace;
