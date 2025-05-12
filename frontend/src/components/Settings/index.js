import React from 'react';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <section className="settings-section">
        <h2>🔐 Account Information</h2>
        <p>Manage your account details like name, email, and phone number.</p>
      </section>
      <section className="settings-section">
        <h2>🔧 Profile Preferences</h2>
        <p>Customize how your profile appears and interacts on the platform.</p>
      </section>
      <section className="settings-section">
        <h2>📢 Notifications</h2>
        <p>Control what notifications you receive and how.</p>
      </section>
      <section className="settings-section">
        <h2>🔒 Privacy & Security</h2>
        <p>Manage your account's privacy and security settings.</p>
      </section>
      <section className="settings-section">
        <h2>💳 Payments & Subscriptions</h2>
        <p>View and manage your subscription and payment details.</p>
      </section>
      <section className="settings-section">
        <h2>🛎️ Event & Match Preferences</h2>
        <p>Set your preferences for events and matches.</p>
      </section>
      <section className="settings-section">
        <h2>🖥️ Display & Accessibility</h2>
        <p>Adjust display and accessibility settings for a better experience.</p>
      </section>
      <section className="settings-section">
        <h2>🔄 App Connections</h2>
        <p>Manage connected accounts and integrations.</p>
      </section>
    </div>
  );
};

export default Settings;
