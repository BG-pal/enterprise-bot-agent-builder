// Screen 01: Agents Dashboard Component
// Heading, subtitle, Create Agent CTA, Search, Filter, Agent table, Actions menu

(function (global) {
  function Dashboard() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;

    // Filter agents based on search query and status filter
    const filteredAgents = state.agents.filter(agent => {
      const q = state.searchQuery.toLowerCase();
      const matchesSearch = !q || 
        agent.name.toLowerCase().includes(q) ||
        (agent.description && agent.description.toLowerCase().includes(q)) ||
        (agent.status && agent.status.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (state.statusFilter === 'all') return true;
      if (state.statusFilter === 'published') return agent.status === 'Published';
      if (state.statusFilter === 'draft') return agent.status === 'Draft';
      if (state.statusFilter === 'unsaved') return agent.status === 'Unsaved changes';
      return true;
    });

    function formatTime(iso) {
      if (!iso) return 'Recently';
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return 'Recently';
      }
    }

    return html`
      <div className="content-container">
        <!-- Page Title & Header Bar -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px;">
          <div>
            <h1 className="heading-xl">Agents</h1>
            <p className="text-secondary" style="margin-top: 4px; font-size: 15px;">Create and manage your AI agents.</p>
          </div>
          <button 
            className="btn btn-primary btn-lg"
            onClick=${() => actions.setView('create')}
            id="btn-create-agent-main"
          >
            ${renderIcon('plus', { size: 18, color: '#FFFFFF' })}
            <span>Create Agent</span>
          </button>
        </div>

        <!-- Filter & Search Controls Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          <!-- Status Filter Tabs -->
          <div className="radio-pill-group">
            <div 
              className="radio-pill ${state.statusFilter === 'all' ? 'active' : ''}"
              onClick=${() => { state.statusFilter = 'all'; window.scheduleRender(); }}
            >
              All (${state.agents.length})
            </div>
            <div 
              className="radio-pill ${state.statusFilter === 'published' ? 'active' : ''}"
              onClick=${() => { state.statusFilter = 'published'; window.scheduleRender(); }}
            >
              Published (${state.agents.filter(a => a.status === 'Published').length})
            </div>
            <div 
              className="radio-pill ${state.statusFilter === 'draft' ? 'active' : ''}"
              onClick=${() => { state.statusFilter = 'draft'; window.scheduleRender(); }}
            >
              Draft (${state.agents.filter(a => a.status === 'Draft').length})
            </div>
            <div 
              className="radio-pill ${state.statusFilter === 'unsaved' ? 'active' : ''}"
              onClick=${() => { state.statusFilter = 'unsaved'; window.scheduleRender(); }}
            >
              Unsaved changes (${state.agents.filter(a => a.status === 'Unsaved changes').length})
            </div>
          </div>

          <!-- Search Input -->
          <div style="position: relative; width: 280px;">
            <input 
              type="text" 
              placeholder="Search agents by name or keyword..." 
              className="form-input" 
              style="padding-left: 36px;"
              value=${state.searchQuery}
              onInput=${(e) => { state.searchQuery = e.target.value; window.scheduleRender(); }}
            />
            <span style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);">
              ${renderIcon('search', { size: 16 })}
            </span>
            ${state.searchQuery ? html`
              <span 
                style="position: absolute; right: 10px; top: 10px; cursor: pointer; color: var(--text-muted);"
                onClick=${() => { state.searchQuery = ''; window.scheduleRender(); }}
              >
                ${renderIcon('x', { size: 16 })}
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Agents Table / Cards -->
        <div className="card" style="padding: 0; overflow: hidden;">
          ${filteredAgents.length === 0 ? html`
            <div style="padding: 64px 24px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #F3F4F6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: var(--text-muted);">
                ${renderIcon('search', { size: 24 })}
              </div>
              <h3 className="heading-md" style="margin-bottom: 6px;">No agents found</h3>
              <p className="text-secondary" style="margin-bottom: 20px;">
                ${state.searchQuery ? `No results match "${state.searchQuery}". Try a different keyword.` : 'You have not created any agents matching this filter.'}
              </p>
              ${state.searchQuery ? html`
                <button className="btn btn-secondary" onClick=${() => { state.searchQuery = ''; window.scheduleRender(); }}>
                  Clear Search
                </button>
              ` : html`
                <button className="btn btn-primary" onClick=${() => actions.setView('create')}>
                  ${renderIcon('plus', { size: 16 })}
                  <span>Create New Agent</span>
                </button>
              `}
            </div>
          ` : html`
            <div style="overflow-x: auto; width: 100%;">
            <table style="width: 100%; min-width: 680px; border-collapse: collapse; text-align: left; font-size: 14px;">
              <thead>
                <tr style="background-color: #F9FAFB; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                  <th style="padding: 14px 20px;">Agent Name</th>
                  <th style="padding: 14px 16px;">Description</th>
                  <th style="padding: 14px 16px;">Channels</th>
                  <th style="padding: 14px 16px;">Status</th>
                  <th style="padding: 14px 16px;">Last Updated</th>
                  <th style="padding: 14px 20px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAgents.map(agent => {
                  let statusBadgeClass = 'badge-draft';
                  if (agent.status === 'Published') statusBadgeClass = 'badge-published';
                  else if (agent.status === 'Unsaved changes') statusBadgeClass = 'badge-unsaved';

                  return html`
                    <tr 
                      key=${agent.id}
                      style="border-bottom: 1px solid var(--border-color); transition: background-color 0.15s; cursor: pointer;"
                      className="table-row-hover"
                      onClick=${() => actions.selectAgent(agent.id)}
                    >
                      <td style="padding: 16px 20px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 15px;">
                          ${agent.name}
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                          ${agent.speechStack === 'realtime' ? 'Realtime Voice' : 'Cascaded Architecture'} · ${agent.language}
                        </div>
                      </td>
                      <td style="padding: 16px 16px; max-width: 320px; color: var(--text-secondary); font-size: 13px; line-height: 1.4;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          ${agent.description || 'No description provided.'}
                        </div>
                      </td>
                      <td style="padding: 16px 16px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          ${agent.channels.voice ? html`
                            <span className="badge-channel" title="Voice Channel Active">
                              ${renderIcon('phone', { size: 12, color: 'var(--color-primary)' })}
                              <span>Voice</span>
                            </span>
                          ` : ''}
                          ${agent.channels.email ? html`
                            <span className="badge-channel" title="Email Channel Active">
                              ${renderIcon('mail', { size: 12, color: '#D97706' })}
                              <span>Email</span>
                            </span>
                          ` : ''}
                          ${agent.channels.chat ? html`
                            <span className="badge-channel" title="Chat Channel">
                              ${renderIcon('message-circle', { size: 12 })}
                              <span>Chat</span>
                            </span>
                          ` : ''}
                        </div>
                      </td>
                      <td style="padding: 16px 16px;">
                        <span className="badge ${statusBadgeClass}">
                          ${agent.status === 'Published' ? renderIcon('check-circle-2', { size: 12 }) : ''}
                          ${agent.status === 'Unsaved changes' ? renderIcon('alert-triangle', { size: 12 }) : ''}
                          ${agent.status}
                        </span>
                      </td>
                      <td style="padding: 16px 16px; color: var(--text-secondary); font-size: 13px;">
                        ${formatTime(agent.updatedAt)}
                      </td>
                      <td style="padding: 16px 20px; text-align: right;" onClick=${(e) => e.stopPropagation()}>
                        <div style="display: inline-flex; align-items: center; gap: 8px;">
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick=${() => actions.selectAgent(agent.id)}
                            title="Configure Agent"
                          >
                            ${renderIcon('settings', { size: 14 })}
                            <span>Configure</span>
                          </button>
                          
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick=${() => { actions.selectAgent(agent.id); actions.openTryIt(); }}
                            title="Test Agent"
                          >
                            ${renderIcon('play', { size: 13, color: 'var(--color-primary)' })}
                            <span>Try It</span>
                          </button>
                          
                          <button 
                            className="btn-icon" 
                            style="width: 32px; height: 32px;"
                            title="Delete Agent"
                            onClick=${() => {
                              if (confirm(`Are you sure you want to delete "${agent.name}"?`)) {
                                actions.deleteAgent(agent.id);
                              }
                            }}
                          >
                            ${renderIcon('trash-2', { size: 14, color: 'var(--color-error)' })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  global.Dashboard = Dashboard;
})(window);
