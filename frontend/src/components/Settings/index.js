import React from 'react';
import Section from '../Section';
import Grid from '../Grid';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <Section>
        <header className="settings-header">
          <h1>Settings</h1>
          <p className="page-description">
            Manage your account settings and preferences
          </p>
        </header>
      </Section>
      
      <Section>
        <Grid cols={1} mdCols={2} gap="lg">
          <div className="settings-section">
            <h2>🔐 Account Information</h2>
            <p>Manage your account details like name, email, and phone number.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Edit Profile</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>🔧 Profile Preferences</h2>
            <p>Customize how your profile appears and interacts on the platform.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Customize</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>📢 Notifications</h2>
            <p>Control what notifications you receive and how.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Manage</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>🔒 Privacy & Security</h2>
            <p>Manage your account's privacy and security settings.</p>
            <div className="settings-actions">
              <button className="password-button">Change Password</button>
              <button className="mfa-button">Enable 2FA</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>💳 Payments & Subscriptions</h2>
            <p>View and manage your subscription and payment details.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Manage</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>🛎️ Event & Match Preferences</h2>
            <p>Set your preferences for events and matches.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Configure</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>🖥️ Display & Accessibility</h2>
            <p>Adjust display and accessibility settings for a better experience.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Customize</button>
            </div>
          </div>
          
          <div className="settings-section">
            <h2>🔄 App Connections</h2>
            <p>Manage connected accounts and integrations.</p>
            <div className="settings-actions">
              <button className="btn btn-primary">Manage</button>
            </div>
          </div>
        </Grid>
      </Section>
      
      <Section background="danger">
        <div className="settings-section danger-zone">
          <h2>⚠️ Danger Zone</h2>
          <p>Permanent actions that can't be undone.</p>
          <div className="settings-actions">
            <button className="delete-button">Delete Account</button>
          </div>
          <p className="warning">This action cannot be undone. All your data will be permanently deleted.</p>
        </div>
      </Section>
    </div>
  );
};

export default Settings;
