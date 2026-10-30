// Screen 06: Model Settings Component
// Section A: Shared Model Settings, Section B: Voice Override, Section C: Email Override

(function (global) {
  function ModelSettings() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const {
      SHARED_MODELS,
      REALTIME_MODELS,
      CASCADED_MODELS,
      REALTIME_VOICES,
      TURN_DETECTIONS,
      REASONING_LEVELS,
      TIMEZONES
    } = window.ENTERPRISE_DATA;

    const agent = state.currentAgent;
    if (!agent) return '';

    // Quick helpers to update nested model fields
    function updateShared(key, val) {
      actions.updateCurrentAgent({
        sharedModel: { ...agent.sharedModel, [key]: val }
      });
    }

    function updateVoiceOverride(key, val) {
      actions.updateCurrentAgent({
        voiceModelOverride: { ...agent.voiceModelOverride, [key]: val }
      });
    }

    function updateEmailOverride(key, val) {
      actions.updateCurrentAgent({
        emailModelOverride: { ...agent.emailModelOverride, [key]: val }
      });
    }

    return html`
      <div style="max-width: 880px;">
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Model Settings</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Configure default intelligence parameters and channel-specific model overrides.
          </p>
        </div>

        <!-- ================= SECTION A: SHARED / BEHAVIOUR MODEL ================= -->
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Shared Model Settings</h3>
              <div className="card-subtitle">
                Default LLM parameters shared across all enabled channels unless overridden.
              </div>
            </div>
            <span className="badge badge-published">Default Architecture</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <!-- 1. Model (Required) -->
            <div className="form-group">
              <label className="form-label required">Model</label>
              <select 
                className="form-select"
                value=${agent.sharedModel.model}
                onChange=${(e) => updateShared('model', e.target.value)}
              >
                ${SHARED_MODELS.map(m => html`
                  <option key=${m} value=${m}>${m}</option>
                `)}
              </select>
            </div>

            <!-- 2. Response Modality -->
            <div className="form-group">
              <label className="form-label">Response Modality</label>
              <select 
                className="form-select"
                value=${agent.sharedModel.responseModality}
                onChange=${(e) => updateShared('responseModality', e.target.value)}
              >
                <option value="Audio">Audio</option>
                <option value="Text">Text</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <!-- 3. Tool Call Limit -->
            <div className="form-group">
              <label className="form-label">Tool call limit</label>
              <input 
                type="number" 
                className="form-input" 
                min="1" 
                value=${agent.sharedModel.toolCallLimit}
                onInput=${(e) => updateShared('toolCallLimit', parseInt(e.target.value, 10) || 1)}
              />
              <div className="helper-text">Maximum tool invocations per turn. Default is 5. Accepts integer >= 1.</div>
            </div>

            <!-- 4. Temperature -->
            <div className="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label className="form-label" style="margin: 0;">Temperature</label>
                <span style="font-weight: 700; font-size: 13px; color: var(--color-primary); font-family: monospace;">
                  ${agent.sharedModel.temperature}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1.0" 
                step="0.05"
                style="width: 100%; accent-color: var(--color-primary); cursor: pointer;"
                value=${agent.sharedModel.temperature}
                onInput=${(e) => updateShared('temperature', parseFloat(e.target.value))}
              />
              <div className="helper-text">Higher values produce more creative responses. Default is 0.5.</div>
            </div>
          </div>

          <!-- 5. Date & Time -->
          <div style="padding-top: 16px; border-top: 1px solid var(--border-color); margin-top: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Date & Time Instructions</div>
                <div className="text-secondary" style="font-size: 13px;">Automatically inject current temporal context into prompt instructions.</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked=${agent.sharedModel.dateTimeEnabled}
                  onChange=${(e) => updateShared('dateTimeEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            ${agent.sharedModel.dateTimeEnabled ? html`
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #F9FAFB; padding: 14px; border-radius: var(--radius-md); animation: fadeIn 0.15s ease-out;">
                <div>
                  <label className="form-label">Precision</label>
                  <select 
                    className="form-select"
                    value=${agent.sharedModel.dateTimePrecision}
                    onChange=${(e) => updateShared('dateTimePrecision', e.target.value)}
                  >
                    <option value="Day">Day</option>
                    <option value="Hour">Hour</option>
                    <option value="Minute">Minute</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Timezone</label>
                  <select 
                    className="form-select"
                    value=${agent.sharedModel.dateTimeTimezone}
                    onChange=${(e) => updateShared('dateTimeTimezone', e.target.value)}
                  >
                    ${TIMEZONES.map(tz => html`
                      <option key=${tz} value=${tz}>${tz}</option>
                    `)}
                  </select>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- 6-9. History Settings -->
          <div style="padding-top: 16px; border-top: 1px solid var(--border-color); margin-top: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">History Summary</div>
                <div className="text-secondary" style="font-size: 13px;">Condense multi-turn conversation context into an ongoing summary.</div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked=${agent.sharedModel.historySummaryEnabled}
                  onChange=${(e) => updateShared('historySummaryEnabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            ${agent.sharedModel.historySummaryEnabled ? html`
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">History responses</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value=${agent.sharedModel.historyResponses}
                    onInput=${(e) => updateShared('historyResponses', parseInt(e.target.value, 10) || 1)}
                  />
                  <div className="helper-text">Default 10</div>
                </div>

                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">Trigger tokens</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="500"
                    value=${agent.sharedModel.triggerTokens}
                    onInput=${(e) => updateShared('triggerTokens', parseInt(e.target.value, 10) || 1000)}
                  />
                  <div className="helper-text">Default 8000</div>
                </div>

                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">Target tokens</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    step="500"
                    value=${agent.sharedModel.targetTokens}
                    onInput=${(e) => updateShared('targetTokens', parseInt(e.target.value, 10) || 1000)}
                  />
                  <div className="helper-text">Keep Target approx 50–70% of Trigger.</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- ================= SECTION B: VOICE MODEL OVERRIDE ================= -->
        ${agent.channels.voice ? html`
          <div className="card">
            <div className="card-header" style="border-bottom: ${agent.voiceModelOverride.enabled ? '1px solid var(--border-color)' : 'none'}; padding-bottom: ${agent.voiceModelOverride.enabled ? '14px' : '0'}; margin-bottom: ${agent.voiceModelOverride.enabled ? '16px' : '0'};">
              <div>
                <h3 className="card-title">Voice Model Override</h3>
                <div className="card-subtitle">
                  Customize the reasoning model, speech stack, turn detection, and parameters for Voice calls.
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked=${agent.voiceModelOverride.enabled}
                  onChange=${(e) => {
                    const isEnabling = e.target.checked;
                    if (isEnabling) {
                      const inheritedStack = agent.speechStack || agent.voiceModelOverride?.speechStack || 'cascaded';
                      actions.updateCurrentAgent({
                        voiceModelOverride: {
                          ...agent.voiceModelOverride,
                          enabled: true,
                          speechStack: inheritedStack
                        }
                      });
                    } else {
                      updateVoiceOverride('enabled', false);
                    }
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            ${agent.voiceModelOverride.enabled ? html`
              <div style="animation: fadeIn 0.15s ease-out;">
                <!-- Stack Selection -->
                <div className="form-group">
                  <label className="form-label">Voice Stack</label>
                  <div className="radio-pill-group">
                    <div 
                      className="radio-pill ${agent.voiceModelOverride.speechStack === 'cascaded' ? 'active' : ''}"
                      onClick=${() => updateVoiceOverride('speechStack', 'cascaded')}
                    >
                      Cascaded (STT + LLM + TTS)
                    </div>
                    <div 
                      className="radio-pill ${agent.voiceModelOverride.speechStack === 'realtime' ? 'active' : ''}"
                      onClick=${() => updateVoiceOverride('speechStack', 'realtime')}
                    >
                      Realtime Voice (Speech-to-Speech)
                    </div>
                  </div>
                </div>

                <!-- Conditional Model Selector -->
                <div className="form-group">
                  <label className="form-label required">
                    Model (${agent.voiceModelOverride.speechStack === 'realtime' ? 'Realtime Catalog' : 'Cascaded Catalog'})
                  </label>
                  ${agent.voiceModelOverride.speechStack === 'realtime' ? html`
                    <select 
                      className="form-select"
                      value=${agent.voiceModelOverride.modelRealtime}
                      onChange=${(e) => updateVoiceOverride('modelRealtime', e.target.value)}
                    >
                      ${REALTIME_MODELS.map(m => html`
                        <option key=${m} value=${m}>${m}</option>
                      `)}
                    </select>
                  ` : html`
                    <select 
                      className="form-select"
                      value=${agent.voiceModelOverride.modelCascaded}
                      onChange=${(e) => updateVoiceOverride('modelCascaded', e.target.value)}
                    >
                      ${CASCADED_MODELS.map(m => html`
                        <option key=${m} value=${m}>${m}</option>
                      `)}
                    </select>
                  `}
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <!-- Response Modality -->
                  <div className="form-group" style="margin-bottom: 0;">
                    <label className="form-label">Response Modality</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceModelOverride.responseModality}
                      onChange=${(e) => updateVoiceOverride('responseModality', e.target.value)}
                    >
                      <option value="Audio">Audio (Default)</option>
                      <option value="Text">Text</option>
                    </select>
                  </div>

                  <!-- Reasoning -->
                  <div className="form-group" style="margin-bottom: 0;">
                    <label className="form-label">Reasoning Effort</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceModelOverride.reasoning}
                      onChange=${(e) => updateVoiceOverride('reasoning', e.target.value)}
                    >
                      ${REASONING_LEVELS.map(r => html`
                        <option key=${r} value=${r}>${r}</option>
                      `)}
                    </select>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <!-- Tool Call Limit -->
                  <div className="form-group" style="margin-bottom: 0;">
                    <label className="form-label">Tool Call Limit</label>
                    <div style="display: flex; gap: 8px;">
                      <select 
                        className="form-select" 
                        style="width: 130px;"
                        value=${agent.voiceModelOverride.toolCallLimit === 'Inherited' ? 'Inherited' : 'Custom'}
                        onChange=${(e) => {
                          if (e.target.value === 'Inherited') {
                            updateVoiceOverride('toolCallLimit', 'Inherited');
                          } else {
                            updateVoiceOverride('toolCallLimit', 5);
                          }
                        }}
                      >
                        <option value="Inherited">Inherited</option>
                        <option value="Custom">Custom</option>
                      </select>
                      ${agent.voiceModelOverride.toolCallLimit !== 'Inherited' ? html`
                        <input 
                          type="number" 
                          min="1"
                          className="form-input" 
                          value=${agent.voiceModelOverride.toolCallLimit}
                          onInput=${(e) => updateVoiceOverride('toolCallLimit', parseInt(e.target.value, 10) || 1)}
                        />
                      ` : ''}
                    </div>
                    <div className="helper-text">Inherited or integer >= 1</div>
                  </div>

                  <!-- Voice Override Temperature -->
                  <div className="form-group" style="margin-bottom: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <label className="form-label" style="margin: 0;">Temperature</label>
                      <span style="font-weight: 700; font-size: 13px; color: var(--color-primary); font-family: monospace;">
                        ${agent.voiceModelOverride.temperature === 'Inherited' ? 'Inherited (0.5)' : agent.voiceModelOverride.temperature}
                      </span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <select 
                        className="form-select" 
                        style="width: 130px;"
                        value=${agent.voiceModelOverride.temperature === 'Inherited' ? 'Inherited' : 'Custom'}
                        onChange=${(e) => {
                          if (e.target.value === 'Inherited') {
                            updateVoiceOverride('temperature', 'Inherited');
                          } else {
                            updateVoiceOverride('temperature', 0.5);
                          }
                        }}
                      >
                        <option value="Inherited">Inherited</option>
                        <option value="Custom">Custom</option>
                      </select>
                      ${agent.voiceModelOverride.temperature !== 'Inherited' ? html`
                        <input 
                          type="number" 
                          min="0" 
                          max="1.0" 
                          step="0.05"
                          className="form-input" 
                          value=${agent.voiceModelOverride.temperature}
                          onInput=${(e) => updateVoiceOverride('temperature', parseFloat(e.target.value) || 0)}
                        />
                      ` : ''}
                    </div>
                    <div className="helper-text">Inherited or customized between 0.0 and 1.0</div>
                  </div>
                </div>

                <!-- Realtime Specific: Voice & Turn Detection -->
                ${agent.voiceModelOverride.speechStack === 'realtime' ? html`
                  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
                    <div style="font-weight: 700; font-size: 14px; color: #166534; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                      ${renderIcon('volume-2', { size: 16 })}
                      <span>Realtime Audio Parameters</span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                      <div>
                        <label className="form-label">Voice (Realtime)</label>
                        <select 
                          className="form-select"
                          value=${agent.voiceModelOverride.voice}
                          onChange=${(e) => updateVoiceOverride('voice', e.target.value)}
                        >
                          ${REALTIME_VOICES.map(v => html`
                            <option key=${v} value=${v}>${v}</option>
                          `)}
                        </select>
                        <div className="helper-text">Default Aria – calm, mid-pitch</div>
                      </div>

                      <div>
                        <label className="form-label">Turn Detection</label>
                        <select 
                          className="form-select"
                          value=${agent.voiceModelOverride.turnDetection}
                          onChange=${(e) => updateVoiceOverride('turnDetection', e.target.value)}
                        >
                          ${TURN_DETECTIONS.map(td => html`
                            <option key=${td} value=${td}>${td}</option>
                          `)}
                        </select>
                        <div className="helper-text">Default Server VAD · 0.6 s</div>
                      </div>
                    </div>
                  </div>
                ` : ''}

                <!-- Voice History Override -->
                <div style="padding-top: 14px; border-top: 1px solid var(--border-color);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div>
                      <div style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Voice History Summary</div>
                      <div className="text-secondary" style="font-size: 13px;">Condense multi-turn conversation context for voice calls.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked=${agent.voiceModelOverride.historyOverride?.enabled ?? true}
                        onChange=${(e) => updateVoiceOverride('historyOverride', {
                          ...agent.voiceModelOverride.historyOverride,
                          enabled: e.target.checked
                        })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  ${(agent.voiceModelOverride.historyOverride?.enabled ?? true) ? html`
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
                      <div>
                        <label className="form-label">Responses</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value=${agent.voiceModelOverride.historyOverride.historyResponses}
                          onInput=${(e) => {
                            const val = parseInt(e.target.value, 10) || 5;
                            updateVoiceOverride('historyOverride', { ...agent.voiceModelOverride.historyOverride, historyResponses: val });
                          }}
                        />
                        <div className="helper-text">Default 5</div>
                      </div>
                      <div>
                        <label className="form-label">Trigger tokens</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value=${agent.voiceModelOverride.historyOverride.triggerTokens}
                          onInput=${(e) => {
                            const val = parseInt(e.target.value, 10) || 15000;
                            updateVoiceOverride('historyOverride', { ...agent.voiceModelOverride.historyOverride, triggerTokens: val });
                          }}
                        />
                        <div className="helper-text">Default 15000</div>
                      </div>
                      <div>
                        <label className="form-label">Target tokens</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value=${agent.voiceModelOverride.historyOverride.targetTokens}
                          onInput=${(e) => {
                            const val = parseInt(e.target.value, 10) || 10000;
                            updateVoiceOverride('historyOverride', { ...agent.voiceModelOverride.historyOverride, targetTokens: val });
                          }}
                        />
                        <div className="helper-text">Default 10000</div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  global.ModelSettings = ModelSettings;
})(window);
