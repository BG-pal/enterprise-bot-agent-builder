// Screen 07: Voice Settings Component
// Grouped accordions: Transcription (Alpha), Speech (STT/TTS tabs), Language, Barge-in, DTMF, Inactivity, Noise, Recording, Security

(function (global) {
  function VoiceSettings() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const { STT_PROVIDERS, TTS_PROVIDERS, LANGUAGES } = window.ENTERPRISE_DATA;

    const agent = state.currentAgent;
    if (!agent || !agent.channels.voice) return '';

    // Local accordion collapse states
    const [openSections, setOpenSections] = React.useState({
      transcription: false,
      speech: true,
      language: false,
      bargeIn: true,
      dtmf: false,
      inactivity: false,
      noise: false,
      recording: false,
      security: true
    });

    const [domainInput, setDomainInput] = React.useState('');
    const [sttLangInput, setSttLangInput] = React.useState('');

    function toggleAccordion(key) {
      setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function updateVoice(section, key, val) {
      actions.updateCurrentAgent({
        voiceSettings: {
          ...agent.voiceSettings,
          [section]: {
            ...agent.voiceSettings[section],
            [key]: val
          }
        }
      });
    }

    function addDomain() {
      const val = domainInput.trim();
      if (val && !agent.voiceSettings.security.allowedDomains.includes(val)) {
        updateVoice('security', 'allowedDomains', [...agent.voiceSettings.security.allowedDomains, val]);
        setDomainInput('');
      }
    }

    function removeDomain(dom) {
      updateVoice('security', 'allowedDomains', agent.voiceSettings.security.allowedDomains.filter(d => d !== dom));
    }

    function addSttLanguage() {
      const val = sttLangInput.trim();
      if (val && !agent.voiceSettings.speech.stt.languages.includes(val)) {
        const next = [...agent.voiceSettings.speech.stt.languages, val];
        actions.updateCurrentAgent({
          voiceSettings: {
            ...agent.voiceSettings,
            speech: {
              ...agent.voiceSettings.speech,
              stt: {
                ...agent.voiceSettings.speech.stt,
                languages: next
              }
            }
          }
        });
        setSttLangInput('');
      }
    }

    function removeSttLanguage(code) {
      actions.updateCurrentAgent({
        voiceSettings: {
          ...agent.voiceSettings,
          speech: {
            ...agent.voiceSettings.speech,
            stt: {
              ...agent.voiceSettings.speech.stt,
              languages: agent.voiceSettings.speech.stt.languages.filter(l => l !== code)
            }
          }
        }
      });
    }

    return html`
      <div style="max-width: 880px;">
        <div style="margin-bottom: 24px;">
          <h2 className="heading-xl">Voice Settings</h2>
          <p className="text-secondary" style="margin-top: 4px;">
            Configure telephonic pipeline options, speech recognition, audio generation, telephony DTMF, and security guardrails.
          </p>
        </div>

        <!-- ================= ACCORDION A: TRANSCRIPTION (ALPHA) ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('transcription')}>
            <div className="accordion-title">
              ${renderIcon('mic', { size: 18, color: 'var(--color-primary)' })}
              <span>Transcription Settings</span>
              <span className="badge badge-alpha">Alpha Feature</span>
            </div>
            ${renderIcon(openSections.transcription ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.transcription ? html`
            <div className="accordion-content">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Enable external transcription</div>
                  <div className="text-secondary" style="font-size: 13px;">
                    Only available for Realtime Voice with custom model override active.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.transcription.externalTranscription}
                    onChange=${(e) => updateVoice('transcription', 'externalTranscription', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">Transcription STT profile</label>
                  <select 
                    className="form-select"
                    value=${agent.voiceSettings.transcription.sttProfile}
                    onChange=${(e) => updateVoice('transcription', 'sttProfile', e.target.value)}
                  >
                    <option value="Use agent's default STT profile">Use agent's default STT profile</option>
                    <option value="High-accuracy Call Center Profile">High-accuracy Call Center Profile</option>
                    <option value="Low-latency Conversational Profile">Low-latency Conversational Profile</option>
                  </select>
                </div>

                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">Allowed languages</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value=${agent.voiceSettings.transcription.allowedLanguages}
                    onInput=${(e) => updateVoice('transcription', 'allowedLanguages', e.target.value)}
                    placeholder="e.g. en, hi, es"
                  />
                  <div className="helper-text">Accepts comma-separated ISO language codes. Default: en, hi</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION B: SPEECH (STT / TTS TABS) ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('speech')}>
            <div className="accordion-title">
              ${renderIcon('volume-2', { size: 18, color: 'var(--color-primary)' })}
              <span>Speech Recognition & Synthesis</span>
              <span className="badge badge-published">Core Engine</span>
            </div>
            ${renderIcon(openSections.speech ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.speech ? html`
            <div className="accordion-content">
              <!-- STT / TTS Sub-tabs -->
              <div className="radio-pill-group" style="margin-bottom: 20px;">
                <div 
                  className="radio-pill ${agent.voiceSettings.speech.activeTab === 'stt' ? 'active' : ''}"
                  onClick=${() => actions.updateCurrentAgent({
                    voiceSettings: {
                      ...agent.voiceSettings,
                      speech: { ...agent.voiceSettings.speech, activeTab: 'stt' }
                    }
                  })}
                >
                  Speech-to-Text (STT)
                </div>
                <div 
                  className="radio-pill ${agent.voiceSettings.speech.activeTab === 'tts' ? 'active' : ''}"
                  onClick=${() => actions.updateCurrentAgent({
                    voiceSettings: {
                      ...agent.voiceSettings,
                      speech: { ...agent.voiceSettings.speech, activeTab: 'tts' }
                    }
                  })}
                >
                  Text-to-Speech (TTS)
                </div>
              </div>

              <!-- STT TAB -->
              ${agent.voiceSettings.speech.activeTab === 'stt' ? html`
                <div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                      <label className="form-label required">Speech service (STT)</label>
                      <select 
                        className="form-select"
                        value=${agent.voiceSettings.speech.stt.provider}
                        onChange=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, provider: e.target.value }
                            }
                          }
                        })}
                      >
                        ${STT_PROVIDERS.map(p => html`<option key=${p} value=${p}>${p}</option>`)}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">STT Model</label>
                      <select 
                        className="form-select"
                        value=${agent.voiceSettings.speech.stt.sttModel}
                        onChange=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, sttModel: e.target.value }
                            }
                          }
                        })}
                      >
                        <option value="Provider default">Provider default (Recommended)</option>
                        <option value="Latest neural v2">Latest neural v2</option>
                        <option value="Enhanced telephony wideband">Enhanced telephony wideband</option>
                      </select>
                    </div>
                  </div>

                  <!-- Language Codes List -->
                  <div className="form-group">
                    <label className="form-label">Language list (Enter to add)</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. fr-FR and press Enter..."
                        value=${sttLangInput}
                        onInput=${(e) => setSttLangInput(e.target.value)}
                        onKeyDown=${(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSttLanguage();
                          }
                        }}
                      />
                      <button className="btn btn-secondary" onClick=${addSttLanguage}>Add</button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                      ${agent.voiceSettings.speech.stt.languages.map(code => html`
                        <span key=${code} className="tag-chip">
                          <span>${code}</span>
                          <span className="remove-btn" onClick=${() => removeSttLanguage(code)}>${renderIcon('x', { size: 12 })}</span>
                        </span>
                      `)}
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                      <label className="form-label">Profanity filter mode</label>
                      <select 
                        className="form-select"
                        value=${agent.voiceSettings.speech.stt.profanityFilter}
                        onChange=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, profanityFilter: e.target.value }
                            }
                          }
                        })}
                      >
                        <option value="Masked">Masked (Default)</option>
                        <option value="Off">Off</option>
                        <option value="Removed">Removed</option>
                        <option value="Tagged only">Tagged only</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Segmentation silence timeout</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        step="50"
                        value=${agent.voiceSettings.speech.stt.segmentationSilenceTimeout}
                        onInput=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, segmentationSilenceTimeout: parseInt(e.target.value, 10) || 500 }
                            }
                          }
                        })}
                      />
                      <div className="helper-text">Default 500 ms</div>
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div>
                      <label className="form-label">Silence Timeout</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        step="50"
                        value=${agent.voiceSettings.speech.stt.silenceTimeout}
                        onInput=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, silenceTimeout: parseInt(e.target.value, 10) || 400 }
                            }
                          }
                        })}
                      />
                      <div className="helper-text">Default 400 ms</div>
                    </div>

                    <div>
                      <label className="form-label">Custom Model ID (Azure only)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Optional custom Azure acoustic model ID"
                        value=${agent.voiceSettings.speech.stt.customModelId}
                        onInput=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, customModelId: e.target.value }
                            }
                          }
                        })}
                      />
                      <div className="helper-text">Single language recommended.</div>
                    </div>
                  </div>

                  <!-- Reply in detected language toggle -->
                  <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <div>
                      <div style="font-weight: 700; font-size: 14px;">Reply in detected language</div>
                      <div className="text-secondary" style="font-size: 13px;">TTS speaks in the language dynamically detected by STT.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked=${agent.voiceSettings.speech.stt.replyInDetectedLanguage}
                        onChange=${(e) => actions.updateCurrentAgent({
                          voiceSettings: {
                            ...agent.voiceSettings,
                            speech: {
                              ...agent.voiceSettings.speech,
                              stt: { ...agent.voiceSettings.speech.stt, replyInDetectedLanguage: e.target.checked }
                            }
                          }
                        })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              ` : ''}

              <!-- TTS TAB -->
              ${agent.voiceSettings.speech.activeTab === 'tts' ? html`
                <div>
                  <div className="form-group">
                    <label className="form-label required">Speech Service (TTS)</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.speech.tts.provider}
                      onChange=${(e) => actions.updateCurrentAgent({
                        voiceSettings: {
                          ...agent.voiceSettings,
                          speech: {
                            ...agent.voiceSettings.speech,
                            tts: { ...agent.voiceSettings.speech.tts, provider: e.target.value }
                          }
                        }
                      })}
                    >
                      ${TTS_PROVIDERS.map(p => html`<option key=${p} value=${p}>${p}</option>`)}
                    </select>
                  </div>

                  <!-- Azure Provider Fields -->
                  ${agent.voiceSettings.speech.tts.provider.includes('Azure') ? html`
                    <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                      <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text-primary);">
                        Azure Neural TTS Controls
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                        <div>
                          <label className="form-label">Speed</label>
                          <input 
                            type="number" 
                            step="0.05"
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.azureSpeed}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, azureSpeed: parseFloat(e.target.value) || 1.0 }
                                }
                              }
                            })}
                          />
                          <div className="helper-text">Default 1.1</div>
                        </div>

                        <div>
                          <label className="form-label">Pitch</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.azurePitch}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, azurePitch: e.target.value }
                                }
                              }
                            })}
                          />
                          <div className="helper-text">Default</div>
                        </div>

                        <div>
                          <label className="form-label">Volume</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.azureVolume}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, azureVolume: e.target.value }
                                }
                              }
                            })}
                          />
                          <div className="helper-text">Default</div>
                        </div>
                      </div>

                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <div>
                          <label className="form-label">Speaking Style</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.azureStyle}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, azureStyle: e.target.value }
                                }
                              }
                            })}
                          />
                          <div className="helper-text">Default: Neutral</div>
                        </div>

                        <div>
                          <label className="form-label">Style Degree</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0.1" 
                            max="2.0"
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.azureStyleDegree}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, azureStyleDegree: parseFloat(e.target.value) || 1.0 }
                                }
                              }
                            })}
                          />
                          <div className="helper-text">Default: 1.0</div>
                        </div>
                      </div>
                    </div>
                  ` : ''}

                  <!-- ElevenLabs Provider Fields -->
                  ${agent.voiceSettings.speech.tts.provider.includes('ElevenLabs') ? html`
                    <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                      <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; color: var(--text-primary);">
                        ElevenLabs Custom Voice Parameters
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                        <div>
                          <label className="form-label required">Voice ID</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.elevenLabsVoiceId}
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, elevenLabsVoiceId: e.target.value }
                                }
                              }
                            })}
                          />
                        </div>

                        <div>
                          <label className="form-label">Model</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value=${agent.voiceSettings.speech.tts.elevenLabsModel}
                            disabled
                          />
                          <div className="helper-text">eleven_flash_v2_5</div>
                        </div>
                      </div>

                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <div>
                          <label className="form-label">Stability: ${agent.voiceSettings.speech.tts.elevenLabsStability}</label>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value=${agent.voiceSettings.speech.tts.elevenLabsStability}
                            style="width: 100%; accent-color: var(--color-primary);"
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, elevenLabsStability: parseFloat(e.target.value) }
                                }
                              }
                            })}
                          />
                        </div>

                        <div>
                          <label className="form-label">Similarity: ${agent.voiceSettings.speech.tts.elevenLabsSimilarity}</label>
                          <input 
                            type="range" min="0" max="1" step="0.05"
                            value=${agent.voiceSettings.speech.tts.elevenLabsSimilarity}
                            style="width: 100%; accent-color: var(--color-primary);"
                            onInput=${(e) => actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  tts: { ...agent.voiceSettings.speech.tts, elevenLabsSimilarity: parseFloat(e.target.value) }
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION C: LANGUAGE (REALTIME) ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('language')}>
            <div className="accordion-title">
              ${renderIcon('bot', { size: 18, color: 'var(--color-primary)' })}
              <span>Language Control (Realtime)</span>
            </div>
            ${renderIcon(openSections.language ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.language ? html`
            <div className="accordion-content">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Language Control</div>
                  <div className="text-secondary" style="font-size: 13px;">Explains that the agent dynamically replies in the caller's language.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.language.control}
                    onChange=${(e) => updateVoice('language', 'control', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              ${agent.voiceSettings.language.control ? html`
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <label className="form-label">Primary language</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.language.primaryLanguage}
                      onChange=${(e) => updateVoice('language', 'primaryLanguage', e.target.value)}
                    >
                      ${LANGUAGES.map(l => html`<option key=${l} value=${l}>${l}</option>`)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Supported languages</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value=${agent.voiceSettings.language.supportedLanguages.join(', ')}
                      disabled
                      style="background: #F3F4F6;"
                    />
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION D: BARGE-IN ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('bargeIn')}>
            <div className="accordion-title">
              ${renderIcon('mic-off', { size: 18, color: 'var(--color-primary)' })}
              <span>Barge-in (Caller Interruption)</span>
            </div>
            ${renderIcon(openSections.bargeIn ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.bargeIn ? html`
            <div className="accordion-content">
              <p className="text-secondary" style="font-size: 13px; margin-bottom: 16px;">
                Barge-in allows the caller to interrupt spoken agent audio as soon as incoming voice activity is detected.
              </p>

              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-weight: 700; font-size: 14px;">Agent Responses</div>
                    <div className="text-secondary" style="font-size: 13px;">Caller can interrupt AI agent responses. Default ON.</div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked=${agent.voiceSettings.bargeIn.agentResponses}
                      onChange=${(e) => updateVoice('bargeIn', 'agentResponses', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-color);">
                  <div>
                    <div style="font-weight: 700; font-size: 14px;">Platform Messages</div>
                    <div className="text-secondary" style="font-size: 13px;">Caller can interrupt system or telephony announcements. Default OFF.</div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked=${agent.voiceSettings.bargeIn.platformMessages}
                      onChange=${(e) => updateVoice('bargeIn', 'platformMessages', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION E: DTMF (KEYPAD) ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('dtmf')}>
            <div className="accordion-title">
              ${renderIcon('hash', { size: 18, color: 'var(--color-primary)' })}
              <span>DTMF Keypad Settings</span>
            </div>
            ${renderIcon(openSections.dtmf ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.dtmf ? html`
            <div className="accordion-content">
              <p className="text-secondary" style="font-size: 13px; margin-bottom: 16px;">
                Keypad input ends after timeout, maximum digits, or terminator key. Configured per phone integration.
              </p>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Enable DTMF Keypad Tones</div>
                  <div className="text-secondary" style="font-size: 13px;">Allows callers to enter digits (PINs, card numbers, account IDs) using telephone keypad.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.dtmf.enabled}
                    onChange=${(e) => updateVoice('dtmf', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              ${agent.voiceSettings.dtmf.enabled ? html`
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; background: #F9FAFB; padding: 16px; border-radius: var(--radius-md);">
                  <div>
                    <label className="form-label">Inter-digit timeout (ms)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      step="500"
                      value=${agent.voiceSettings.dtmf.interDigitTimeout}
                      onInput=${(e) => updateVoice('dtmf', 'interDigitTimeout', parseInt(e.target.value, 10) || 3000)}
                    />
                    <div className="helper-text">Default: 3000 ms</div>
                  </div>

                  <div>
                    <label className="form-label">Maximum Digits</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value=${agent.voiceSettings.dtmf.maxDigits}
                      onInput=${(e) => updateVoice('dtmf', 'maxDigits', parseInt(e.target.value, 10) || 10)}
                    />
                    <div className="helper-text">Default: 10 digits</div>
                  </div>

                  <div>
                    <label className="form-label">Terminator Key</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.dtmf.terminator}
                      onChange=${(e) => updateVoice('dtmf', 'terminator', e.target.value)}
                    >
                      <option value="#"># (Pound / Hash)</option>
                      <option value="*">* (Star / Asterisk)</option>
                    </select>
                    <div className="helper-text">Key to submit digits</div>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION F: INACTIVITY ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('inactivity')}>
            <div className="accordion-title">
              ${renderIcon('clock', { size: 18, color: 'var(--color-primary)' })}
              <span>Inactivity Handling</span>
            </div>
            ${renderIcon(openSections.inactivity ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.inactivity ? html`
            <div className="accordion-content">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Custom inactivity handling</div>
                  <div className="text-secondary" style="font-size: 13px;">Manage silence and trigger nudges or actions when caller stops speaking.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.inactivity.enabled}
                    onChange=${(e) => updateVoice('inactivity', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              ${agent.voiceSettings.inactivity.enabled ? html`
                <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label className="form-label">Initial Wait Time (ms)</label>
                      <input 
                        type="number" className="form-input" step="500"
                        value=${agent.voiceSettings.inactivity.initialWaitTime}
                        onInput=${(e) => updateVoice('inactivity', 'initialWaitTime', parseInt(e.target.value, 10) || 5000)}
                      />
                      <div className="helper-text">Default 5000 ms</div>
                    </div>
                    <div>
                      <label className="form-label">Retry Interval (ms)</label>
                      <input 
                        type="number" className="form-input" step="500"
                        value=${agent.voiceSettings.inactivity.retryInterval}
                        onInput=${(e) => updateVoice('inactivity', 'retryInterval', parseInt(e.target.value, 10) || 8000)}
                      />
                      <div className="helper-text">Default 8000 ms</div>
                    </div>
                    <div>
                      <label className="form-label">Inactivity Retries</label>
                      <input 
                        type="number" className="form-input" min="1" max="5"
                        value=${agent.voiceSettings.inactivity.inactivityRetries}
                        onInput=${(e) => updateVoice('inactivity', 'inactivityRetries', parseInt(e.target.value, 10) || 2)}
                      />
                      <div className="helper-text">Default 2</div>
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                    <div>
                      <label className="form-label">Retry Prompt Mode</label>
                      <select 
                        className="form-select"
                        value=${agent.voiceSettings.inactivity.retryPromptMode}
                        onChange=${(e) => updateVoice('inactivity', 'retryPromptMode', e.target.value)}
                      >
                        <option value="Fixed prompt">Fixed prompt (Default)</option>
                        <option value="Agent generated">Agent generated</option>
                        <option value="Repeat last message">Repeat last message</option>
                        <option value="Silent retry">Silent retry</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Inactivity Action</label>
                      <select 
                        className="form-select"
                        value=${agent.voiceSettings.inactivity.inactivityAction}
                        onChange=${(e) => updateVoice('inactivity', 'inactivityAction', e.target.value)}
                      >
                        <option value="Hang up">Hang up</option>
                        <option value="Transfer to human">Transfer to human</option>
                        <option value="Keep waiting">Keep waiting</option>
                        <option value="Play voicemail prompt">Play voicemail prompt</option>
                      </select>
                    </div>
                  </div>

                  ${agent.voiceSettings.inactivity.retryPromptMode === 'Fixed prompt' ? html`
                    <div>
                      <label className="form-label required">Inactivity Prompt</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value=${agent.voiceSettings.inactivity.inactivityPrompt}
                        onInput=${(e) => updateVoice('inactivity', 'inactivityPrompt', e.target.value)}
                      />
                      <div className="helper-text">Default: Are you still there?</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION G: NOISE CANCELLATION ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('noise')}>
            <div className="accordion-title">
              ${renderIcon('shield', { size: 18, color: 'var(--color-primary)' })}
              <span>Noise Cancellation</span>
            </div>
            ${renderIcon(openSections.noise ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.noise ? html`
            <div className="accordion-content">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Enable noise cancellation</div>
                  <div className="text-secondary" style="font-size: 13px;">Filter background acoustic noise and street hum. Default OFF.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.noiseCancellation.enabled}
                    onChange=${(e) => updateVoice('noiseCancellation', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              ${agent.voiceSettings.noiseCancellation.enabled ? html`
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #F9FAFB; padding: 14px; border-radius: var(--radius-md);">
                  <div>
                    <label className="form-label">Provider</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.noiseCancellation.provider}
                      onChange=${(e) => updateVoice('noiseCancellation', 'provider', e.target.value)}
                    >
                      <option value="Twilio Media Streams">Twilio Media Streams</option>
                      <option value="FFmpeg">FFmpeg</option>
                      <option value="GStreamer">GStreamer</option>
                      <option value="AWS Elemental">AWS Elemental</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Model</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.noiseCancellation.model}
                      onChange=${(e) => updateVoice('noiseCancellation', 'model', e.target.value)}
                    >
                      <option value="Default">Default</option>
                      <option value="Low latency">Low latency</option>
                      <option value="High quality">High quality</option>
                      <option value="Bandwidth saver">Bandwidth saver</option>
                    </select>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION H: RECORDING ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('recording')}>
            <div className="accordion-title">
              ${renderIcon('play', { size: 18, color: 'var(--color-primary)' })}
              <span>Call Recording</span>
            </div>
            ${renderIcon(openSections.recording ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.recording ? html`
            <div className="accordion-content">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Enable call recording</div>
                  <div className="text-secondary" style="font-size: 13px;">Stores full dual-channel call audio for compliance and supervisor review. Default OFF.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.recording.enabled}
                    onChange=${(e) => updateVoice('recording', 'enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION I: SECURITY & RETENTION ================= -->
        <div className="accordion">
          <div className="accordion-header" onClick=${() => toggleAccordion('security')}>
            <div className="accordion-title">
              ${renderIcon('shield', { size: 18, color: 'var(--color-primary)' })}
              <span>Security, PII & Data Retention</span>
              <span className="badge badge-published">Strict Compliance</span>
            </div>
            ${renderIcon(openSections.security ? 'chevron-up' : 'chevron-down', { size: 18, color: 'var(--text-muted)' })}
          </div>

          ${openSections.security ? html`
            <div className="accordion-content">
              <!-- PII Redaction -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">PII Redaction</div>
                  <div className="text-secondary" style="font-size: 13px;">Mask emails, phone numbers, and payment cards in voice transcripts. Default ON.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked=${agent.voiceSettings.security.piiRedaction}
                    onChange=${(e) => updateVoice('security', 'piiRedaction', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label className="form-label">Rate limit per user per minute</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value=${agent.voiceSettings.security.rateLimit}
                    onInput=${(e) => updateVoice('security', 'rateLimit', parseInt(e.target.value, 10) || 30)}
                  />
                  <div className="helper-text">Default 30 requests</div>
                </div>

                <div>
                  <label className="form-label">Data retention</label>
                  <select 
                    className="form-select"
                    value=${agent.voiceSettings.security.dataRetentionDays}
                    onChange=${(e) => updateVoice('security', 'dataRetentionDays', parseInt(e.target.value, 10) || 30)}
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days (Default)</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              <!-- Allowed Domains -->
              <div className="form-group" style="margin-bottom: 0;">
                <label className="form-label">Allowed Webhook & Audio Domains</label>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. voice.acme.com and press Enter..."
                    value=${domainInput}
                    onInput=${(e) => setDomainInput(e.target.value)}
                    onKeyDown=${(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDomain();
                      }
                    }}
                  />
                  <button className="btn btn-secondary" onClick=${addDomain}>Add Domain</button>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${agent.voiceSettings.security.allowedDomains.map(dom => html`
                    <span key=${dom} className="tag-chip">
                      ${renderIcon('shield', { size: 12, color: 'var(--color-primary)' })}
                      <span>${dom}</span>
                      <span className="remove-btn" onClick=${() => removeDomain(dom)}>${renderIcon('x', { size: 12 })}</span>
                    </span>
                  `)}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  global.VoiceSettings = VoiceSettings;
})(window);
