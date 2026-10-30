// Screen 04: Prompt Configuration Component
// Fields: Welcome message, Instructions, Voice Guidelines, Text Guidelines, Call Transfer, Expected Output
// Each field features simulated "Rewrite with AI" with Keep/Discard actions.

(function (global) {
  function PromptConfig() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const agent = state.currentAgent;

    if (!agent) return '';

    // Track active rewrite states per field
    const [rewritingField, setRewritingField] = React.useState(null); // 'welcome' | 'instructions' | etc.
    const [suggestions, setSuggestions] = React.useState({}); // { [fieldName]: 'rewritten text' }

    function handleRewrite(fieldName, currentText) {
      setRewritingField(fieldName);

      setTimeout(() => {
        let enhanced = '';
        if (fieldName === 'welcomeMessage') {
          enhanced = 'Hello! Welcome to Acme Enterprise Services. My name is Alex, your AI support specialist. How may I assist you with your account, claims, or inquiries today?';
        } else if (fieldName === 'instructions') {
          enhanced = 'You are an enterprise AI customer service specialist for Acme. Embody an empathetic, efficient, and professional tone. Confirm customer IDs, retrieve policy information using internal CRM tools, explain coverage clearly, and offer immediate next steps.';
        } else if (fieldName === 'guidelinesVoice') {
          enhanced = '1. Keep utterances under 2 sentences for low cognitive load.\n2. Confirm critical numbers digit-by-digit (e.g. "Policy 4-4-0-1").\n3. Pause naturally after asking clarifying questions.';
        } else if (fieldName === 'guidelinesText') {
          enhanced = '1. Structure replies with a polite greeting, bullet points for required steps, and an official sign-off.\n2. Include reference links to online documentation where relevant.\n3. Keep paragraphs concise.';
        } else if (fieldName === 'guidelinesTransfer') {
          enhanced = 'Transfer immediately to human queue if:\n- The customer asks for a human twice in succession.\n- The claim has been rejected or escalated to legal review.\n- High sentiment frustration or distress is detected.';
        } else if (fieldName === 'guidelinesExpectedOutput') {
          enhanced = 'A successful turn must:\n1. Acknowledge user input and validate extracted intent.\n2. Execute necessary lookup tools with appropriate parameters.\n3. Return a definitive status update or explicit next step.';
        } else {
          enhanced = (currentText || 'Sample prompt') + '\n[Enhanced with enterprise guardrails, precise tool execution, and clear tone guidelines]';
        }

        setSuggestions(prev => ({ ...prev, [fieldName]: enhanced }));
        setRewritingField(null);
      }, 700);
    }

    function keepRewrite(fieldName) {
      const suggestion = suggestions[fieldName];
      if (suggestion) {
        actions.updateCurrentAgent({ [fieldName]: suggestion });
        setSuggestions(prev => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
        actions.addToast('AI rewrite applied. Changes marked as unsaved.', 'success');
      }
    }

    function discardRewrite(fieldName) {
      setSuggestions(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      actions.addToast('AI rewrite discarded.', 'info');
    }

    // Helper for rendering prompt field with AI Rewrite
    function renderPromptField(key, label, value, helper, rows = 3) {
      const isGenerating = rewritingField === key;
      const suggestion = suggestions[key];

      return html`
        <div className="card" style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <label className="form-label" style="margin: 0; font-size: 15px;">
              ${label}
            </label>
            
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick=${() => handleRewrite(key, value)}
              disabled=${isGenerating}
              title="Enhance prompt with AI recommendations"
            >
              ${isGenerating ? html`
                <span className="pulsing-dot" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary); margin-right: 4px;"></span>
                <span>Generating rewrite…</span>
              ` : html`
                ${renderIcon('sparkles', { size: 14 })}
                <span>Rewrite with AI</span>
              `}
            </button>
          </div>

          <textarea 
            className="form-textarea" 
            rows=${rows}
            value=${value || ''}
            onInput=${(e) => actions.updateCurrentAgent({ [key]: e.target.value })}
            placeholder="Enter ${label.toLowerCase()} or click Rewrite with AI..."
          ></textarea>
          
          <div className="helper-text">${helper}</div>

          <!-- Suggested AI Rewrite Preview Box -->
          ${suggestion ? html`
            <div className="ai-rewrite-box">
              <div className="ai-rewrite-header">
                <div className="ai-badge">
                  ${renderIcon('sparkles', { size: 14, color: 'var(--color-primary)' })}
                  <span>Suggested AI Rewrite (Prototype Simulation)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick=${() => discardRewrite(key)}
                  >
                    ${renderIcon('x', { size: 13 })}
                    <span>Discard</span>
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick=${() => keepRewrite(key)}
                  >
                    ${renderIcon('check', { size: 13, color: '#FFFFFF' })}
                    <span>Keep</span>
                  </button>
                </div>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">
                Simulated AI model suggestion. Click <strong>Keep</strong> to apply to your prompt, or <strong>Discard</strong> to revert.
              </div>
              <div style="font-size: 13px; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap; background: white; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid #D9E5FC;">
                ${suggestion}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    return html`
      <div style="max-width: 880px;">
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Prompt Configuration</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Define the persona, instructions, and communication rules governing agent responses across Voice and Text.
          </p>
        </div>

        <!-- 1. Welcome Message -->
        ${renderPromptField(
          'welcomeMessage',
          'Welcome Message',
          agent.welcomeMessage,
          'Spoken before the caller says anything. Inherited from Create Agent and only applies to Voice calls.',
          2
        )}

        <!-- 2. Instructions / Prompt -->
        ${renderPromptField(
          'instructions',
          'Instructions / Prompt',
          agent.instructions,
          'The core system prompt defining your agent’s primary objective, persona, capabilities, and constraints.',
          5
        )}

        <!-- 3. Guidelines – Voice Response Rules -->
        ${renderPromptField(
          'guidelinesVoice',
          'Guidelines – Voice Response Rules',
          agent.guidelinesVoice,
          'Instructions tailored specifically for spoken voice turns, such as pacing, brevity, and number enunciation.',
          3
        )}

        <!-- 4. Guidelines – Text Response Rules -->
        ${renderPromptField(
          'guidelinesText',
          'Guidelines – Text Response Rules',
          agent.guidelinesText,
          'Rules governing written formatting, links, bullet points, and greeting conventions for Email messages.',
          3
        )}

        <!-- 5. Guidelines – Call Transfer -->
        ${renderPromptField(
          'guidelinesTransfer',
          'Guidelines – Call Transfer',
          agent.guidelinesTransfer,
          'Explains when, under what trigger conditions, and where to hand a call to a human specialist.',
          3
        )}

        <!-- 6. Guidelines – Expected Output -->
        ${renderPromptField(
          'guidelinesExpectedOutput',
          'Guidelines – Expected Output',
          agent.guidelinesExpectedOutput,
          'Explains what a successful conversation turn or email reply should produce.',
          3
        )}
      </div>
    `;
  }

  global.PromptConfig = PromptConfig;
})(window);
