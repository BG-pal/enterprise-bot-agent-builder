// Screen 10: Publish Modal & Discard Confirmation Dialogs
// Version naming, auto-generated copyable Version ID, simulated publishing state machine

(function (global) {
  function PublishModal() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent) return '';

    const [versionNameInput, setVersionNameInput] = React.useState('');
    const [copied, setCopied] = React.useState(false);

    function handlePublish() {
      actions.publishAgent(versionNameInput.trim());
    }

    function copyVersionId(id) {
      if (!id) return;
      navigator.clipboard.writeText(id).then(() => {
        setCopied(true);
        actions.addToast('Version ID copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // Fallback for non-secure origin
        const ta = document.createElement('textarea');
        ta.value = id;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        actions.addToast('Version ID copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2500);
      });
    }

    // ================= PUBLISH MODAL =================
    const publishModal = state.publishModalOpen ? html`
      <div className="modal-overlay" onClick=${() => actions.closePublishModal()}>
        <div className="modal-dialog" onClick=${(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center;">
                ${renderIcon('send', { size: 16 })}
              </div>
              <div>
                <h3 style="font-size: 16px; font-weight: 700; margin: 0;">Publish Agent</h3>
                <div style="font-size: 12px; color: var(--text-secondary);">${agent.name}</div>
              </div>
            </div>

            <button className="btn-icon" onClick=${() => actions.closePublishModal()}>
              ${renderIcon('x', { size: 16 })}
            </button>
          </div>

          <div className="modal-body">
            ${state.isPublishing ? html`
              <div style="text-align: center; padding: 36px 20px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid #E2E8F0; border-top-color: var(--color-primary); animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
                <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Publishing Agent…</h4>
                <div className="text-secondary" style="font-size: 13px;">
                  Compiling runtime prompts, validating tool schemas, and registering version with routing cluster.
                </div>
              </div>
            ` : state.lastPublishedVersionId ? html`
              <!-- Publishing Success View with Copyable Version ID -->
              <div style="text-align: center; padding: 20px 10px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-success); color: var(--text-success); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;">
                  ${renderIcon('check', { size: 24 })}
                </div>
                <h4 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                  Agent Published Successfully!
                </h4>
                <div className="text-secondary" style="font-size: 13px; max-width: 420px; margin: 0 auto 20px;">
                  Your agent is now published and active. All channels will route incoming customer requests to this configuration version.
                </div>

                <!-- Copyable Version ID Card -->
                <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; max-width: 380px; margin: 0 auto 16px;">
                  <div style="text-align: left;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
                      Generated Version ID
                    </div>
                    <div style="font-family: monospace; font-size: 15px; font-weight: 700; color: var(--color-primary); margin-top: 2px;">
                      ${state.lastPublishedVersionId}
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => copyVersionId(state.lastPublishedVersionId)}
                    id="btn-copy-version-id"
                  >
                    ${renderIcon(copied ? 'check' : 'copy', { size: 14 })}
                    <span>${copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ` : html`
              <!-- Initial Publish Confirmation Form -->
              <div>
                <p className="text-secondary" style="font-size: 14px; margin-bottom: 20px; line-height: 1.5;">
                  Publishing will promote your unpublished configuration to production. A unique, immutable Version ID will be assigned to record this release.
                </p>

                <div className="form-group">
                  <label className="form-label">
                    Version Name <span style="font-weight: 400; color: var(--text-muted);">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. v1.5.0 - Winter claims update"
                    value=${versionNameInput}
                    onInput=${(e) => setVersionNameInput(e.target.value)}
                  />
                  <div className="helper-text">
                    Provide a human-readable label to help your team track updates over time.
                  </div>
                </div>

                <div style="background: #FAFBFD; border: 1px solid #DCE6F8; border-radius: var(--radius-md); padding: 14px; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                  <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    ${renderIcon('info', { size: 15, color: 'var(--color-primary)' })}
                    <span>Release Summary</span>
                  </div>
                  <div>• Status transition: <strong>Unsaved / Draft → Published</strong></div>
                  <div>• Active Channels: <strong>${agent.channels.voice ? 'Voice ' : ''}${agent.channels.email ? 'Email' : ''}</strong></div>
                  <div>• Primary Model: <strong>${agent.sharedModel.model}</strong></div>
                </div>
              </div>
            `}
          </div>

          <div className="modal-footer">
            ${state.lastPublishedVersionId ? html`
              <button 
                className="btn btn-primary"
                onClick=${() => {
                  state.lastPublishedVersionId = null;
                  actions.closePublishModal();
                }}
              >
                Done
              </button>
            ` : html`
              <button 
                className="btn btn-secondary" 
                onClick=${() => actions.closePublishModal()}
                disabled=${state.isPublishing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick=${handlePublish}
                disabled=${state.isPublishing}
                id="btn-confirm-publish"
              >
                ${renderIcon('send', { size: 14, color: '#FFFFFF' })}
                <span>Confirm & Publish</span>
              </button>
            `}
          </div>
        </div>
      </div>
    ` : '';

    // ================= DISCARD CHANGES CONFIRMATION MODAL =================
    const discardModal = state.discardModalOpen ? html`
      <div className="modal-overlay" onClick=${() => { state.discardModalOpen = false; window.scheduleRender(); }}>
        <div className="modal-dialog" style="max-width: 480px;" onClick=${(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--bg-error); color: var(--color-error); display: flex; align-items: center; justify-content: center;">
                ${renderIcon('alert-triangle', { size: 18 })}
              </div>
              <h3 style="font-size: 16px; font-weight: 700; margin: 0;">Discard Unsaved Changes?</h3>
            </div>
            <button className="btn-icon" onClick=${() => { state.discardModalOpen = false; window.scheduleRender(); }}>
              ${renderIcon('x', { size: 16 })}
            </button>
          </div>

          <div className="modal-body">
            <p className="body-text" style="color: var(--text-secondary); line-height: 1.5;">
              Are you sure you want to discard your unsaved modifications? This will restore the last published configuration for <strong>"${agent.name}"</strong>. This action cannot be undone.
            </p>
          </div>

          <div className="modal-footer">
            <button 
              className="btn btn-secondary" 
              onClick=${() => { state.discardModalOpen = false; window.scheduleRender(); }}
            >
              Keep Editing
            </button>
            <button 
              className="btn btn-danger" 
              onClick=${() => actions.discardChanges()}
              id="btn-confirm-discard"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    ` : '';

    return html`
      <div>
        ${publishModal}
        ${discardModal}
      </div>
    `;
  }

  global.PublishModal = PublishModal;
})(window);
