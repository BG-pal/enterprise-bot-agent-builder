// Global Left Sidebar Component
// Enterprise Bot logo, Home, Assistants, Agents (active), Settings, User profile

(function (global) {
  function Sidebar() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;

    const isAgentsActive = state.currentView === 'dashboard' || state.currentView === 'create' || state.currentView === 'configure';

    return html`
      <aside className="sidebar" aria-label="Main Navigation">
        <div className="sidebar-header">
          <div className="logo-badge">
            ${renderIcon('bot', { size: 20, color: '#FFFFFF' })}
          </div>
          <div className="logo-text-group">
            <div className="logo-title">Enterprise Bot</div>
            <div className="logo-subtitle">AI Platform</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className="nav-item" 
            onClick=${() => actions.addToast('Home dashboard is in demo view. Navigating to Agents.', 'info')}
            title="Home"
          >
            ${renderIcon('home', { size: 18 })}
            <span>Home</span>
          </div>

          <div 
            className="nav-item"
            onClick=${() => actions.addToast('Assistants workspace overview.', 'info')}
            title="Assistants"
          >
            ${renderIcon('layers', { size: 18 })}
            <span>Assistants</span>
          </div>

          <div 
            className="nav-item ${isAgentsActive ? 'active' : ''}"
            onClick=${() => actions.setView('dashboard')}
            title="AI Agents"
          >
            ${renderIcon('bot', { size: 18 })}
            <span>Agents</span>
          </div>

          <div 
            className="nav-item"
            onClick=${() => actions.addToast('Workspace settings configuration.', 'info')}
            title="Settings"
          >
            ${renderIcon('settings', { size: 18 })}
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div 
            className="user-profile-badge" 
            onClick=${() => { state.profileMenuOpen = !state.profileMenuOpen; window.scheduleRender(); }}
            title="User Profile"
          >
            <div className="avatar">PB</div>
            <div className="user-info-group" style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); truncate;">Pallavi B G</div>
              <div style="font-size: 11px; color: var(--text-secondary);">Product Designer</div>
            </div>
            ${renderIcon('more-vertical', { size: 16, color: 'var(--text-muted)' })}
          </div>
        </div>
      </aside>
    `;
  }

  global.Sidebar = Sidebar;
})(window);
