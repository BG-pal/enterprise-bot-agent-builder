// Screen 08: Email Settings Component
// Inbox, Threading, Replies, Triage, Escalation, Attachments, Security, and Coming Soon groups

(function (global) {
  function EmailSettings() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent || !agent.channels.email) return '';

    const [newCcInput, setNewCcInput] = React.useState('');
    const [connectModalOpen, setConnectModalOpen] = React.useState(false);
    const [mailboxNameInput, setMailboxNameInput] = React.useState('');
    const [mailboxAddressInput, setMailboxAddressInput] = React.useState('');

    function updateEmail(section, key, val) {
      actions.updateCurrentAgent({
        emailSettings: {
          ...agent.emailSettings,
          [section]: {
            ...agent.emailSettings[section],
            [key]: val
          }
        }
      });
    }

    function addMailbox() {
      if (!mailboxAddressInput.trim()) {
        actions.addToast('Please enter a valid mailbox email address', 'error');
        return;
      }
      const newMailbox = {
        id: 'mb_' + Date.now(),
        name: mailboxNameInput.trim() || 'Support Mailbox',
        address: mailboxAddressInput.trim(),
        status: 'Active'
      };
      const updated = [...agent.emailSettings.inbox.mailboxes, newMailbox];
      updateEmail('inbox', 'mailboxes', updated);
      setConnectModalOpen(false);
      setMailboxNameInput('');
      setMailboxAddressInput('');
      actions.addToast('Mailbox connected successfully!', 'success');
    }

    function removeMailbox(id) {
      const updated = agent.emailSettings.inbox.mailboxes.filter(m => m.id !== id);
      updateEmail('inbox', 'mailboxes', updated);
      actions.addToast('Mailbox disconnected.', 'info');
    }

    function addCC() {
      const val = newCcInput.trim();
      if (val && !agent.emailSettings.threading.defaultCC.includes(val)) {
        updateEmail('threading', 'defaultCC', [...agent.emailSettings.threading.defaultCC, val]);
        setNewCcInput('');
      }
    }

    function removeCC(email) {
      updateEmail('threading', 'defaultCC', agent.emailSettings.threading.defaultCC.filter(e => e !== email));
    }

    return html`
      <div style="max-width: 880px;">
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Email Settings</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Configure inbound mailbox connections, reply behavior, automated triage, and human escalations.
          </p>
        </div>

        <!-- ================= SECTION A: INBOX ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Inbound Mailboxes</h3>
              <div className="card-subtitle">
                Required to receive and answer emails. One mailbox answers for one agent.
              </div>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick=${() => setConnectModalOpen(true)}
              id="btn-connect-mailbox"
            >
              ${renderIcon('plus', { size: 14, color: '#FFFFFF' })}
              <span>Connect Mailbox</span>
            </button>
          </div>

          ${agent.emailSettings.inbox.mailboxes.length === 0 ? html`
            <div style="text-align: center; padding: 32px 20px; background: #F9FAFB; border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #EEF2FF; color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
                ${renderIcon('mail', { size: 22 })}
              </div>
              <div style="font-weight: 700; font-size: 15px; margin-bottom: 4px;">No mailbox connected</div>
              <div className="text-secondary" style="font-size: 13px; max-width: 380px; margin: 0 auto 16px;">
                This agent cannot answer emails until a company mailbox is connected.
              </div>
              <button className="btn btn-primary btn-sm" onClick=${() => setConnectModalOpen(true)}>
                Connect Mailbox Now
              </button>
            </div>
          ` : html`
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
              ${agent.emailSettings.inbox.mailboxes.map(mb => html`
                <div key=${mb.id} className="selection-card" style="padding: 12px 16px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #EEF4FD; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                      ${renderIcon('mail', { size: 18 })}
                    </div>
                    <div>
                      <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${mb.name}</div>
                      <div style="font-size: 12px; color: var(--text-secondary);">${mb.address}</div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span className="badge badge-published">Connected</span>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick=${() => actions.addToast(`Pinged ${mb.address}: Connection verified (200 OK)`, 'success')}
                    >
                      Test Connection
                    </button>
                    <button 
                      className="btn-icon" 
                      style="width: 32px; height: 32px;"
                      title="Remove Mailbox"
                      onClick=${() => removeMailbox(mb.id)}
                    >
                      ${renderIcon('trash-2', { size: 14, color: 'var(--color-error)' })}
                    </button>
                  </div>
                </div>
              `)}
            </div>
          `}

          <div style="padding-top: 14px; border-top: 1px solid var(--border-color); margin-top: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <label className="form-label" style="margin-bottom: 2px;">Thread window</label>
                <div className="helper-text">
                  After this period, an incoming message starts a brand new conversation thread.
                </div>
              </div>
              <select 
                className="form-select" 
                style="width: 160px;"
                value=${agent.emailSettings.inbox.threadWindowDays}
                onChange=${(e) => updateEmail('inbox', 'threadWindowDays', parseInt(e.target.value, 10))}
              >
                <option value="7">7 days</option>
                <option value="14">14 days (Default)</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ================= SECTION B: THREADING & SIGNATURE ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Threading & Signatures</h3>
              <div className="card-subtitle">
                Define reply headers, sender identities, and outbound email signatures.
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label className="form-label">Reply to</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.threading.replyTo}
                onChange=${(e) => updateEmail('threading', 'replyTo', e.target.value)}
              >
                <option value="Sender only">Sender only (Default)</option>
                <option value="Reply all">Reply all</option>
                <option value="Sender and keep the original To line">Sender and keep the original To line</option>
              </select>
            </div>

            <div>
              <label className="form-label">Send as</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.threading.sendAs}
                onChange=${(e) => updateEmail('threading', 'sendAs', e.target.value)}
              >
                <option value="On behalf of a named person">On behalf of a named person (Default)</option>
                <option value="The mailbox">The mailbox</option>
                <option value="A separate reply-to address">A separate reply-to address</option>
              </select>
            </div>
          </div>

          <!-- Conditional Send As Fields -->
          ${agent.emailSettings.threading.sendAs === 'On behalf of a named person' ? html`
            <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label className="form-label required">Person Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Alex Support Specialist"
                    value=${agent.emailSettings.threading.personName}
                    onInput=${(e) => updateEmail('threading', 'personName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label required">Person Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. alex@acme.enterprisebot.ai"
                    value=${agent.emailSettings.threading.personAddress}
                    onInput=${(e) => updateEmail('threading', 'personAddress', e.target.value)}
                  />
                  <div className="helper-text">Mailbox must grant "Send on behalf of" permission.</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${agent.emailSettings.threading.sendAs === 'A separate reply-to address' ? html`
            <div className="form-group">
              <label className="form-label required">Reply-to Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. replies@acme.enterprisebot.ai"
                value=${agent.emailSettings.threading.replyToAddress}
                onInput=${(e) => updateEmail('threading', 'replyToAddress', e.target.value)}
              />
            </div>
          ` : ''}

          <!-- Quote Original & CC -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Quote the original email</div>
              <div className="text-secondary" style="font-size: 13px;">Include previous conversation history in outbound reply body. Default ON.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.threading.quoteOriginal}
                onChange=${(e) => updateEmail('threading', 'quoteOriginal', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <!-- Default CC -->
          <div className="form-group">
            <label className="form-label">Default CC (Enter to add)</label>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <input 
                type="email" 
                className="form-input" 
                placeholder="e.g. supervisor@acme.com and press Enter..."
                value=${newCcInput}
                onInput=${(e) => setNewCcInput(e.target.value)}
                onKeyDown=${(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCC();
                  }
                }}
              />
              <button className="btn btn-secondary" onClick=${addCC}>Add CC</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${agent.emailSettings.threading.defaultCC.map(cc => html`
                <span key=${cc} className="tag-chip">
                  <span>${cc}</span>
                  <span className="remove-btn" onClick=${() => removeCC(cc)}>${renderIcon('x', { size: 12 })}</span>
                </span>
              `)}
            </div>
          </div>

          <!-- Append Signature -->
          <div style="padding-top: 14px; border-top: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <div style="font-weight: 700; font-size: 14px;">Append a signature</div>
                <div className="text-secondary" style="font-size: 13px;">Attach corporate sign-off signature at the end of generated emails.</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked=${agent.emailSettings.threading.appendSignature}
                  onChange=${(e) => updateEmail('threading', 'appendSignature', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            ${agent.emailSettings.threading.appendSignature ? html`
              <div style="background: #F9FAFB; padding: 14px; border-radius: var(--radius-md);">
                <div className="form-group">
                  <label className="form-label">Signature Source</label>
                  <select 
                    className="form-select"
                    value=${agent.emailSettings.threading.signatureType}
                    onChange=${(e) => updateEmail('threading', 'signatureType', e.target.value)}
                  >
                    <option value="Team signature">Team signature (Default)</option>
                    <option value="Mailbox signature">Mailbox signature</option>
                    <option value="Agent signature">Agent signature (Custom text)</option>
                  </select>
                </div>

                ${agent.emailSettings.threading.signatureType === 'Agent signature' ? html`
                  <div className="form-group" style="margin-bottom: 0;">
                    <label className="form-label required">Agent Signature Text</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3"
                      value=${agent.emailSettings.threading.agentSignatureText}
                      onInput=${(e) => updateEmail('threading', 'agentSignatureText', e.target.value)}
                    ></textarea>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- ================= SECTION C: REPLIES ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Reply Automation</h3>
              <div className="card-subtitle">
                Approval workflows and missing information handling.
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label className="form-label">Send mode</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.replies.sendMode}
                onChange=${(e) => updateEmail('replies', 'sendMode', e.target.value)}
              >
                <option value="Draft for review">Draft for review (Default)</option>
                <option value="Send automatically">Send automatically</option>
              </select>
              <div className="helper-text">Draft mode requires agent approval before transmission.</div>
            </div>

            <div>
              <label className="form-label">When something is missing</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.replies.whenMissing}
                onChange=${(e) => updateEmail('replies', 'whenMissing', e.target.value)}
              >
                <option value="Ask the sender for what is missing">Ask the sender for what is missing (Default)</option>
                <option value="Answer with what is available">Answer with what is available</option>
                <option value="Escalate to a person">Escalate to a person</option>
              </select>
            </div>
          </div>
        </div>

        <!-- ================= SECTION D: TRIAGE ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Inbound Triage</h3>
              <div className="card-subtitle">
                Filter which emails are processed by this AI agent. Emails outside conditions are left untouched.
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Answer Scope</label>
            <select 
              className="form-select"
              value=${agent.emailSettings.triage.answerScope}
              onChange=${(e) => updateEmail('triage', 'answerScope', e.target.value)}
            >
              <option value="Every message in the folder">Every message in the folder (Default)</option>
              <option value="Only listed sender domains">Only listed sender domains</option>
              <option value="Only matching subjects">Only matching subjects</option>
              <option value="Listed domains and subjects">Listed domains and subjects</option>
            </select>
          </div>

          ${agent.emailSettings.triage.answerScope.includes('domains') ? html`
            <div className="form-group">
              <label className="form-label">Sender Domains (Comma-separated)</label>
              <input 
                type="text" 
                className="form-input" 
                value=${agent.emailSettings.triage.senderDomains.join(', ')}
                onInput=${(e) => updateEmail('triage', 'senderDomains', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="acme.com, partners.org"
              />
            </div>
          ` : ''}

          ${agent.emailSettings.triage.answerScope.includes('subjects') ? html`
            <div className="form-group">
              <label className="form-label">Subject Contains Keyword</label>
              <input 
                type="text" 
                className="form-input" 
                value=${agent.emailSettings.triage.subjectContains}
                onInput=${(e) => updateEmail('triage', 'subjectContains', e.target.value)}
                placeholder="e.g. Claim Inquiry, Policy Renewal"
              />
            </div>
          ` : ''}

          <!-- Never answer (Coming Soon) -->
          <div style="background: #F9FAFB; padding: 12px; border-radius: var(--radius-md); opacity: 0.7;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: 600; font-size: 13px;">Never answer categories</span>
              <span className="badge badge-coming-soon">Coming Soon</span>
            </div>
            <div className="text-muted" style="font-size: 12px; margin-top: 2px;">
              Automated spam classification, newsletter filtering, and OOO vacation responders.
            </div>
          </div>
        </div>

        <!-- ================= SECTION E: ESCALATION ================= -->
        <div className="card">
          <div className="card-header" style="border-bottom: ${agent.emailSettings.escalation.enabled ? '1px solid var(--border-color)' : 'none'}; padding-bottom: ${agent.emailSettings.escalation.enabled ? '14px' : '0'}; margin-bottom: ${agent.emailSettings.escalation.enabled ? '16px' : '0'};">
            <div>
              <h3 className="card-title">Hand a Thread to a Person</h3>
              <div className="card-subtitle">
                Automated forward rules when complex or high-risk topics are detected.
              </div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.escalation.enabled}
                onChange=${(e) => updateEmail('escalation', 'enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          ${agent.emailSettings.escalation.enabled ? html`
            <div style="animation: fadeIn 0.15s ease-out;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                <div>
                  <label className="form-label">Escalate when</label>
                  <select 
                    className="form-select"
                    value=${agent.emailSettings.escalation.escalateWhen}
                    onChange=${(e) => updateEmail('escalation', 'escalateWhen', e.target.value)}
                  >
                    <option value="The sender asks for a person">The sender asks for a person (Default)</option>
                    <option value="Agent is unsure">Agent is unsure</option>
                    <option value="After 3 replies without resolution">After 3 replies without resolution</option>
                    <option value="Any of these">Any of these</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Forward to</label>
                  <select 
                    className="form-select"
                    value=${agent.emailSettings.escalation.forwardTo}
                    onChange=${(e) => updateEmail('escalation', 'forwardTo', e.target.value)}
                  >
                    <option value="Support · Tier 1">Support · Tier 1</option>
                    <option value="Support · Billing">Support · Billing</option>
                    <option value="A named mailbox">A named mailbox</option>
                    <option value="Genesys queue">Genesys queue</option>
                  </select>
                </div>
              </div>

              ${agent.emailSettings.escalation.forwardTo === 'A named mailbox' ? html`
                <div className="form-group">
                  <label className="form-label required">Forwarding Mailbox Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="escalations@acme.enterprisebot.ai"
                    value=${agent.emailSettings.escalation.forwardMailbox}
                    onInput=${(e) => updateEmail('escalation', 'forwardMailbox', e.target.value)}
                  />
                </div>
              ` : ''}

              ${agent.emailSettings.escalation.forwardTo === 'Genesys queue' ? html`
                <div className="form-group">
                  <label className="form-label required">Genesys Routing Queue ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. tier2_claims_escalations"
                    value=${agent.emailSettings.escalation.genesysQueue}
                    onInput=${(e) => updateEmail('escalation', 'genesysQueue', e.target.value)}
                  />
                </div>
              ` : ''}

              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-color);">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Tell the sender</div>
                  <div className="text-secondary" style="font-size: 13px;">Sends a short polite confirmation to prevent thread from going silent. Default ON.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.emailSettings.escalation.tellSender}
                    onChange=${(e) => updateEmail('escalation', 'tellSender', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- ================= SECTION F: ATTACHMENTS ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Attachments Handling</h3>
              <div className="card-subtitle">
                OCR and PDF reading policies (up to 5MB per file, 20MB / 10 files per email).
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Read inbound attachments</div>
              <div className="text-secondary" style="font-size: 13px;">Extracts text from PDF, DOCX, and image attachments. Default ON.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.attachments.readInbound}
                onChange=${(e) => updateEmail('attachments', 'readInbound', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label className="form-label">Pages read per email</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.attachments.pagesRead}
                onChange=${(e) => updateEmail('attachments', 'pagesRead', parseInt(e.target.value, 10))}
              >
                <option value="5">5 pages</option>
                <option value="10">10 pages</option>
                <option value="20">20 pages (Default)</option>
                <option value="50">50 pages</option>
              </select>
            </div>

            <div>
              <label className="form-label">Password-protected file</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.attachments.passwordProtectedAction}
                onChange=${(e) => updateEmail('attachments', 'passwordProtectedAction', e.target.value)}
              >
                <option value="Ask the sender for an unlocked copy">Ask the sender for an unlocked copy (Default)</option>
                <option value="Escalate">Escalate</option>
                <option value="Answer without the file">Answer without the file</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Store received files</div>
              <div className="text-secondary" style="font-size: 13px;">Default OFF (Files are read in-memory and immediately discarded).</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.attachments.storeReceivedFiles}
                onChange=${(e) => updateEmail('attachments', 'storeReceivedFiles', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- ================= SECTION G: SECURITY ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Email Security & Defense</h3>
              <div className="card-subtitle">
                Prompt injection defense, setup redaction, and compliance thread retention.
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Scan for injected instructions</div>
              <div className="text-secondary" style="font-size: 13px;">Scans inbound email body and attachments for jailbreak attempts before model ingestion. Default ON.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.security.scanInjectedInstructions}
                onChange=${(e) => updateEmail('security', 'scanInjectedInstructions', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div>
              <label className="form-label">On an injection hit</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.security.onInjectedHitAction}
                onChange=${(e) => updateEmail('security', 'onInjectedHitAction', e.target.value)}
              >
                <option value="Strip the injected lines and carry on">Strip the injected lines and carry on (Default)</option>
                <option value="Escalate">Escalate</option>
                <option value="Refuse to reply">Refuse to reply</option>
              </select>
            </div>

            <div>
              <label className="form-label">Keep threads for</label>
              <select 
                className="form-select"
                value=${agent.emailSettings.security.keepThreadsMonths}
                onChange=${(e) => updateEmail('security', 'keepThreadsMonths', e.target.value)}
              >
                <option value="30 days">30 days</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months (Default)</option>
                <option value="24 months">24 months</option>
                <option value="Keep indefinitely">Keep indefinitely</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 700; font-size: 14px;">Refuse to reveal agent's own setup</div>
              <div className="text-secondary" style="font-size: 13px;">Prevents disclosing system prompts, tool schemas, or LLM version. Default ON.</div>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked=${agent.emailSettings.security.refuseRevealSetup}
                onChange=${(e) => updateEmail('security', 'refuseRevealSetup', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- ================= COMING SOON SECTIONS (EXTRACTION, LOOP PROTECTION, DELIVERY FAILURES) ================= -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Extraction (Coming Soon) -->
          <div className="card" style="opacity: 0.65; cursor: not-allowed; background: #F9FAFB;">
            <div className="card-header" style="margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <span>Structured Entity Extraction</span>
                  <span className="badge badge-coming-soon">Coming Soon</span>
                </h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Extract structured values (policy numbers, invoice amounts) before replying. Look in Subject, Body, and Attachments.
                </div>
              </div>
              <label className="toggle-switch" style="pointer-events: none;">
                <input type="checkbox" disabled checked=${false} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Loop Protection (Coming Soon) -->
          <div className="card" style="opacity: 0.65; cursor: not-allowed; background: #F9FAFB;">
            <div className="card-header" style="margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <span>Loop Protection & Rate Caps</span>
                  <span className="badge badge-coming-soon">Coming Soon</span>
                </h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Ignore automated out-of-office mail, bounce loops, and enforce max 5 replies per sender per hour.
                </div>
              </div>
              <label className="toggle-switch" style="pointer-events: none;">
                <input type="checkbox" disabled checked=${true} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Delivery Failures (Coming Soon) -->
          <div className="card" style="opacity: 0.65; cursor: not-allowed; background: #F9FAFB;">
            <div className="card-header" style="margin-bottom: 8px; border-bottom: none; padding-bottom: 0;">
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                  <span>Delivery Failure Handling</span>
                  <span className="badge badge-coming-soon">Coming Soon</span>
                </h4>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Automatic retry on SMTP bounce (up to 3 attempts) and notification routing to workspace admins.
                </div>
              </div>
              <label className="toggle-switch" style="pointer-events: none;">
                <input type="checkbox" disabled checked=${true} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- CONNECT MAILBOX MODAL -->
        ${connectModalOpen ? html`
          <div className="modal-overlay" onClick=${() => setConnectModalOpen(false)}>
            <div className="modal-dialog" onClick=${(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: var(--radius-sm); background: #EEF4FD; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                    ${renderIcon('mail', { size: 18 })}
                  </div>
                  <div>
                    <h3 style="font-size: 16px; font-weight: 700; margin: 0;">Connect Inbound Mailbox</h3>
                    <div style="font-size: 12px; color: var(--text-secondary);">Enterprise Bot OAuth or SMTP/IMAP integration</div>
                  </div>
                </div>
                <button className="btn-icon" onClick=${() => setConnectModalOpen(false)}>
                  ${renderIcon('x', { size: 16 })}
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label required">Mailbox Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Acme Support Desk"
                    value=${mailboxNameInput}
                    onInput=${(e) => setMailboxNameInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Mailbox Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. support@acme.enterprisebot.ai"
                    value=${mailboxAddressInput}
                    onInput=${(e) => setMailboxAddressInput(e.target.value)}
                  />
                  <div className="helper-text">
                    Must be a registered mailbox on your corporate Exchange, Google Workspace, or SMTP server.
                  </div>
                </div>

                <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                  ${renderIcon('info', { size: 16, color: 'var(--color-primary)' })}
                  <span style="margin-left: 6px;">
                    This prototype simulates mailbox OAuth binding and sets up live bi-directional email polling.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick=${() => setConnectModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick=${addMailbox}>
                  Connect Mailbox
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  global.EmailSettings = EmailSettings;
})(window);
