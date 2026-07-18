import React, { useState, useContext, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import AuthContext from '../../context/AuthContext';
import './SignUp.css';
import { applySEO } from '../../utils/seo';
import { toast } from '../../utils/toast';

const CAR_INTERESTS = [
  'Muscle Cars', 'JDM Imports', 'Classic Cars', 'European', 'Trucks & SUVs',
  'Motorcycles', 'EV & Hybrid', 'Track Racing', 'Drag Racing', 'Drifting',
  'Off-Road', 'Restoration', 'Custom Builds', 'Hot Wheels', 'Lowriders',
];

const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '#ccc' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too short', color: '#dc2626' },
    { label: 'Weak', color: '#dc2626' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#3b82f6' },
    { label: 'Strong', color: '#16a34a' },
    { label: 'Very Strong', color: '#16a34a' },
  ];
  // eslint-disable-next-line security/detect-object-injection
  const level = levels[score] || levels[0];
  return { score, ...level };
};

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    displayTag: '',
    gender: '',
    city: '',
    state: '',
    bio: '',
    carInterests: [],
    profileImage: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    return applySEO({
      title: 'Create Account — CarMatch',
      description: 'Join CarMatch to bookmark events, participate in forums, and connect with other car enthusiasts.',
      canonical: 'https://bradleymatera.github.io/car-match/#/signup'
    });
  }, []);

  const pwStrength = useMemo(() => passwordStrength(formData.password), [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      carInterests: prev.carInterests.includes(interest)
        ? prev.carInterests.filter(i => i !== interest)
        : [...prev.carInterests, interest],
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.info("Image must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setFormData(prev => ({ ...prev, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    const { username, password, confirmPassword, name } = formData;
    if (!name.trim()) return "Please enter your name.";
    if (!username.trim()) return "Please enter your email.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) return "Please enter a valid email address.";
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password.length < 8) return "Password must be at least 8 characters long.";
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const validateStep2 = () => {
    const { displayTag, gender, city, state } = formData;
    if (!displayTag.trim()) return "Display tag is required.";
    const tagRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!tagRegex.test(displayTag)) return "Display Tag must be 3-15 characters: letters, numbers, and underscores only.";
    if (!gender) return "Please select a gender option.";
    if (!city.trim()) return "City is required.";
    if (!state.trim()) return "State is required.";
    const stateRegex = /^[A-Z]{2}$/;
    if (!stateRegex.test(state.toUpperCase())) return "Please enter a valid 2-letter state abbreviation.";
    return null;
  };

  const nextStep = () => {
    setError(null);
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const registrationData = {
      username: formData.username,
      password: formData.password,
      name: formData.name,
      displayTag: formData.displayTag,
      gender: formData.gender,
      city: formData.city,
      state: formData.state.toUpperCase(),
      bio: formData.bio || undefined,
      carInterests: formData.carInterests,
      profileImage: formData.profileImage || undefined,
    };

    try {
      await api.registerUser(registrationData);
      toast.success('Account created! Logging you in...');
      // Auto-login after registration
      try {
        await auth.login(formData.username, formData.password);
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg" />
      <div className="auth-card signup-card">
        <div className="auth-logo">CarMatch</div>
        <h2>Create Your Account</h2>
        <p className="auth-subtitle">Join the community of car enthusiasts.</p>

        {/* Step indicator */}
        <div className="signup-steps-indicator">
          <div className={`signup-step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>1</div>
          <div className={`signup-step-line ${step > 1 ? 'done' : ''}`} />
          <div className={`signup-step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>2</div>
          <div className={`signup-step-line ${step > 2 ? 'done' : ''}`} />
          <div className={`signup-step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {/* Step 1: Account credentials */}
        {step === 1 && (
          <div className="signup-step-content">
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" disabled={loading} autoFocus />
            </div>
            <div className="auth-field">
              <label>Email Address</label>
              <input type="email" name="username" value={formData.username} onChange={handleChange} placeholder="you@email.com" disabled={loading} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <div className="auth-password-wrapper">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" disabled={loading} />
                <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(s => !s)} tabIndex={-1}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.password && (
                <div className="pw-strength-bar">
                  <div className="pw-strength-fill" style={{ width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                  <span className="pw-strength-label" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
              )}
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" disabled={loading} />
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <span className="pw-match-indicator">✓ Passwords match</span>
              )}
            </div>
            <button type="button" className="auth-submit-btn" onClick={nextStep}>Continue →</button>
          </div>
        )}

        {/* Step 2: Profile details */}
        {step === 2 && (
          <div className="signup-step-content">
            <div className="auth-field">
              <label>Display Tag</label>
              <input type="text" name="displayTag" value={formData.displayTag} onChange={handleChange} placeholder="AJ_Rides" disabled={loading} />
              <span className="auth-field-hint">3-15 characters: letters, numbers, underscores</span>
            </div>
            <div className="auth-field">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} disabled={loading}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="auth-field-row">
              <div className="auth-field">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Rockford" disabled={loading} />
              </div>
              <div className="auth-field">
                <label>State</label>
                <input type="text" name="state" value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value.toUpperCase() }))} placeholder="IL" maxLength={2} disabled={loading} />
              </div>
            </div>
            <div className="auth-field">
              <label>Bio (optional)</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell the community about yourself..." rows={2} maxLength={500} disabled={loading} />
            </div>
            <div className="signup-step-actions">
              <button type="button" className="auth-back-btn" onClick={prevStep}>← Back</button>
              <button type="button" className="auth-submit-btn" onClick={nextStep}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Car interests + photo */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="signup-step-content">
            <div className="auth-field">
              <label>Profile Photo (optional)</label>
              <div className="signup-photo-upload">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile preview" className="signup-photo-preview" />
                ) : (
                  <div className="signup-photo-placeholder">📷</div>
                )}
                <label className="signup-photo-btn">
                  {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="auth-field">
              <label>Car Interests (select all that apply)</label>
              <div className="signup-interests-grid">
                {CAR_INTERESTS.map(interest => (
                  <button
                    type="button"
                    key={interest}
                    className={`signup-interest-chip ${formData.carInterests.includes(interest) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="signup-step-actions">
              <button type="button" className="auth-back-btn" onClick={prevStep}>← Back</button>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-divider"><span>or</span></div>
        <div className="auth-switch">
          Already have an account? <Link to="/login" className="auth-switch-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
