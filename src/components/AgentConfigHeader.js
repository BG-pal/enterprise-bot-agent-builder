// Persistent Agent Configuration Header & Section Navigation
// Screen 03: Overview & Navigation Shell

(function (global) {
  function AgentConfigHeader() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent) return '';

    let statusBadgeClass = 'badge-draft';
    if (agent.status === 'Published') statusBadgeClass = 'badge-published';
    else if (agent.status === 'Unsaved changes') statusBadgeClass = 'badge-unsaved';
    else if (agent.status === 'Publishing…') statusBadgeClass = 'badge-publishing';

    const isPublishDisabled = !state.hasUnsavedChanges && agent.status === 'Published';

    return html`
      <div className="agent-config-header">
        <div className="agent-title-group">
          <button 
            className="btn-back"
            onClick=${() => {
              if (state.hasUnsavedChanges) {
                if (confirm('You have unsaved changes. Do you want to return to the Agents list?')) {
                  actions.setView('dashboard');
                }
              } else {
                actions.setView('dashboard');
              }
            }}
            id="btn-back-to-agents"
          >
            ${renderIcon('arrow-left', { size: 14 })}
            <span>Agents</span>
          </button>

          <div style="height: 20px; width: 1px; background: var(--border-color); margin: 0 4px;"></div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <h2 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0;">
              ${agent.name}
            </h2>

            <span className="badge ${statusBadgeClass}" id="agent-status-badge">
              ${agent.status === 'Published' ? renderIcon('check-circle-2', { size: 12 }) : ''}
              ${agent.status === 'Unsaved changes' ? renderIcon('alert-triangle', { size: 12 }) : ''}
              ${agent.status === 'Publishing…' ? html`<span className="pulsing-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);"></span>` : ''}
              <span>${agent.status}</span>
            </span>

            <!-- Voice Architecture Badge (Retained throughout configuration per Section 4) -->
            <span className="badge-channel" style="font-size: 11px; background: #EEF2FF; color: var(--color-primary); border: 1px solid #C7D2FE;" title="Active Voice Architecture">
              ${renderIcon('phone', { size: 12, color: 'var(--color-primary)' })}
              <span>${((typeof window.getEffectiveSpeechStack === 'function' ? window.getEffectiveSpeechStack(agent) : (agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack)) === 'realtime') ? 'Realtime Voice' : 'Cascaded STT/TTS'}</span>
            </span>

            ${agent.versionId ? html`
              <button 
                type="button"
                onClick=${() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(agent.versionId);
                  }
                  actions.addToast('Version ID copied to clipboard: ' + agent.versionId, 'success');
                }}
                style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); font-family: monospace; background: #F3F4F6; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer;" 
                title="Click to copy Version ID"
              >
                ${renderIcon('copy', { size: 12, color: 'var(--text-muted)' })}
                <span>${agent.versionId}</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Global Configuration Header Actions -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- Discard changes (visible when changes exist relative to saved or published snapshot) -->
          ${(state.hasUnsavedChanges || (state.lastPublishedSnapshot && JSON.stringify(state.currentAgent) !== JSON.stringify(state.lastPublishedSnapshot))) ? html`
            <button 
              className="btn btn-secondary btn-sm"
              onClick=${() => { state.discardModalOpen = true; window.scheduleRender(); }}
              id="btn-discard-changes"
              title="Revert all changes to last published configuration"
            >
              ${renderIcon('refresh-cw', { size: 14 })}
              <span>Discard Changes</span>
            </button>
          ` : ''}

          <!-- Save Changes -->
          <button 
            className="btn btn-secondary btn-sm"
            onClick=${() => actions.saveChanges()}
            disabled=${!state.hasUnsavedChanges}
            id="btn-save-changes"
            title="${state.hasUnsavedChanges ? 'Save your configuration changes' : 'No unsaved changes'}"
          >
            ${renderIcon('check', { size: 14 })}
            <span>Save Changes</span>
          </button>

          <!-- Try It -->
          <button 
            className="btn btn-secondary btn-sm"
            onClick=${() => actions.openTryIt()}
            id="btn-try-it"
            title="Test unpublished configuration in sandbox"
          >
            ${renderIcon('play', { size: 14, color: 'var(--color-primary)' })}
            <span>Try It</span>
          </button>

          <!-- Publish -->
          <button 
            className="btn btn-primary btn-sm"
            onClick=${() => actions.openPublishModal()}
            disabled=${isPublishDisabled}
            id="btn-publish-agent"
            title="${isPublishDisabled ? 'No changes to publish. Your agent is already up to date.' : 'Publish agent configuration'}"
          >
            ${renderIcon('send', { size: 14, color: '#FFFFFF' })}
            <span>Publish</span>
          </button>
        </div>
      </div>
    `;
  }

  function AgentConfigNav() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent) return '';

    const navItems = [
      { id: 'overview', label: 'Overview', icon: 'sliders' },
      { id: 'prompt', label: 'Prompt', icon: 'file-text' },
      { id: 'tools', label: 'Tools', icon: 'wrench' },
      { id: 'model', label: 'Model Settings', icon: 'cpu' },
      { id: 'voice', label: 'Voice Settings', icon: 'volume-2' }
    ];

    return html`
      <div className="config-sidebar" aria-label="Configuration Sections">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 0 12px 8px;">
          Configuration
        </div>
        ${navItems.map(item => html`
          <div 
            key=${item.id}
            className="nav-item ${state.configTab === item.id ? 'active' : ''}"
            onClick=${() => actions.setConfigTab(item.id)}
            id="nav-tab-${item.id}"
          >
            ${renderIcon(item.icon, { size: 16 })}
            <span>${item.label}</span>
          </div>
        `)}
      </div>
    `;
  }

  // Configuration Overview Tab / Screen 03
  function ConfigOverview() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent) return '';

    return html`
      <div style="max-width: 980px;">
        <!-- Header summary -->
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Configuration Overview</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Manage and fine-tune your agent's behavior, tools, models, and channel integrations.
          </p>
        </div>

        <!-- Quick Summary Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div className="card" style="margin: 0; padding: 20px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
              Active Channels
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <span className="badge-channel" style="background: #EEF2FF; color: var(--color-primary); border: 1px solid #C7D2FE;">
                ${renderIcon('phone', { size: 14, color: 'var(--color-primary)' })}
                <span>Voice (${(agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack) === 'realtime' ? 'Realtime Voice' : 'Cascaded STT/TTS'})</span>
              </span>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
              Primary Language: <strong>${agent.language || 'English (US)'}</strong>
            </div>
          </div>

          <div className="card" style="margin: 0; padding: 20px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
              Model & Intelligence
            </div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              ${agent.sharedModel.model}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
              Temp: ${agent.sharedModel.temperature} · Tool limit: ${agent.sharedModel.toolCallLimit}
            </div>
          </div>

          <div className="card" style="margin: 0; padding: 20px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
              Tools & Entities
            </div>
            <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              ${agent.assignedTools.length} Tools Assigned
            </div>
            <div style="font-size: 13px; color: var(--text-secondary);">
              ${agent.boundEntities.length} Bound Entities · ${agent.tags.length} Tags
            </div>
          </div>
        </div>

        <!-- Section Navigation Cards -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Prompt Card -->
          <div 
            className="selection-card" 
            onClick=${() => actions.setConfigTab('prompt')}
            style="cursor: pointer;"
          >
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: #EEF2FF; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                ${renderIcon('file-text', { size: 20 })}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Prompt Configuration</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Instructions, welcome speech, response guidelines, and AI rewrite.</div>
              </div>
            </div>
            ${renderIcon('chevron-right', { size: 18, color: 'var(--text-muted)' })}
          </div>

          <!-- Tools Card -->
          <div 
            className="selection-card" 
            onClick=${() => actions.setConfigTab('tools')}
            style="cursor: pointer;"
          >
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: #FEF3C7; display: flex; align-items: center; justify-content: center; color: #D97706;">
                ${renderIcon('wrench', { size: 20 })}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Tools & Entities</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Assign knowledge bases, CRM lookups, and global entity bindings.</div>
              </div>
            </div>
            ${renderIcon('chevron-right', { size: 18, color: 'var(--text-muted)' })}
          </div>

          <!-- Model Settings Card -->
          <div 
            className="selection-card" 
            onClick=${() => actions.setConfigTab('model')}
            style="cursor: pointer;"
          >
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: #E0E7FF; display: flex; align-items: center; justify-content: center; color: #4338CA;">
                ${renderIcon('cpu', { size: 20 })}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Model Settings</div>
                <div style="font-size: 13px; color: var(--text-secondary);">Shared models, token window triggers, and channel-specific overrides.</div>
              </div>
            </div>
            ${renderIcon('chevron-right', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${agent.channels.voice ? html`
            <div 
              className="selection-card" 
              onClick=${() => actions.setConfigTab('voice')}
              style="cursor: pointer;"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: #ECFDF5; display: flex; align-items: center; justify-content: center; color: #059669;">
                  ${renderIcon('volume-2', { size: 20 })}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Voice Settings</div>
                  <div style="font-size: 13px; color: var(--text-secondary);">STT/TTS engines, turn detection, barge-in, DTMF keypad, and inactivity rules.</div>
                </div>
              </div>
              ${renderIcon('chevron-right', { size: 18, color: 'var(--text-muted)' })}
            </div>
          ` : ''}

          ${agent.channels.email ? html`
            <div 
              className="selection-card" 
              onClick=${() => actions.setConfigTab('email')}
              style="cursor: pointer;"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-md); background: #FFF7ED; display: flex; align-items: center; justify-content: center; color: #EA580C;">
                  ${renderIcon('mail', { size: 20 })}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">Email Settings</div>
                  <div style="font-size: 13px; color: var(--text-secondary);">Mailbox connections, thread windows, signatures, triage filters, and escalation rules.</div>
                </div>
              </div>
              ${renderIcon('chevron-right', { size: 18, color: 'var(--text-muted)' })}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  global.AgentConfigHeader = AgentConfigHeader;
  global.AgentConfigNav = AgentConfigNav;
  global.ConfigOverview = ConfigOverview;
})(window);
