// Screen 05: Tools Configuration Component
// Tool custom messages, Assigned tools with Realtime compatibility warning, Bound entities, Tags

(function (global) {
  function ToolsConfig() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const { TEAM_TOOLS, GLOBAL_ENTITIES } = window.ENTERPRISE_DATA;
    const agent = state.currentAgent;

    if (!agent) return '';

    const [toolSearch, setToolSearch] = React.useState('');
    const [tagInput, setTagInput] = React.useState('');

    const effectiveStack = (typeof window.getEffectiveSpeechStack === 'function')
      ? window.getEffectiveSpeechStack(agent)
      : (agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack) || 'cascaded';
    const isRealtime = !!agent.channels.voice && effectiveStack === 'realtime';

    // Tool assignment toggle with Realtime compatibility check
    function toggleTool(toolId) {
      const toolObj = TEAM_TOOLS.find(t => t.id === toolId);
      if (isRealtime && toolObj?.incompatibleRealtime) {
        actions.addToast(`"${toolObj.name}" is incompatible with Realtime Voice mode.`, 'warning');
        return;
      }
      let nextTools = [...agent.assignedTools];
      if (nextTools.includes(toolId)) {
        nextTools = nextTools.filter(id => id !== toolId);
      } else {
        nextTools.push(toolId);
      }
      actions.updateCurrentAgent({ assignedTools: nextTools });
    }

    // Entity toggle
    function toggleEntity(entityId) {
      let nextEntities = [...agent.boundEntities];
      if (nextEntities.includes(entityId)) {
        nextEntities = nextEntities.filter(id => id !== entityId);
      } else {
        nextEntities.push(entityId);
      }
      actions.updateCurrentAgent({ boundEntities: nextEntities });
    }

    // Add tag
    function handleAddTag() {
      const val = tagInput.trim();
      if (val && !agent.tags.includes(val)) {
        actions.updateCurrentAgent({ tags: [...agent.tags, val] });
        setTagInput('');
      }
    }

    // Remove tag
    function removeTag(tagToRemove) {
      actions.updateCurrentAgent({ tags: agent.tags.filter(t => t !== tagToRemove) });
    }

    const filteredTools = TEAM_TOOLS.filter(t => {
      const q = toolSearch.toLowerCase();
      return !q || t.name.toLowerCase().includes(q) || t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    });

    return html`
      <div style="max-width: 880px;">
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Tools & Capabilities</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Configure external integrations, custom tool call feedback, entities, and routing tags.
          </p>
        </div>

        <!-- 1. Tool Call Custom Messages -->
        <div className="card">
          <div className="card-header" style="border-bottom: ${agent.toolCallCustomMessages ? '1px solid var(--border-color)' : 'none'}; padding-bottom: ${agent.toolCallCustomMessages ? '14px' : '0'}; margin-bottom: ${agent.toolCallCustomMessages ? '16px' : '0'};">
            <div>
              <h3 className="card-title">Tool Call Custom Messages</h3>
              <div className="card-subtitle">
                Spoken feedback or status message played to the caller while the agent is executing an external tool.
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.toolCallCustomMessages}
                onChange=${(e) => actions.updateCurrentAgent({ toolCallCustomMessages: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          ${agent.toolCallCustomMessages ? html`
            <div style="animation: fadeIn 0.15s ease-out;">
              <div className="form-group" style="margin-bottom: 0;">
                <label className="form-label required">Default Tool Message</label>
                <textarea 
                  className="form-textarea ${!agent.toolDefaultMessage.trim() ? 'is-invalid' : ''}" 
                  placeholder="e.g. Please hold a moment while I look up that information in our database..."
                  value=${agent.toolDefaultMessage}
                  onInput=${(e) => actions.updateCurrentAgent({ toolDefaultMessage: e.target.value })}
                  rows="2"
                ></textarea>
                ${!agent.toolDefaultMessage.trim() ? html`
                  <div className="invalid-feedback">
                    ${renderIcon('alert-circle', { size: 14 })}
                    <span>Default message is required when tool custom messages are enabled.</span>
                  </div>
                ` : html`
                  <div className="helper-text">
                    This message plays when any tool is invoked, unless a tool-specific custom message is configured.
                  </div>
                `}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- 2. Assigned Tools with Realtime Compatibility Warnings -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Assigned Tools</h3>
              <div className="card-subtitle">
                Select tools from your team library for the agent to query during conversations.
              </div>
            </div>
            <span className="badge badge-draft">
              ${agent.assignedTools.length} of ${TEAM_TOOLS.length} Assigned
            </span>
          </div>

          <!-- Realtime compatibility banner warning -->
          ${isRealtime ? html`
            <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px;">
              ${renderIcon('alert-triangle', { size: 18, color: '#D97706' })}
              <div style="font-size: 13px; color: #92400E; line-height: 1.4;">
                <strong>Realtime Voice Mode Active:</strong> Tools without direct speech-to-speech support are flagged with a compatibility warning below and may not execute properly in Realtime Voice mode.
              </div>
            </div>
          ` : ''}

          <!-- Search Tools -->
          <div style="position: relative; margin-bottom: 16px;">
            <input 
              type="text" 
              placeholder="Search tools in library..." 
              className="form-input" 
              style="padding-left: 36px;"
              value=${toolSearch}
              onInput=${(e) => setToolSearch(e.target.value)}
            />
            <span style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);">
              ${renderIcon('search', { size: 16 })}
            </span>
          </div>

          <!-- Tools List -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${filteredTools.map(tool => {
              const isAssigned = agent.assignedTools.includes(tool.id);
              const hasCompatibilityIssue = isRealtime && tool.incompatibleRealtime;

              return html`
                <div 
                  key=${tool.id}
                  className="selection-card ${isAssigned ? 'selected' : ''}"
                  onClick=${() => toggleTool(tool.id)}
                  style="cursor: ${hasCompatibilityIssue ? 'not-allowed' : 'pointer'}; opacity: ${hasCompatibilityIssue ? 0.75 : 1}; padding: 14px 18px;"
                >
                  <div style="display: flex; align-items: flex-start; gap: 14px; flex: 1;">
                    <div style="margin-top: 2px;">
                      <input 
                        type="checkbox" 
                        disabled=${hasCompatibilityIssue}
                        checked=${isAssigned}
                        onChange=${(e) => { e.stopPropagation(); toggleTool(tool.id); }}
                        style="width: 18px; height: 18px; cursor: ${hasCompatibilityIssue ? 'not-allowed' : 'pointer'}; accent-color: var(--color-primary);"
                      />
                    </div>
                    <div style="flex: 1;">
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span style="font-weight: 700; font-size: 14px; color: var(--text-primary); font-family: monospace;">
                          ${tool.name}
                        </span>
                        <span style="font-size: 13px; color: var(--text-secondary);">(${tool.label})</span>

                        ${hasCompatibilityIssue ? html`
                          <span className="badge badge-alpha" title="This tool does not support speech-to-speech realtime execution">
                            ${renderIcon('alert-triangle', { size: 12 })}
                            <span>Not on Realtime voice</span>
                          </span>
                        ` : ''}
                      </div>
                      <div className="text-secondary" style="font-size: 13px; margin-top: 4px; line-height: 1.4;">
                        ${tool.description}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })}

            ${agent.assignedTools.length === 0 ? html`
              <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                No tools assigned.
              </div>
            ` : ''}
          </div>
        </div>

        <!-- 3. Bound Entities -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Bound Entities</h3>
              <div className="card-subtitle">
                Select global data entities recognized across all channels (Voice & Email transcripts).
              </div>
            </div>
            <span className="badge badge-draft">
              ${agent.boundEntities.length} Selected
            </span>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${GLOBAL_ENTITIES.map(ent => {
              const isSelected = agent.boundEntities.includes(ent.id);
              return html`
                <div 
                  key=${ent.id}
                  className="tag-chip ${isSelected ? 'selected' : ''}"
                  onClick=${() => toggleEntity(ent.id)}
                  style="cursor: pointer; padding: 6px 12px; border-radius: var(--radius-md); background: ${isSelected ? 'var(--color-primary-light)' : '#F3F4F6'}; border-color: ${isSelected ? 'var(--color-primary-border)' : 'var(--border-color)'}; color: ${isSelected ? 'var(--color-primary)' : 'var(--text-primary)'}; font-weight: ${isSelected ? '600' : '500'};"
                >
                  <span style="margin-right: 4px;">${isSelected ? renderIcon('check', { size: 13 }) : renderIcon('plus', { size: 13 })}</span>
                  <span>${ent.label}</span>
                </div>
              `;
            })}
          </div>
        </div>

        <!-- 4. Tags -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Tags</h3>
              <div className="card-subtitle">
                Tags apply to every conversation handled by the agent for analytics and routing.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <input 
              type="text" 
              placeholder="Enter tag name (e.g. claims-support) and press Enter..." 
              className="form-input" 
              style="flex: 1;"
              value=${tagInput}
              onInput=${(e) => setTagInput(e.target.value)}
              onKeyDown=${(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button className="btn btn-secondary" onClick=${handleAddTag}>
              Add Tag
            </button>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${agent.tags.map(tag => html`
              <span key=${tag} className="tag-chip" style="background: white; border: 1px solid var(--border-color);">
                ${renderIcon('hash', { size: 12, color: 'var(--text-muted)' })}
                <span>${tag}</span>
                <span 
                  className="remove-btn" 
                  onClick=${() => removeTag(tag)}
                  title="Remove tag"
                >
                  ${renderIcon('x', { size: 12 })}
                </span>
              </span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  global.ToolsConfig = ToolsConfig;
})(window);
