// Screen 09: Try It Testing Workspace Component
// Voice testing (live timer, mute/unmute, transcript toggle, tool execution tags, call ended summary)
// Email testing (From/To, subject/body, writing reply simulation, signature, tools used, extracted entities)
// Chat testing (Coming Soon, disabled)

(function (global) {
  function TryItModal() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent || !state.tryItOpen) return '';

    // Active testing tab
    const [activeTab, setActiveTab] = React.useState(state.tryItChannel || (agent.channels.voice ? 'voice' : 'email'));

    // VOICE TEST STATE
    const [callStatus, setCallStatus] = React.useState('live'); // 'live' | 'ended'
    const [seconds, setSeconds] = React.useState(0);
    const [isMuted, setIsMuted] = React.useState(false);
    const [showTranscript, setShowTranscript] = React.useState(true);
    const [callEndedBy, setCallEndedBy] = React.useState('');
    const [voiceTurns, setVoiceTurns] = React.useState([
      {
        speaker: 'agent',
        text: agent.welcomeMessage || 'Hello! Thank you for calling Acme Support. How can I help you today?',
        tool: null,
        timestamp: '00:01'
      }
    ]);
    const [voiceTurnStep, setVoiceTurnStep] = React.useState(0);

    // Live timer effect
    React.useEffect(() => {
      let interval = null;
      if (callStatus === 'live') {
        interval = setInterval(() => {
          setSeconds(s => s + 1);
        }, 1000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [callStatus]);

    function formatTimer(secs) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function endCall(endedBy = 'Caller') {
      setCallStatus('ended');
      setCallEndedBy(`${endedBy} ended the call`);
    }

    function startCallAgain() {
      setCallStatus('live');
      setSeconds(0);
      setVoiceTurnStep(0);
      setCallEndedBy('');
      setVoiceTurns([
        {
          speaker: 'agent',
          text: agent.welcomeMessage || 'Hello! Thank you for calling Acme Support. How can I help you today?',
          tool: null,
          timestamp: '00:01'
        }
      ]);
    }

    function sendVoicePrompt(promptText) {
      if (callStatus !== 'live') return;

      const currentSec = formatTimer(seconds);
      const nextTurns = [
        ...voiceTurns,
        { speaker: 'caller', text: promptText, timestamp: currentSec }
      ];
      setVoiceTurns(nextTurns);

      // Simulate Agent turn progression
      setTimeout(() => {
        let reply = '';
        let tool = null;

        if (promptText.includes('claim status') || promptText.includes('insurance claim')) {
          reply = 'Certainly! I can help you with that. Could you please share your claim reference number?';
          tool = 'kb_search';
        } else if (promptText.includes('CLM-98234') || promptText.includes('reference')) {
          reply = 'Thank you! I located claim CLM-98234 for water damage repair. The claim was approved on Oct 24th and reimbursement will be issued to your bank within 2 business days.';
          tool = 'crm_lookup_policy';
        } else if (promptText.includes('representative') || promptText.includes('human')) {
          reply = 'I understand. Let me transfer you directly to our senior claims specialist queue. Please hold for just a moment.';
          tool = 'calendar_scheduler';
        } else {
          reply = `I have received your inquiry regarding "${promptText}". Querying internal records now...`;
          tool = agent.assignedTools[0] || 'kb_search';
        }

        setVoiceTurns(prev => [
          ...prev,
          { speaker: 'agent', text: reply, tool, timestamp: formatTimer(seconds + 1) }
        ]);
        setVoiceTurnStep(s => s + 1);
      }, 750);
    }

    // EMAIL TEST STATE
    const [emailSubject, setEmailSubject] = React.useState('');
    const [emailBody, setEmailBody] = React.useState('');
    const [isReplying, setIsReplying] = React.useState(false);
    const [emailThread, setEmailThread] = React.useState([]);

    function handleSendEmail() {
      if (!emailSubject.trim() || !emailBody.trim()) return;

      const sentMsg = {
        id: 'msg_' + Date.now(),
        sender: 'pallavi.user@enterprise.com',
        recipient: agent.emailSettings.inbox.mailboxes[0]?.address || 'support@acme.enterprisebot.ai',
        subject: emailSubject,
        body: emailBody,
        timestamp: 'Just now',
        isOpen: true,
        type: 'user'
      };

      setEmailThread(prev => [...prev, sentMsg]);
      setIsReplying(true);

      // Simulate AI response
      setTimeout(() => {
        const sig = agent.emailSettings.threading.appendSignature
          ? (agent.emailSettings.threading.signatureType === 'Agent signature'
              ? agent.emailSettings.threading.agentSignatureText
              : 'Best regards,\nCustomer Support AI Team\nAcme Enterprise')
          : '';

        let generatedBody = `Hello,\n\nThank you for reaching out regarding "${emailSubject}".\n\nOur system has reviewed your request. Your claim reference CLM-98234 is currently in final review with all required documentation attached. A confirmation has been logged to your account.\n\n${sig}`;

        const agentMsg = {
          id: 'msg_' + (Date.now() + 1),
          sender: agent.emailSettings.threading.personAddress || 'support.rep@acme.enterprisebot.ai',
          recipient: 'pallavi.user@enterprise.com',
          subject: 'Re: ' + emailSubject,
          body: generatedBody,
          timestamp: 'Just now',
          isOpen: true,
          type: 'agent',
          toolsUsed: ['crm_lookup_policy', 'kb_search'],
          extractedEntities: [
            { name: 'claim_id', value: 'CLM-98234', confidence: '98%' },
            { name: 'customer_name', value: 'Pallavi BG', confidence: '95%' },
            { name: 'intent', value: 'claim_status_inquiry', confidence: '99%' }
          ]
        };

        setEmailThread(prev => [...prev, agentMsg]);
        setIsReplying(false);
        setEmailSubject('');
        setEmailBody('');
      }, 1100);
    }

    function toggleMessage(id) {
      setEmailThread(prev => prev.map(m => m.id === id ? { ...m, isOpen: !m.isOpen } : m));
    }

    return html`
      <div className="drawer-workspace" id="try-it-drawer">
        <!-- Drawer Header -->
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center;">
              ${renderIcon('play', { size: 16 })}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 16px; font-weight: 700; margin: 0;">Try It — ${agent.name}</h3>
                <span className="badge badge-unsaved" style="font-size: 10px;">Unpublished Sandbox</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Testing your active in-memory configuration without impacting published agents.
              </div>
            </div>
          </div>

          <button className="btn-icon" onClick=${() => actions.closeTryIt()} id="btn-close-try-it">
            ${renderIcon('x', { size: 18 })}
          </button>
        </div>

        <!-- Testing Channel Switcher -->
        <div style="padding: 10px 24px; background: #F8FAFC; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
          <div className="radio-pill-group">
            <!-- Voice Tab (only enabled if agent has voice) -->
            <div 
              className="radio-pill ${activeTab === 'voice' ? 'active' : ''} ${!agent.channels.voice ? 'disabled' : ''}"
              onClick=${() => { if (agent.channels.voice) setActiveTab('voice'); }}
              style="display: flex; align-items: center; gap: 6px; cursor: ${agent.channels.voice ? 'pointer' : 'not-allowed'}; opacity: ${agent.channels.voice ? 1 : 0.5};"
            >
              ${renderIcon('phone', { size: 14 })}
              <span>Voice</span>
              ${!agent.channels.voice ? html`<span style="font-size: 10px; color: var(--text-muted);">(Disabled)</span>` : ''}
            </div>

            <!-- Email Tab (only enabled if agent has email) -->
            <div 
              className="radio-pill ${activeTab === 'email' ? 'active' : ''} ${!agent.channels.email ? 'disabled' : ''}"
              onClick=${() => { if (agent.channels.email) setActiveTab('email'); }}
              style="display: flex; align-items: center; gap: 6px; cursor: ${agent.channels.email ? 'pointer' : 'not-allowed'}; opacity: ${agent.channels.email ? 1 : 0.5};"
            >
              ${renderIcon('mail', { size: 14 })}
              <span>Email</span>
              ${!agent.channels.email ? html`<span style="font-size: 10px; color: var(--text-muted);">(Disabled)</span>` : ''}
            </div>

            <!-- Chat Tab (Coming Soon, Disabled) -->
            <div 
              className="radio-pill disabled"
              style="display: flex; align-items: center; gap: 6px; cursor: not-allowed; opacity: 0.5;"
              title="Chat channel is Coming Soon"
            >
              ${renderIcon('message-circle', { size: 14 })}
              <span>Chat</span>
              <span className="badge badge-coming-soon" style="font-size: 9px; padding: 1px 4px;">Coming Soon</span>
            </div>
          </div>

          <div style="font-size: 12px; color: var(--text-muted);">
            Architecture: <strong>${agent.speechStack === 'realtime' ? 'Realtime Voice' : 'Cascaded STT/TTS'}</strong>
          </div>
        </div>

        <!-- ================= A. VOICE TESTING ================= -->
        ${activeTab === 'voice' ? html`
          <div className="call-simulation-container">
            <!-- Call Status & Telephony Controls Bar -->
            <div className="call-header-card">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span 
                    className="${callStatus === 'live' ? 'pulsing-dot' : ''}" 
                    style="width: 10px; height: 10px; border-radius: 50%; background: ${callStatus === 'live' ? 'var(--color-success)' : 'var(--text-muted)'}; display: inline-block;"
                  ></span>
                  <span style="font-weight: 700; font-size: 13px; text-transform: uppercase; color: ${callStatus === 'live' ? 'var(--color-success)' : 'var(--text-muted)'};">
                    ${callStatus === 'live' ? 'Live Call' : 'Call Ended'}
                  </span>
                </div>

                <div className="call-timer">
                  ${formatTimer(seconds)}
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick=${() => setIsMuted(!isMuted)}
                  disabled=${callStatus !== 'live'}
                  title="${isMuted ? 'Unmute microphone' : 'Mute microphone'}"
                >
                  ${renderIcon(isMuted ? 'mic-off' : 'mic', { size: 14, color: isMuted ? 'var(--color-error)' : 'currentColor' })}
                  <span>${isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button 
                  className="btn btn-secondary btn-sm"
                  onClick=${() => setShowTranscript(!showTranscript)}
                >
                  ${renderIcon('file-text', { size: 14 })}
                  <span>${showTranscript ? 'Hide Transcript' : 'Show Transcript'}</span>
                </button>

                ${callStatus === 'live' ? html`
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick=${() => endCall('Caller')}
                    id="btn-end-call"
                  >
                    ${renderIcon('square', { size: 13 })}
                    <span>End Call</span>
                  </button>
                ` : html`
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick=${startCallAgain}
                    id="btn-call-again"
                  >
                    ${renderIcon('phone', { size: 13, color: '#FFFFFF' })}
                    <span>Call Again</span>
                  </button>
                `}
              </div>
            </div>

            <!-- Call Ended Summary Banner -->
            ${callStatus === 'ended' ? html`
              <div style="background: #F8FAFC; border-bottom: 1px solid var(--border-color); padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${callEndedBy}</div>
                  <div style="font-size: 12px; color: var(--text-secondary);">
                    Total Call Duration: <strong>${formatTimer(seconds)}</strong> · Turns Recorded: ${voiceTurns.length}
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button className="btn btn-secondary btn-sm" onClick=${() => actions.addToast('Call logs exported to JSON.', 'info')}>
                    ${renderIcon('file-text', { size: 13 })}
                    <span>View Call Logs</span>
                  </button>
                  <button className="btn btn-primary btn-sm" onClick=${startCallAgain}>
                    ${renderIcon('refresh-cw', { size: 13, color: '#FFFFFF' })}
                    <span>Call Again</span>
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Live Transcript Feed -->
            ${showTranscript ? html`
              <div className="transcript-feed">
                ${voiceTurns.map((turn, idx) => html`
                  <div 
                    key=${idx}
                    className="turn-bubble ${turn.speaker === 'caller' ? 'turn-caller' : 'turn-agent'}"
                  >
                    <div style="font-size: 11px; font-weight: 700; margin-bottom: 2px; opacity: 0.8; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                      <span>${turn.speaker === 'caller' ? 'Caller (You)' : agent.name}</span>
                      <span>${turn.timestamp}</span>
                    </div>
                    <div>${turn.text}</div>

                    ${turn.tool ? html`
                      <div>
                        <span className="turn-tool-badge">
                          ${renderIcon('wrench', { size: 12 })}
                          <span>Tool executed: ${turn.tool}</span>
                        </span>
                      </div>
                    ` : ''}
                  </div>
                `)}
              </div>
            ` : html`
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px;">
                Transcript hidden. Click "Show Transcript" above to restore turn view.
              </div>
            `}

            <!-- Voice Simulator Quick Turn Prompts -->
            ${callStatus === 'live' ? html`
              <div style="padding: 16px 20px; background: #FAFAFB; border-top: 1px solid var(--border-color); flex-shrink: 0;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
                  Simulate Caller Spoken Turn:
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => sendVoicePrompt('Hello, I want to check my insurance claim status.')}
                  >
                    "Check my claim status"
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => sendVoicePrompt('My claim reference number is CLM-98234.')}
                  >
                    "Reference CLM-98234"
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => sendVoicePrompt('Can you transfer me to a human representative?')}
                  >
                    "Transfer to representative"
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- ================= B. EMAIL TESTING ================= -->
        ${activeTab === 'email' ? html`
          <div style="flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px;">
            <!-- Test Disclaimer Warning -->
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${renderIcon('info', { size: 16, color: 'var(--color-primary)' })}
                <span style="font-size: 13px; color: var(--text-secondary);">
                  <strong>Test Environment:</strong> Nothing is delivered to a real mailbox. Responses are generated by the configured model.
                </span>
              </div>
              ${emailThread.length > 0 ? html`
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick=${() => {
                    setEmailThread([]);
                    actions.addToast('Fresh email test thread started.', 'info');
                  }}
                >
                  ${renderIcon('plus', { size: 13 })}
                  <span>New Test Email</span>
                </button>
              ` : ''}
            </div>

            <!-- Email Compose Form -->
            <div className="card" style="margin-bottom: 0;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div>
                  <label className="form-label">From (Signed-in User)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value="pallavi.user@enterprise.com" 
                    disabled 
                    style="background: #F3F4F6;"
                  />
                </div>
                <div>
                  <label className="form-label">To (Agent Mailbox)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value=${agent.emailSettings.inbox.mailboxes[0]?.address || 'support@acme.enterprisebot.ai'} 
                    disabled 
                    style="background: #F3F4F6;"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Request for claim status update"
                  value=${emailSubject}
                  onInput=${(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Email Body</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  placeholder="Hello, I submitted my insurance claim last week. Could you please provide an update?"
                  value=${emailBody}
                  onInput=${(e) => setEmailBody(e.target.value)}
                ></textarea>
              </div>

              <!-- Quick Template Buttons -->
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; gap: 6px;">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => {
                      setEmailSubject('Request for claim status');
                      setEmailBody('Hello, I submitted my insurance claim last week (reference CLM-98234). Could you please provide an update?');
                    }}
                  >
                    Template: Claim Inquiry
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => {
                      setEmailSubject('Billing invoice clarification');
                      setEmailBody('Hi support team, I noticed an unexpected deductible charge on my latest statement. Can you verify this for me?');
                    }}
                  >
                    Template: Billing Question
                  </button>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick=${handleSendEmail}
                  disabled=${!emailSubject.trim() || !emailBody.trim() || isReplying}
                  id="btn-send-test-email"
                >
                  ${isReplying ? html`
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
            <div className="email-thread">
              ${emailThread.map(msg => html`
                <div key=${msg.id} className="email-message-card">
                  <div className="email-message-header" onClick=${() => toggleMessage(msg.id)}>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span className="badge ${msg.type === 'user' ? 'badge-draft' : 'badge-published'}">
                        ${msg.type === 'user' ? 'Inbound' : 'Agent Reply'}
                      </span>
                      <strong style="font-size: 14px;">${msg.subject}</strong>
                      <span style="font-size: 12px; color: var(--text-secondary);">${'<' + msg.sender + '>'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 12px; color: var(--text-muted);">${msg.timestamp}</span>
                      ${renderIcon(msg.isOpen ? 'chevron-up' : 'chevron-down', { size: 16, color: 'var(--text-muted)' })}
                    </div>
                  </div>

                  ${msg.isOpen ? html`
                    <div className="email-message-body">
                      ${msg.body}

                      <!-- Extracted Entities & Tools Used for Agent replies -->
                      ${msg.type === 'agent' ? html`
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px;">
                          <!-- Tools Used -->
                          ${msg.toolsUsed ? html`
                            <div>
                              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
                                Tools executed during generation:
                              </div>
                              <div style="display: flex; gap: 6px;">
                                ${msg.toolsUsed.map(t => html`
                                  <span key=${t} className="turn-tool-badge" style="margin: 0;">
                                    ${renderIcon('wrench', { size: 12 })}
                                    <span>${t}</span>
                                  </span>
                                `)}
                              </div>
                            </div>
                          ` : ''}

                          <!-- Extracted Entities -->
                          ${msg.extractedEntities ? html`
                            <div>
                              <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
                                Extracted Entities:
                              </div>
                              <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                  <thead>
                                    <tr style="background: #F1F5F9; text-align: left; color: var(--text-secondary);">
                                      <th style="padding: 6px 12px;">Entity</th>
                                      <th style="padding: 6px 12px;">Extracted Value</th>
                                      <th style="padding: 6px 12px;">Confidence</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${msg.extractedEntities.map(e => html`
                                      <tr key=${e.name} style="border-top: 1px solid var(--border-color);">
                                        <td style="padding: 6px 12px; font-family: monospace; font-weight: 600;">${e.name}</td>
                                        <td style="padding: 6px 12px;">${e.value}</td>
                                        <td style="padding: 6px 12px; color: var(--color-success); font-weight: 600;">${e.confidence}</td>
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
              `)}

              ${isReplying ? html`
                <div style="padding: 16px; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); display: flex; align-items: center; gap: 10px; color: var(--text-secondary);">
                  <span className="pulsing-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary);"></span>
                  <span style="font-size: 13px; font-weight: 500;">Writing a reply using ${agent.sharedModel.model}…</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  global.TryItModal = TryItModal;
})(window);
