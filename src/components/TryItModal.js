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
    const effectiveStack = (typeof window.getEffectiveSpeechStack === 'function')
      ? window.getEffectiveSpeechStack(agent)
      : (agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack) || 'cascaded';
    const speechStackName = effectiveStack === 'realtime'
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
            <!-- Voice Tab (Selected by default) -->
            <div 
              className="radio-pill active"
              style="display: flex; align-items: center; gap: 6px; cursor: default;"
              title="Test Voice Channel (Active)"
            >
              ${renderIcon('phone', { size: 14, color: 'var(--color-primary)' })}
              <span>Voice</span>
            </div>

            <!-- Chat Tab (Disabled & Faded, Displays Soon) -->
            <div 
              className="radio-pill disabled"
              style="display: flex; align-items: center; gap: 6px; cursor: not-allowed; opacity: 0.45; pointer-events: none;"
              tabIndex="-1"
              aria-disabled="true"
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
                        onClick=${() => actions.toggleCallLogs()}
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
        </div>

        ${tryIt.callLogsOpen ? html`
          <div className="modal-backdrop" onClick=${() => actions.toggleCallLogs()} style="z-index: 1050; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
            <div className="modal-dialog" onClick=${(e) => e.stopPropagation()} style="background: #FFFFFF; border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); max-width: 620px; width: 90%; overflow: hidden; display: flex; flex-direction: column;">
              <div className="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${renderIcon('file-text', { size: 18, color: 'var(--color-primary)' })}
                  <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary);">Call Logs — ${agent.name}</h3>
                </div>
                <button className="btn-icon" onClick=${() => actions.toggleCallLogs()}>
                  ${renderIcon('x', { size: 16 })}
                </button>
              </div>
              <div className="modal-body" style="padding: 20px; max-height: 480px; overflow-y: auto;">
                ${(!tryIt.callHistory || tryIt.callHistory.length === 0) ? html`
                  <div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 13px;">
                    No completed calls recorded yet. End a live call session to generate a call log.
                  </div>
                ` : html`
                  <div style="display: flex; flex-direction: column; gap: 14px;">
                    ${tryIt.callHistory.map(log => html`
                      <div key=${log.id} style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-family: monospace; font-weight: 700; font-size: 13px; color: var(--color-primary);">${log.sessionId}</span>
                            <span className="badge badge-published" style="font-size: 10px;">${log.endedBy}</span>
                          </div>
                          <span style="font-size: 12px; color: var(--text-muted);">${log.timestamp}</span>
                        </div>
                        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                          <span>Duration: <strong>${formatTimer(log.duration)}</strong></span>
                          <span>Turns: <strong>${log.turnsCount}</strong></span>
                          <span>Stack: <strong>${speechStackName}</strong></span>
                        </div>
                        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: var(--radius-sm); padding: 10px; max-height: 140px; overflow-y: auto; font-size: 12px; line-height: 1.4;">
                          ${log.turns.map(t => html`
                            <div key=${t.timestamp + t.speaker} style="margin-bottom: 6px;">
                              <strong style="color: ${t.speaker === 'caller' ? 'var(--color-primary)' : '#10B981'}; text-transform: capitalize;">${t.speaker}</strong>
                              <span style="color: var(--text-muted); font-size: 11px; margin-left: 6px;">[${t.timestamp}]</span>:
                              <span> ${t.text}</span>
                              ${t.tool ? html`
                                <span className="badge badge-draft" style="font-size: 10px; margin-left: 6px;">Tool: ${t.tool}</span>
                              ` : ''}
                            </div>
                          `)}
                        </div>
                      </div>
                    `)}
                  </div>
                `}
              </div>
              <div className="modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button className="btn btn-secondary btn-sm" onClick=${() => actions.toggleCallLogs()}>
                  Close Logs
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  global.TryItModal = TryItModal;
})(window);