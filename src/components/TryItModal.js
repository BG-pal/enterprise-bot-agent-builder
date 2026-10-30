// Screen 09: Try It Testing Workspace Component
// Complete Voice testing: Initial Idle Screen (Start Call), Active Call Interface (Live Timer, Mute, Transcript, End Call), Ended Call Summary (Who Ended, Duration, Call Again, View Logs)
// Complete Email testing: From/To read-only, Subject/Body required validation, Writing Reply state, Agent Signature, Expand/Collapse Thread, Hidden-by-default Tools & Entities
// Chat channel: Disabled, faded, "Soon" badge

(function (global) {
  function TryItModal() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent || !state.tryItOpen) return '';

    const tryIt = state.tryIt;
    const activeTab = tryIt.channel || (agent.channels.voice ? 'voice' : 'email');
    const speechStackName = (agent.voiceModelOverride?.speechStack === 'realtime' || agent.speechStack === 'realtime')
      ? 'Realtime Voice'
      : 'Cascaded STT/TTS';

    function formatTimer(secs) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return html`
      <div className="drawer-backdrop" onClick=${() => actions.closeTryIt()}>
        <div className="drawer-workspace" id="try-it-drawer" onClick=${(e) => e.stopPropagation()}>
        <!-- ================= 1. DRAWER HEADER ================= -->
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${renderIcon('play', { size: 18 })}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary);">
                  Try It — ${agent.name}
                </h3>
                <span className="badge badge-unsaved" style="font-size: 10px;">Unpublished Sandbox</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 1px;">
                Testing active configuration safely without impacting published routing.
              </div>
            </div>
          </div>

          <button 
            className="btn-icon" 
            onClick=${() => actions.closeTryIt()} 
            id="btn-close-try-it"
            title="Close Try It drawer"
          >
            ${renderIcon('x', { size: 18 })}
          </button>
        </div>

        <!-- ================= 2. CHANNEL SELECTOR & ARCHITECTURE LABEL ================= -->
        <div style="padding: 10px 24px; background: #F8FAFC; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap; gap: 10px;">
          <div className="radio-pill-group">
            <!-- Voice Tab (selectable if enabled) -->
            <div 
              className="radio-pill ${activeTab === 'voice' ? 'active' : ''} ${!agent.channels.voice ? 'disabled' : ''}"
              onClick=${() => actions.setTryItChannel('voice')}
              style="display: flex; align-items: center; gap: 6px; cursor: ${agent.channels.voice ? 'pointer' : 'not-allowed'}; opacity: ${agent.channels.voice ? 1 : 0.45};"
              title="${agent.channels.voice ? 'Test Voice Channel' : 'Voice is not enabled for this agent'}"
            >
              ${renderIcon('phone', { size: 14 })}
              <span>Voice</span>
              ${!agent.channels.voice ? html`<span style="font-size: 10px; color: var(--text-muted);">(Disabled)</span>` : ''}
            </div>

            <!-- Email Tab (selectable if enabled) -->
            <div 
              className="radio-pill ${activeTab === 'email' ? 'active' : ''} ${!agent.channels.email ? 'disabled' : ''}"
              onClick=${() => actions.setTryItChannel('email')}
              style="display: flex; align-items: center; gap: 6px; cursor: ${agent.channels.email ? 'pointer' : 'not-allowed'}; opacity: ${agent.channels.email ? 1 : 0.45};"
              title="${agent.channels.email ? 'Test Email Channel' : 'Email is not enabled for this agent'}"
            >
              ${renderIcon('mail', { size: 14 })}
              <span>Email</span>
              ${!agent.channels.email ? html`<span style="font-size: 10px; color: var(--text-muted);">(Disabled)</span>` : ''}
            </div>

            <!-- Chat Tab (Disabled & Faded, Displays Soon) -->
            <div 
              className="radio-pill disabled"
              style="display: flex; align-items: center; gap: 6px; cursor: not-allowed; opacity: 0.45; pointer-events: none;"
              title="Chat channel is Coming Soon"
            >
              ${renderIcon('message-circle', { size: 14 })}
              <span>Chat</span>
              <span className="badge badge-coming-soon" style="font-size: 9px; padding: 1px 5px; text-transform: uppercase;">Soon</span>
            </div>
          </div>

          <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
            <span>Architecture:</span>
            <strong style="color: var(--text-primary);">${speechStackName}</strong>
          </div>
        </div>

        <!-- ================= 3. VOICE TESTING CONTENT ================= -->
        ${activeTab === 'voice' ? html`
          <div className="call-simulation-container" style="flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;">
            
            <!-- A. INITIAL VOICE TESTING SCREEN (Idle State) -->
            ${tryIt.voiceState === 'idle' ? html`
              <div style="flex: 1; overflow-y: auto; padding: 40px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; max-width: 580px; margin: 0 auto; width: 100%;">
                
                <div style="width: 68px; height: 68px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(56, 112, 233, 0.16);">
                  ${renderIcon('phone', { size: 30 })}
                </div>

                <h3 style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
                  Voice Testing Sandbox
                </h3>
                
                <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 22px;">
                  Ready to test <strong>"${agent.name}"</strong> on <strong>${speechStackName}</strong> architecture.
                </div>

                <!-- Testing Instructions Card -->
                <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px 22px; text-align: left; width: 100%; margin-bottom: 28px; box-shadow: var(--shadow-sm);">
                  <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    ${renderIcon('info', { size: 14, color: 'var(--color-primary)' })}
                    <span>Testing Instructions</span>
                  </div>
                  <ul style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-left: 18px;">
                    <li>Click <strong>Start Call</strong> to initiate an active call session with this agent.</li>
                    <li>Verify live caller/agent speech turns, audio responsiveness, and tool executions.</li>
                    <li>Use the live telephony controls to test <strong>Mute/Unmute</strong> and <strong>Show/Hide Transcript</strong>.</li>
                    <li>Click <strong>End Call</strong> to review the call duration, caller disposition, and full logs.</li>
                  </ul>
                  
                  <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; gap: 8px;">
                    <span>STT: Whisper Large v3</span>
                    <span>•</span>
                    <span>LLM: ${agent.sharedModel.model}</span>
                    <span>•</span>
                    <span>Noise: FFmpeg</span>
                  </div>
                </div>

                <!-- Start Call Action Button -->
                <button 
                  className="btn btn-primary btn-lg"
                  style="padding: 12px 36px; font-size: 15px; font-weight: 700; gap: 10px; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(56, 112, 233, 0.28);"
                  onClick=${() => actions.startVoiceCall()}
                  id="btn-start-call"
                >
                  ${renderIcon('phone', { size: 18, color: '#FFFFFF' })}
                  <span>Start Call</span>
                </button>
              </div>
            ` : ''}

            <!-- B. ACTIVE CALL OR ENDED CALL INTERFACE -->
            ${tryIt.voiceState !== 'idle' ? html`
              <div style="display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;">
                
                <!-- Telephony Controls Bar -->
                <div className="call-header-card" style="padding: 12px 20px; background: #FFFFFF; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span 
                        className="${tryIt.voiceState === 'live' ? 'pulsing-dot' : ''}" 
                        style="width: 10px; height: 10px; border-radius: 50%; background: ${tryIt.voiceState === 'live' ? 'var(--color-success)' : 'var(--text-muted)'}; display: inline-block;"
                      ></span>
                      <span style="font-weight: 700; font-size: 13px; text-transform: uppercase; color: ${tryIt.voiceState === 'live' ? 'var(--color-success)' : 'var(--text-muted)'};">
                        ${tryIt.voiceState === 'live' ? 'Live Call' : 'Call Ended'}
                      </span>
                    </div>

                    <span style="color: var(--border-color);">|</span>

                    <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                      ${agent.name}
                    </span>

                    <div className="call-timer" style="font-family: monospace; font-size: 16px; font-weight: 700; padding: 2px 10px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                      ${formatTimer(tryIt.callSeconds)}
                    </div>
                  </div>

                  <!-- Telephony Action Buttons -->
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <!-- Mute / Unmute -->
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick=${() => actions.toggleVoiceMute()}
                      disabled=${tryIt.voiceState !== 'live'}
                      title="${tryIt.isMuted ? 'Unmute microphone' : 'Mute microphone'}"
                    >
                      ${renderIcon(tryIt.isMuted ? 'mic-off' : 'mic', { size: 14, color: tryIt.isMuted ? 'var(--color-error)' : 'currentColor' })}
                      <span>${tryIt.isMuted ? 'Muted' : 'Mute'}</span>
                    </button>

                    <!-- Show / Hide Transcript -->
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick=${() => actions.toggleVoiceTranscript()}
                      title="Toggle transcript view"
                    >
                      ${renderIcon('file-text', { size: 14 })}
                      <span>${tryIt.showTranscript ? 'Hide Transcript' : 'Show Transcript'}</span>
                    </button>

                    <!-- End Call / Call Again -->
                    ${tryIt.voiceState === 'live' ? html`
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick=${() => actions.endVoiceCall('Caller')}
                        id="btn-end-call"
                      >
                        ${renderIcon('phone-off', { size: 13, color: '#FFFFFF' })}
                        <span>End Call</span>
                      </button>
                    ` : html`
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick=${() => actions.startVoiceCall()}
                        id="btn-call-again-header"
                      >
                        ${renderIcon('phone', { size: 13, color: '#FFFFFF' })}
                        <span>Call Again</span>
                      </button>
                    `}
                  </div>
                </div>

                <!-- Call Ended Summary Banner (when callStatus === 'ended') -->
                ${tryIt.voiceState === 'ended' ? html`
                  <div style="background: #F8FAFC; border-bottom: 1px solid var(--border-color); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap; gap: 12px; animation: fadeIn 0.15s ease-out;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span className="badge badge-draft" style="font-size: 11px;">Completed</span>
                        <strong style="font-size: 14px; color: var(--text-primary);">${tryIt.callEndedBy || 'Caller ended the call'}</strong>
                      </div>
                      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
                        Total Call Duration: <strong>${formatTimer(tryIt.callSeconds)}</strong> · Turns Recorded: <strong>${tryIt.voiceTurns.length}</strong>
                      </div>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick=${() => actions.addToast(`Call Log: ${tryIt.voiceTurns.length} turns recorded, duration ${formatTimer(tryIt.callSeconds)}.`, 'info')}
                      >
                        ${renderIcon('file-text', { size: 13 })}
                        <span>View Call Logs</span>
                      </button>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick=${() => actions.startVoiceCall()}
                        id="btn-call-again-banner"
                      >
                        ${renderIcon('refresh-cw', { size: 13, color: '#FFFFFF' })}
                        <span>Call Again</span>
                      </button>
                    </div>
                  </div>
                ` : ''}

                <!-- Live Transcript Area -->
                ${tryIt.showTranscript ? html`
                  <div className="transcript-feed" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #FFFFFF;">
                    ${tryIt.voiceTurns.map((turn, idx) => html`
                      <div 
                        key=${idx}
                        className="turn-bubble ${turn.speaker === 'caller' ? 'turn-caller' : 'turn-agent'}"
                      >
                        <div style="font-size: 11px; font-weight: 700; margin-bottom: 3px; opacity: 0.85; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                          <span>${turn.speaker === 'caller' ? 'Caller (You)' : agent.name}</span>
                          <span>${turn.timestamp}</span>
                        </div>
                        
                        <div style="line-height: 1.5; font-size: 14px;">${turn.text}</div>

                        <!-- Tool execution badge -->
                        ${turn.tool ? html`
                          <div style="margin-top: 6px;">
                            <span className="turn-tool-badge">
                              ${renderIcon('wrench', { size: 12 })}
                              <span>Tool executed: <strong>${turn.tool}</strong></span>
                            </span>
                          </div>
                        ` : ''}
                      </div>
                    `)}
                  </div>
                ` : html`
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; gap: 8px; background: #FAFAFB;">
                    ${renderIcon('file-text', { size: 28, color: 'var(--text-muted)' })}
                    <div>Transcript hidden. Click <strong>"Show Transcript"</strong> above to restore live turns.</div>
                  </div>
                `}

                <!-- Voice Simulator Caller Controls (Interactive Prompts & Custom Utterance) -->
                ${tryIt.voiceState === 'live' ? html`
                  <div style="padding: 14px 20px; background: #FAFAFB; border-top: 1px solid var(--border-color); flex-shrink: 0; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em;">
                        Simulate Spoken Caller Utterance:
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted);">
                        Click chip or type below
                      </div>
                    </div>

                    <!-- Quick Pre-baked Spoken Prompt Chips -->
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick=${() => actions.sendVoiceCallerTurn('Hello, I want to check my insurance claim status.')}
                        style="font-size: 12px;"
                      >
                        "Check my claim status"
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick=${() => actions.sendVoiceCallerTurn('My claim reference number is CLM-98234.')}
                        style="font-size: 12px;"
                      >
                        "Reference CLM-98234"
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick=${() => actions.sendVoiceCallerTurn('Can you transfer me to a human representative?')}
                        style="font-size: 12px;"
                      >
                        "Transfer to representative"
                      </button>
                    </div>

                    <!-- Custom Spoken Input Field -->
                    <form 
                      style="display: flex; gap: 8px;"
                      onSubmit=${(e) => {
                        e.preventDefault();
                        if (tryIt.customCallerInput?.trim()) {
                          actions.sendVoiceCallerTurn(tryIt.customCallerInput);
                        }
                      }}
                    >
                      <input 
                        type="text" 
                        className="form-input" 
                        style="flex: 1;"
                        placeholder="Or type what caller says into microphone..."
                        value=${tryIt.customCallerInput || ''}
                        onInput=${(e) => actions.setTryItCallerInput(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled=${!tryIt.customCallerInput?.trim()}
                      >
                        ${renderIcon('send', { size: 14, color: '#FFFFFF' })}
                        <span>Speak</span>
                      </button>
                    </form>
                  </div>
                ` : ''}

              </div>
            ` : ''}

          </div>
        ` : ''}

        <!-- ================= 4. EMAIL TESTING CONTENT ================= -->
        ${activeTab === 'email' ? html`
          <div style="flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Clear Prototype Simulation Notice Banner -->
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${renderIcon('info', { size: 16, color: 'var(--color-primary)' })}
                <span style="font-size: 13px; color: var(--text-secondary);">
                  <strong>Simulated Email Sandbox:</strong> This test runs locally. Nothing is delivered to external mail servers or real email addresses.
                </span>
              </div>
              
              ${tryIt.emailThread.length > 0 ? html`
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick=${() => actions.newTestEmail()}
                  id="btn-new-test-email"
                >
                  ${renderIcon('plus', { size: 13 })}
                  <span>New Test Email</span>
                </button>
              ` : ''}
            </div>

            <!-- Email Compose Form -->
            <div className="card" style="margin-bottom: 0;">
              
              <!-- From and To Read-only Row -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label className="form-label" style="display: flex; align-items: center; gap: 6px;">
                    ${renderIcon('lock', { size: 12, color: 'var(--text-muted)' })}
                    <span>From (Signed-in User, Read-only)</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value=${tryIt.emailFrom} 
                    disabled 
                    style="background: #F3F4F6; color: var(--text-secondary); cursor: not-allowed;"
                  />
                </div>
                
                <div>
                  <label className="form-label" style="display: flex; align-items: center; gap: 6px;">
                    ${renderIcon('lock', { size: 12, color: 'var(--text-muted)' })}
                    <span>To (Agent Mailbox, Read-only)</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value=${agent.emailSettings?.inbox?.mailboxes?.[0]?.address || 'support@acme.enterprisebot.ai'} 
                    disabled 
                    style="background: #F3F4F6; color: var(--text-secondary); cursor: not-allowed;"
                  />
                </div>
              </div>

              <!-- Subject Input (Required) -->
              <div className="form-group">
                <label className="form-label required">
                  Subject
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Request for claim status update"
                  value=${tryIt.emailSubject || ''}
                  onInput=${(e) => actions.setTryItEmailSubject(e.target.value)}
                />
              </div>

              <!-- Body Editor (Required) -->
              <div className="form-group">
                <label className="form-label required">
                  Message Body
                </label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  placeholder="Hello, I submitted my insurance claim last week (reference CLM-98234). Could you please provide an update?"
                  value=${tryIt.emailBody || ''}
                  onInput=${(e) => actions.setTryItEmailBody(e.target.value)}
                ></textarea>
              </div>

              <!-- Action Bar & Quick Templates -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 4px;">
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick=${() => {
                      actions.setTryItEmailSubject('Request for claim status');
                      actions.setTryItEmailBody('Hello, I submitted my insurance claim last week (reference CLM-98234). Could you please provide an update on when the adjuster will review it?');
                    }}
                  >
                    Template: Claim Inquiry
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick=${() => {
                      actions.setTryItEmailSubject('Billing invoice clarification');
                      actions.setTryItEmailBody('Hi support team, I noticed an unexpected deductible charge on my latest statement. Can you verify this for me?');
                    }}
                  >
                    Template: Billing Question
                  </button>
                </div>

                <!-- Send Button (Disabled until both Subject and Body are filled) -->
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick=${() => actions.sendTryItEmail()}
                  disabled=${!tryIt.emailSubject?.trim() || !tryIt.emailBody?.trim() || tryIt.isReplying}
                  id="btn-send-test-email"
                >
                  ${tryIt.isReplying ? html`
                    <span className="pulsing-dot" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: white;"></span>
                    <span>Sending & Replying…</span>
                  ` : html`
                    ${renderIcon('send', { size: 14, color: '#FFFFFF' })}
                    <span>Send Test Email</span>
                  `}
                </button>
              </div>
            </div>

            <!-- Email Thread Messages -->
            <div className="email-thread" style="display: flex; flex-direction: column; gap: 14px;">
              
              <!-- Writing a reply state indicator -->
              ${tryIt.isReplying ? html`
                <div style="padding: 16px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); display: flex; align-items: center; gap: 10px; color: var(--text-secondary); box-shadow: var(--shadow-sm); animation: fadeIn 0.15s ease-out;">
                  <span className="pulsing-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);"></span>
                  <span style="font-size: 13px; font-weight: 600; color: var(--color-primary);">
                    Writing a reply using ${agent.sharedModel.model}…
                  </span>
                </div>
              ` : ''}

              <!-- Thread Message Cards -->
              ${tryIt.emailThread.map(msg => {
                const detailsExpanded = Boolean(tryIt.expandedDetails[msg.id]);

                return html`
                  <div key=${msg.id} className="email-message-card">
                    <!-- Message Header with Expand / Collapse Toggle -->
                    <div 
                      className="email-message-header" 
                      onClick=${() => actions.toggleTryItEmailMessage(msg.id)}
                      style="user-select: none;"
                    >
                      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span className="badge ${msg.type === 'user' ? 'badge-draft' : 'badge-published'}">
                          ${msg.type === 'user' ? 'Inbound' : 'Agent Reply'}
                        </span>
                        <strong style="font-size: 14px; color: var(--text-primary);">${msg.subject}</strong>
                        <span style="font-size: 12px; color: var(--text-secondary);">${'<' + msg.sender + '>'}</span>
                      </div>
                      
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 12px; color: var(--text-muted);">${msg.timestamp}</span>
                        ${renderIcon(msg.isExpanded ? 'chevron-up' : 'chevron-down', { size: 16, color: 'var(--text-muted)' })}
                      </div>
                    </div>

                    <!-- Message Body (Expanded by default for newest message) -->
                    ${msg.isExpanded ? html`
                      <div className="email-message-body" style="padding: 18px 20px; font-size: 14px; line-height: 1.6;">
                        <div style="white-space: pre-wrap; color: var(--text-primary);">${msg.body}</div>

                        <!-- Agent Replies: Execution Details (Tools Used & Extracted Entities, Hidden by Default) -->
                        ${msg.type === 'agent' ? html`
                          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-color);">
                            <!-- Toggle Button to reveal/hide details -->
                            <button 
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick=${(e) => {
                                e.stopPropagation();
                                actions.toggleTryItEmailDetails(msg.id);
                              }}
                              style="font-size: 12px; gap: 6px;"
                            >
                              ${renderIcon(detailsExpanded ? 'chevron-up' : 'chevron-down', { size: 13 })}
                              <span>
                                ${detailsExpanded 
                                  ? 'Hide Execution Details' 
                                  : `Show Execution Details (${msg.toolsUsed?.length || 0} Tools, ${msg.extractedEntities?.length || 0} Entities)`
                                }
                              </span>
                            </button>

                            <!-- Hidden-by-default execution details container -->
                            ${detailsExpanded ? html`
                              <div style="margin-top: 14px; padding: 14px 16px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 14px; animation: fadeIn 0.15s ease-out;">
                                
                                <!-- Tools Used -->
                                ${msg.toolsUsed && msg.toolsUsed.length > 0 ? html`
                                  <div>
                                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.04em;">
                                      Tools Executed During Reply Generation:
                                    </div>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                      ${msg.toolsUsed.map(t => html`
                                        <span key=${t} className="turn-tool-badge" style="margin: 0;">
                                          ${renderIcon('wrench', { size: 12 })}
                                          <span>${t}</span>
                                        </span>
                                      `)}
                                    </div>
                                  </div>
                                ` : ''}

                                <!-- Extracted Entities Table -->
                                ${msg.extractedEntities && msg.extractedEntities.length > 0 ? html`
                                  <div>
                                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; letter-spacing: 0.04em;">
                                      Extracted Entities & Confidence:
                                    </div>
                                    <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow-x: auto;">
                                      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                        <thead>
                                          <tr style="background: #F1F5F9; text-align: left; color: var(--text-secondary);">
                                            <th style="padding: 6px 12px;">Entity Key</th>
                                            <th style="padding: 6px 12px;">Extracted Value</th>
                                            <th style="padding: 6px 12px;">Confidence Score</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          ${msg.extractedEntities.map(e => html`
                                            <tr key=${e.name} style="border-top: 1px solid var(--border-color);">
                                              <td style="padding: 6px 12px; font-family: monospace; font-weight: 600; color: var(--color-primary);">${e.name}</td>
                                              <td style="padding: 6px 12px; font-weight: 500;">${e.value}</td>
                                              <td style="padding: 6px 12px; color: var(--color-success); font-weight: 700;">${e.confidence}</td>
                                            </tr>
                                          `)}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ` : ''}

                              </div>
                            ` : ''}
                          </div>
                        ` : ''}

                      </div>
                    ` : ''}

                  </div>
                `;
              })}

            </div>

          </div>
        ` : ''}

        </div>
      </div>
    `;
  }

  global.TryItModal = TryItModal;
})(window);