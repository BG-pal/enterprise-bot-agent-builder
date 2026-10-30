// Top Header Component
// Breadcrumb, search, notifications popover, user avatar

(function (global) {
  function Header() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;

    let breadcrumbs = [];
    if (state.currentView === 'dashboard') {
      breadcrumbs = [
        { label: 'Assistants', onClick: () => actions.setView('dashboard') },
        { label: 'Agents', current: true }
      ];
    } else if (state.currentView === 'create') {
      breadcrumbs = [
        { label: 'Assistants', onClick: () => actions.setView('dashboard') },
        { label: 'Agents', onClick: () => actions.setView('dashboard') },
        { label: 'Create a new agent', current: true }
      ];
    } else if (state.currentView === 'configure') {
      breadcrumbs = [
        { label: 'Assistants', onClick: () => actions.setView('dashboard') },
        { label: 'Agents', onClick: () => actions.setView('dashboard') },
        { label: state.currentAgent ? state.currentAgent.name : 'Configure Agent', current: true }
      ];
    }

    return html`
      <header className="top-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            ${breadcrumbs.map((b, idx) => html`
              <span key=${idx} style="display: inline-flex; align-items: center; gap: 8px;">
                ${idx > 0 ? html`<span style="color: var(--text-muted);">${renderIcon('chevron-right', { size: 14 })}</span>` : ''}
                ${b.current
                  ? html`<span className="breadcrumb-current">${b.label}</span>`
                  : html`<span className="breadcrumb-item" onClick=${b.onClick}>${b.label}</span>`
                }
              </span>
            `)}
          </nav>
        </div>

        <div className="header-actions">
          <div style="position: relative;">
            <input 
              type="text" 
              placeholder="Search in workspace..." 
              className="form-input" 
              style="width: 240px; height: 36px; padding-left: 34px; font-size: 13px;"
              value=${state.searchQuery}
              onInput=${(e) => { state.searchQuery = e.target.value; window.scheduleRender(); }}
            />
            <span style="position: absolute; left: 10px; top: 10px; color: var(--text-muted);">
              ${renderIcon('search', { size: 16 })}
            </span>
          </div>

          <!-- Notification Bell -->
          <div style="position: relative;">
            <button 
              className="btn-icon" 
              title="Notifications"
              onClick=${() => { state.notificationsOpen = !state.notificationsOpen; window.scheduleRender(); }}
            >
              ${renderIcon('bell', { size: 18 })}
              <span style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: var(--color-primary); border-radius: 50%;"></span>
            </button>

            ${state.notificationsOpen ? html`
              <div style="position: absolute; right: 0; top: 44px; width: 320px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 50; padding: 12px; animation: scaleUp 0.15s ease-out;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 8px;">
                  <span style="font-weight: 700; font-size: 14px;">Notifications</span>
                  <span style="font-size: 11px; color: var(--color-primary); cursor: pointer;" onClick=${() => { state.notificationsOpen = false; window.scheduleRender(); }}>Close</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="padding: 8px; background: var(--bg-hover); border-radius: var(--radius-sm); font-size: 12px;">
                    <div style="font-weight: 600; color: var(--text-primary);">Customer Support Agent v1.4.0</div>
                    <div style="color: var(--text-secondary);">Published to production successfully.</div>
                    <div style="color: var(--text-muted); font-size: 10px; margin-top: 4px;">2 hours ago</div>
                  </div>
                  <div style="padding: 8px; background: var(--bg-hover); border-radius: var(--radius-sm); font-size: 12px;">
                    <div style="font-weight: 600; color: var(--text-primary);">SIP Trunk Connected</div>
                    <div style="color: var(--text-secondary);">Twilio Voice trunk verified for US-East.</div>
                    <div style="color: var(--text-muted); font-size: 10px; margin-top: 4px;">1 day ago</div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- User Profile Avatar -->
          <div 
            className="avatar" 
            style="cursor: pointer; width: 36px; height: 36px;"
            onClick=${() => { state.profileMenuOpen = !state.profileMenuOpen; window.scheduleRender(); }}
          >
            PB
          </div>

          ${state.profileMenuOpen ? html`
            <div style="position: absolute; right: 24px; top: 60px; width: 220px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 50; padding: 8px; animation: scaleUp 0.15s ease-out;">
              <div style="padding: 8px; border-bottom: 1px solid var(--border-color); margin-bottom: 4px;">
                <div style="font-weight: 700; font-size: 13px;">Pallavi B G</div>
                <div style="font-size: 12px; color: var(--text-secondary);">pallavi.bg@enterprisebot.ai</div>
              </div>
              <div className="nav-item" onClick=${() => { state.profileMenuOpen = false; actions.addToast('User settings opened.', 'info'); }}>Profile Settings</div>
              <div className="nav-item" onClick=${() => { state.profileMenuOpen = false; actions.addToast('Switched to Production workspace.', 'info'); }}>Workspace Preferences</div>
              <div className="nav-item" style="color: var(--color-error);" onClick=${() => { state.profileMenuOpen = false; actions.addToast('Demo account cannot log out.', 'info'); }}>Sign Out</div>
            </div>
          ` : ''}
        </div>
      </header>
    `;
  }

  global.Header = Header;
})(window);
