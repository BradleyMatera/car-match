import React, { useState } from 'react';
import './VehicleLookup.css';
import api from '../../api/client';
import { toast } from '../../utils/toast';

const VehicleLookup = () => {
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [activeTab, setActiveTab] = useState('vin');
  const [loading, setLoading] = useState(false);
  const [decoded, setDecoded] = useState(null);
  const [recalls, setRecalls] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [complaints, setComplaints] = useState(null);

  const handleVinDecode = async () => {
    if (!vin || vin.length !== 17) {
      toast.error('Enter a valid 17-character VIN.');
      return;
    }
    setLoading(true);
    setDecoded(null);
    try {
      const result = await api.decodeVin(vin.toUpperCase());
      setDecoded(result.decoded);
      if (result.decoded?.make && result.decoded?.model && result.decoded?.year) {
        setMake(result.decoded.make);
        setModel(result.decoded.model);
        setYear(result.decoded.modelYear || result.decoded.year);
      }
      toast.success('VIN decoded successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to decode VIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalls = async () => {
    if (!make || !model || !year) {
      toast.info('Enter make, model, and year.');
      return;
    }
    setLoading(true);
    setRecalls(null);
    try {
      const result = await api.getRecalls(make, model, year);
      setRecalls(result);
      toast.success(`Found ${result.Count || 0} recall(s).`);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch recalls.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatings = async () => {
    if (!make || !model || !year) {
      toast.info('Enter make, model, and year.');
      return;
    }
    setLoading(true);
    setRatings(null);
    try {
      const result = await api.getSafetyRatings(make, model, year);
      setRatings(result);
      toast.success('Safety ratings retrieved.');
    } catch (err) {
      if (err.message?.includes('404')) {
        toast.info('No crash test ratings available for this vehicle.');
      } else {
        toast.error(err.message || 'Failed to fetch safety ratings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComplaints = async () => {
    if (!make || !model || !year) {
      toast.info('Enter make, model, and year.');
      return;
    }
    setLoading(true);
    setComplaints(null);
    try {
      const result = await api.getComplaints(make, model, year);
      setComplaints(result.complaints || []);
      toast.success(`Found ${result.count || 0} complaint(s).`);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch complaints.');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating }) => {
    const n = parseInt(rating, 10);
    if (isNaN(n)) return <span className="rating-na">N/A</span>;
    return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
  };

  return (
    <div className="vehicle-lookup-container">
      <div className="vl-tabs">
        <button className={`vl-tab ${activeTab === 'vin' ? 'active' : ''}`} onClick={() => setActiveTab('vin')}>VIN Decoder</button>
        <button className={`vl-tab ${activeTab === 'recalls' ? 'active' : ''}`} onClick={() => setActiveTab('recalls')}>Recalls</button>
        <button className={`vl-tab ${activeTab === 'safety' ? 'active' : ''}`} onClick={() => setActiveTab('safety')}>Safety Ratings</button>
        <button className={`vl-tab ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>Complaints</button>
      </div>

      {activeTab === 'vin' && (
        <div className="vl-section">
          <h3>Decode a VIN</h3>
          <p className="vl-desc">Enter any 17-character VIN to get full vehicle specifications from the NHTSA database.</p>
          <div className="vl-input-row">
            <input
              type="text"
              placeholder="1HGCM82633A123456"
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              className="vl-vin-input"
            />
            <button className="btn btn-primary" onClick={handleVinDecode} disabled={loading}>
              {loading ? 'Decoding...' : 'Decode'}
            </button>
          </div>
          {decoded && (
            <div className="vl-results">
              <div className="vl-result-grid">
                <div className="vl-result-item"><span className="vl-label">Make</span><span className="vl-value">{decoded.make || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Model</span><span className="vl-value">{decoded.model || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Year</span><span className="vl-value">{decoded.modelYear || decoded.year || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Body Class</span><span className="vl-value">{decoded.bodyClass || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Engine</span><span className="vl-value">{decoded.engineModel || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Displacement</span><span className="vl-value">{decoded.displacementL ? decoded.displacementL + 'L' : '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Fuel Type</span><span className="vl-value">{decoded.fuelType || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Transmission</span><span className="vl-value">{decoded.transmissionStyle || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Drivetrain</span><span className="vl-value">{decoded.drivetrain || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Manufacturer</span><span className="vl-value">{decoded.manufacturer || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Plant</span><span className="vl-value">{decoded.plant || '—'}</span></div>
                <div className="vl-result-item"><span className="vl-label">Vehicle Type</span><span className="vl-value">{decoded.vehicleType || '—'}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'vin' && (
        <div className="vl-section">
          <div className="vl-vehicle-form">
            <input placeholder="Make (e.g. Honda)" value={make} onChange={e => setMake(e.target.value)} />
            <input placeholder="Model (e.g. Civic)" value={model} onChange={e => setModel(e.target.value)} />
            <input placeholder="Year (e.g. 2020)" value={year} onChange={e => setYear(e.target.value)} maxLength={4} />
          </div>

          {activeTab === 'recalls' && (
            <div className="vl-action-area">
              <button className="btn btn-primary" onClick={handleRecalls} disabled={loading}>
                {loading ? 'Searching...' : 'Check Recalls'}
              </button>
              {recalls && (
                <div className="vl-results">
                  {recalls.Count === 0 ? (
                    <p className="vl-empty">No recalls found for this vehicle. That's good news!</p>
                  ) : (
                    <>
                      <p className="vl-count">{recalls.Count} recall(s) found:</p>
                      {(recalls.results || []).map((r, i) => (
                        <div key={i} className="recall-card">
                          <div className="recall-header">
                            <span className="recall-component">{r.Component}</span>
                            <span className="recall-date">{r.ReportReceivedDate}</span>
                          </div>
                          <p className="recall-summary">{r.Summary}</p>
                          {r.Consequence && <p className="recall-consequence"><strong>Consequence:</strong> {r.Consequence}</p>}
                          {r.Remedy && <p className="recall-remedy"><strong>Remedy:</strong> {r.Remedy}</p>}
                          <span className="recall-campaign">NHTSA #: {r.NHTSACampaignNumber}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="vl-action-area">
              <button className="btn btn-primary" onClick={handleRatings} disabled={loading}>
                {loading ? 'Searching...' : 'Get Safety Ratings'}
              </button>
              {ratings && (
                <div className="vl-results">
                  <h4>{ratings.vehicleDescription}</h4>
                  <div className="ratings-grid">
                    <div className="rating-item"><span className="rating-label">Overall</span><StarRating rating={ratings.overallRating} /></div>
                    <div className="rating-item"><span className="rating-label">Front Crash</span><StarRating rating={ratings.overallFrontCrashRating} /></div>
                    <div className="rating-item"><span className="rating-label">Side Crash</span><StarRating rating={ratings.overallSideCrashRating} /></div>
                    <div className="rating-item"><span className="rating-label">Rollover</span><StarRating rating={ratings.rolloverRating} /></div>
                  </div>
                  <div className="ratings-meta">
                    <span>Recalls: {ratings.recallsCount || 0}</span>
                    <span>Complaints: {ratings.complaintsCount || 0}</span>
                    <span>Investigations: {ratings.investigationCount || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="vl-action-area">
              <button className="btn btn-primary" onClick={handleComplaints} disabled={loading}>
                {loading ? 'Searching...' : 'Get Complaints'}
              </button>
              {complaints && (
                <div className="vl-results">
                  {complaints.length === 0 ? (
                    <p className="vl-empty">No complaints filed for this vehicle.</p>
                  ) : (
                    <>
                      <p className="vl-count">{complaints.length} complaint(s) shown:</p>
                      {complaints.map((c, i) => (
                        <div key={i} className="complaint-card">
                          <div className="complaint-header">
                            <span className="complaint-component">{c.components}</span>
                            <span className="complaint-date">{c.dateOfIncident}</span>
                          </div>
                          <p className="complaint-summary">{c.summary}</p>
                          <div className="complaint-flags">
                            {c.crash && <span className="flag flag-crash">Crash</span>}
                            {c.fire && <span className="flag flag-fire">Fire</span>}
                            {c.numberOfInjuries > 0 && <span className="flag flag-injury">{c.numberOfInjuries} injury(ies)</span>}
                            {c.numberOfDeaths > 0 && <span className="flag flag-death">{c.numberOfDeaths} death(s)</span>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleLookup;
