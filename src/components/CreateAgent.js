// Screen 02: Create Agent Component
// Section A: Channel Selection & Speech Stack, Section B: Agent Details, Section C: Actions
// Includes quick switcher to easily verify all 6 required evaluation test states.

(function (global) {
  function CreateAgent() {
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const { LANGUAGES } = window.ENTERPRISE_DATA;

    // Local form state
    const [name, setName] = React.useState('');
    const [voiceOn, setVoiceOn] = React.useState(true);
    const [speechStack, setSpeechStack] = React.useState('cascaded'); // 'cascaded' | 'realtime'
    const [emailOn, setEmailOn] = React.useState(false);
    const [language, setLanguage] = React.useState('English (US)');
    const [description, setDescription] = React.useState('');
    const [welcomeMessage, setWelcomeMessage] = React.useState('');
    const [instructions, setInstructions] = React.useState('');

    // Validation state
    const [nameError, setNameError] = React.useState('');
    const [channelError, setChannelError] = React.useState('');
    const [activeTestState, setActiveTestState] = React.useState(1);

    // Apply specific preset states as defined in Assignment Section 7
    function applyState(stateNumber) {
      setActiveTestState(stateNumber);
      setNameError('');
      setChannelError('');

      if (stateNumber === 1) {
        // State 1: Default
        setVoiceOn(true);
        setSpeechStack('cascaded');
        setEmailOn(false);
        setName('');
        setLanguage('English (US)');
        setDescription('');
        setWelcomeMessage('');
        setInstructions('');
      } else if (stateNumber === 2) {
        // State 2: Realtime Voice
        setVoiceOn(true);
        setSpeechStack('realtime');
        setEmailOn(false);
        setName('Realtime Voice Bot');
        setLanguage('English (US)');
        setDescription('Low latency phone agent using speech-to-speech.');
        setWelcomeMessage('Hello! How can I help you today?');
      } else if (stateNumber === 3) {
        // State 3: Email Only
        setVoiceOn(false);
        setEmailOn(true);
        setName('Email Helpdesk Agent');
        setLanguage('English (US)');
        setDescription('Automated mailbox triage and resolution.');
        setInstructions('Answer customer emails politely and concisely.');
      } else if (stateNumber === 4) {
        // State 4: Name Error
        setName('');
        setNameError('Required');
        setTimeout(() => {
          const el = document.getElementById('input-agent-name');
          if (el) el.focus();
        }, 50);
      } else if (stateNumber === 5) {
        // State 5: Channel Error
        setVoiceOn(false);
        setEmailOn(false);
        setName('Omnichannel Agent');
        setChannelError('Select at least one channel to create an agent.');
      } else if (stateNumber === 6) {
        // State 6: Chat Unavailable
        actions.addToast('Chat channel is Coming Soon and currently disabled.', 'info');
      }
    }

    function handleCreate() {
      let hasError = false;

      // Validate name
      if (!name.trim()) {
        setNameError('Required');
        hasError = true;
        const el = document.getElementById('input-agent-name');
        if (el) el.focus();
      } else {
        setNameError('');
      }

      // Validate channels
      if (!voiceOn && !emailOn) {
        setChannelError('Select at least one channel to create an agent.');
        hasError = true;
      } else {
        setChannelError('');
      }

      if (hasError) return;

      // Create new agent with values
      actions.createNewAgent({
        name: name.trim(),
        channels: { voice: voiceOn, email: emailOn, chat: false },
        speechStack: voiceOn ? speechStack : 'cascaded',
        language,
        description,
        welcomeMessage,
        instructions
      });
    }

    // Is create button enabled?
    const isCreateDisabled = !name.trim() || (!voiceOn && !emailOn);

    return html`
      <div className="content-container" style="max-width: 860px;">
        <!-- Assignment Test States Verification Bar -->
        <div style="background: #F0F5FF; border: 1px solid #BCD3F9; border-radius: var(--radius-lg); padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderIcon('sparkles', { size: 16, color: 'var(--color-primary)' })}
            <span style="font-weight: 700; font-size: 13px; color: var(--color-primary);">Assignment Required States:</span>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button 
              className="btn btn-sm ${activeTestState === 1 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(1)}
              title="State 1: Default configuration"
            >
              State 1: Default
            </button>
            <button 
              className="btn btn-sm ${activeTestState === 2 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(2)}
              title="State 2: Realtime Voice selected"
            >
              State 2: Realtime Voice
            </button>
            <button 
              className="btn btn-sm ${activeTestState === 3 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(3)}
              title="State 3: Email only selected"
            >
              State 3: Email Only
            </button>
            <button 
              className="btn btn-sm ${activeTestState === 4 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(4)}
              title="State 4: Empty Name validation error"
            >
              State 4: Name Error
            </button>
            <button 
              className="btn btn-sm ${activeTestState === 5 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(5)}
              title="State 5: No channel selected error"
            >
              State 5: Channel Error
            </button>
            <button 
              className="btn btn-sm ${activeTestState === 6 ? 'btn-primary' : 'btn-secondary'}"
              onClick=${() => applyState(6)}
              title="State 6: Chat disabled and Coming Soon"
            >
              State 6: Chat Unavailable
            </button>
          </div>
        </div>

        <!-- Page Header -->
        <div style="margin-bottom: 28px;">
          <h1 className="heading-xl">Create a new agent</h1>
          <p className="text-secondary" style="margin-top: 6px; font-size: 15px;">
            Set up your AI agent with the basic details to get started.
          </p>
        </div>

        <!-- ================= SECTION A: CHANNEL SELECTION ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Channels</h2>
              <div className="card-subtitle">Select which communication channels this agent will handle.</div>
            </div>
            ${channelError ? html`
              <span className="invalid-feedback" style="margin: 0;">
                ${renderIcon('alert-circle', { size: 14 })}
                <span>${channelError}</span>
              </span>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- VOICE CHANNEL CARD -->
            <div 
              className="selection-card ${voiceOn ? 'selected' : ''}"
              onClick=${() => {
                const next = !voiceOn;
                setVoiceOn(next);
                if (next) setChannelError('');
              }}
              style="cursor: pointer;"
              id="card-channel-voice"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${voiceOn ? 'var(--color-primary-light)' : '#F3F4F6'}; display: flex; align-items: center; justify-content: center; color: ${voiceOn ? 'var(--color-primary)' : 'var(--text-muted)'}; flex-shrink: 0;">
                  ${renderIcon('phone', { size: 22 })}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <span>Voice</span>
                    <span className="badge badge-published" style="font-size: 11px;">Default</span>
                  </div>
                  <div className="text-secondary" style="font-size: 13px; margin-top: 2px;">
                    Answers phone calls.
                  </div>
                </div>
              </div>

              <label className="toggle-switch" onClick=${(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked=${voiceOn}
                  onChange=${(e) => {
                    setVoiceOn(e.target.checked);
                    if (e.target.checked) setChannelError('');
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <!-- SPEECH STACK (Visible only when Voice is ON) -->
            ${voiceOn ? html`
              <div style="margin-left: 20px; padding: 16px 20px; border-left: 2px solid var(--color-primary); background: #FAFBFD; border-radius: 0 var(--radius-md) var(--radius-md) 0; animation: fadeIn 0.15s ease-out;">
                <label className="form-label" style="margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">
                  Speech Stack Architecture
                </label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  <!-- Cascaded Option -->
                  <div 
                    className="selection-card ${speechStack === 'cascaded' ? 'selected' : ''}"
                    onClick=${() => setSpeechStack('cascaded')}
                    style="padding: 14px;"
                  >
                    <div>
                      <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <span>Cascaded</span>
                        <span className="badge badge-published" style="font-size: 10px;">Recommended</span>
                      </div>
                      <div className="text-secondary" style="font-size: 12px; margin-top: 4px; line-height: 1.4;">
                        Uses separate speech-to-text and text-to-speech stages around a text model. Flexible and supports all tools.
                      </div>
                    </div>
                  </div>

                  <!-- Realtime Voice Option -->
                  <div 
                    className="selection-card ${speechStack === 'realtime' ? 'selected' : ''}"
                    onClick=${() => setSpeechStack('realtime')}
                    style="padding: 14px;"
                  >
                    <div>
                      <div style="font-weight: 700; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <span>Realtime Voice</span>
                        <span className="badge badge-alpha" style="font-size: 10px;">Ultra Low Latency</span>
                      </div>
                      <div className="text-secondary" style="font-size: 12px; margin-top: 4px; line-height: 1.4;">
                        Uses one speech-to-speech model for lowest latency. Guardrails and PII protections are not yet enforced.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- EMAIL CHANNEL CARD -->
            <div 
              className="selection-card ${emailOn ? 'selected' : ''}"
              onClick=${() => {
                const next = !emailOn;
                setEmailOn(next);
                if (next) setChannelError('');
              }}
              style="cursor: pointer;"
              id="card-channel-email"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: ${emailOn ? 'var(--color-primary-light)' : '#F3F4F6'}; display: flex; align-items: center; justify-content: center; color: ${emailOn ? 'var(--color-primary)' : 'var(--text-muted)'}; flex-shrink: 0;">
                  ${renderIcon('mail', { size: 22 })}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 15px; color: var(--text-primary);">
                    Email
                  </div>
                  <div className="text-secondary" style="font-size: 13px; margin-top: 2px;">
                    Replies from a mailbox. <span style="color: var(--text-muted); font-size: 12px;">(Mailbox is connected after agent creation)</span>
                  </div>
                </div>
              </div>

              <label className="toggle-switch" onClick=${(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked=${emailOn}
                  onChange=${(e) => {
                    setEmailOn(e.target.checked);
                    if (e.target.checked) setChannelError('');
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <!-- CHAT CHANNEL CARD (Coming Soon, Disabled) -->
            <div 
              className="selection-card disabled"
              style="cursor: not-allowed; opacity: 0.6;"
              tabIndex="-1"
              aria-disabled="true"
              id="card-channel-chat"
            >
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0;">
                  ${renderIcon('message-circle', { size: 22 })}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 15px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                    <span>Chat</span>
                    <span className="badge badge-coming-soon">Coming Soon</span>
                  </div>
                  <div className="text-muted" style="font-size: 13px; margin-top: 2px;">
                    Answers web and WhatsApp messages.
                  </div>
                </div>
              </div>

              <label className="toggle-switch" style="pointer-events: none; opacity: 0.5;">
                <input type="checkbox" disabled checked=${false} tabIndex="-1" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- ================= SECTION B: AGENT DETAILS ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Agent Details</h2>
              <div className="card-subtitle">Basic identity and conversational configuration.</div>
            </div>
          </div>

          <!-- 1. Name (Required) -->
          <div className="form-group">
            <label className="form-label required" htmlFor="input-agent-name">Name</label>
            <input 
              id="input-agent-name"
              type="text" 
              className="form-input ${nameError ? 'is-invalid' : ''}" 
              placeholder="Enter agent name"
              value=${name}
              onInput=${(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
            />
            ${nameError ? html`
              <div className="invalid-feedback" id="name-error-msg">
                ${renderIcon('alert-circle', { size: 14 })}
                <span>Required</span>
              </div>
            ` : ''}
          </div>

          <!-- 2. Primary Language (Optional, Default: English US) -->
          <div className="form-group">
            <label className="form-label" htmlFor="select-language">Primary language</label>
            <select 
              id="select-language"
              className="form-select"
              value=${language}
              onChange=${(e) => setLanguage(e.target.value)}
            >
              ${LANGUAGES.map(lang => html`
                <option key=${lang} value=${lang}>${lang}</option>
              `)}
            </select>
            <div className="helper-text">
              Used for speech, prompts and transcript defaults.
            </div>
          </div>

          <!-- 3. Description (Optional) -->
          <div className="form-group">
            <label className="form-label" htmlFor="input-description">Description</label>
            <textarea 
              id="input-description"
              className="form-textarea" 
              placeholder="e.g. Handles policy claims and customer inquiries"
              value=${description}
              onInput=${(e) => setDescription(e.target.value)}
              rows="2"
            ></textarea>
            <div className="helper-text">
              Helps the team distinguish agents.
            </div>
          </div>

          <!-- 4. Welcome Message (Optional, Always visible) -->
          <div className="form-group">
            <label className="form-label" htmlFor="input-welcome-message">Welcome message</label>
            <textarea 
              id="input-welcome-message"
              className="form-textarea" 
              placeholder="e.g. Hello, thanks for calling Acme Insurance. How can I help you today?"
              value=${welcomeMessage}
              onInput=${(e) => setWelcomeMessage(e.target.value)}
              rows="2"
            ></textarea>
            <div className="helper-text">
              Spoken before the caller says anything, and only applies to Voice. Empty values fall back to team default.
            </div>
          </div>

          <!-- 5. Instructions / Prompt (Optional) -->
          <div className="form-group" style="margin-bottom: 0;">
            <label className="form-label" htmlFor="input-instructions">Instructions / Prompt</label>
            <textarea 
              id="input-instructions"
              className="form-textarea" 
              placeholder="e.g. You are a helpful insurance support agent. Verify policy numbers before discussing claim details..."
              value=${instructions}
              onInput=${(e) => setInstructions(e.target.value)}
              rows="4"
            ></textarea>
            <div className="helper-text">
              Defines the AI agent's behaviour. Further tuning is available after agent creation.
            </div>
          </div>
        </div>

        <!-- ================= SECTION C: ACTIONS ================= -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 40px;">
          <button 
            className="btn btn-secondary btn-lg"
            onClick=${() => {
              // Discard any entered values and return to Agents
              actions.setView('dashboard');
            }}
            id="btn-cancel-create"
          >
            Cancel
          </button>

          <button 
            className="btn btn-primary btn-lg"
            onClick=${handleCreate}
            disabled=${isCreateDisabled}
            id="btn-submit-create"
            title="${isCreateDisabled ? 'Enter a name and select at least one channel' : 'Create agent'}"
          >
            ${renderIcon('check', { size: 18, color: '#FFFFFF' })}
            <span>Create Agent</span>
          </button>
        </div>
      </div>
    `;
  }

  global.CreateAgent = CreateAgent;
})(window);
