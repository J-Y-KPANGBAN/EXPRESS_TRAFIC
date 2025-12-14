// frontend/src/Components/UI/Sidebar/Sidebar.js
import React from "react";
import './Sidebar.css';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  items, 
  currentPath, 
  onNavigate 
}) => {
  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* Bouton de toggle */}
      <div className="sidebar-toggle" onClick={onToggle}>
        <span className="toggle-icon">{isOpen ? '◀' : '▶'}</span>
      </div>

      {/* Contenu de la sidebar */}
      <div className="sidebar-content">
        {/* Logo/Header */}
        <div className="sidebar-header">
          {isOpen && (
            <div className="sidebar-logo">
              <h3>🛡️ Admin Panel</h3>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {items.map((item, index) => {
            const isActive = currentPath === item.path || 
                            currentPath.startsWith(item.path + '/');
            
            return (
              <div
                key={index}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {isOpen && (
                  <span className="nav-label">{item.label}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer de la sidebar */}
        {isOpen && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <div className="user-name">Administrateur</div>
                <div className="user-role">Super Admin</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;