// Screen 07: Voice Settings Component
// Grouped accordions: Transcription (Alpha), Speech (STT/TTS tabs), Language, Barge-in, DTMF, Inactivity, Noise, Recording, Security
// All 9 sections collapsed initially; clicking a header expands/collapses with smooth chevron rotation; multiple sections can be expanded simultaneously.

(function (global) {
  function VoiceSettings() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;
    const { STT_PROVIDERS, TTS_PROVIDERS, LANGUAGES, STT_MODELS_BY_PROVIDER } = window.ENTERPRISE_DATA;

    const agent = state.currentAgent;
    if (!agent || !agent.channels.voice) return '';

    // Set component hook context
    if (window.React?.setHookContext) {
      window.React.setHookContext('VoiceSettings');
    }

    // Single source of truth from AppState (all 9 collapsed initially by default)
    const openSections = state.voiceSettingsUi?.openSections || {};

    function toggleSection(sectionKey) {
      actions.toggleVoiceAccordion(sectionKey);
    }

    const domainInput = state.voiceSettingsUi?.domainInput || '';
    const sttLangInput = state.voiceSettingsUi?.sttLangInput || '';

    // Stack and architecture verification
    const effectiveStack = (typeof window.getEffectiveSpeechStack === 'function')
      ? window.getEffectiveSpeechStack(agent)
      : (agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack) || 'cascaded';
    const isRealtime = effectiveStack === 'realtime';
    const isVoiceOverrideEnabled = !!agent.voiceModelOverride?.enabled;
    const isExternalTranscriptionAllowed = agent.channels.voice && isRealtime && isVoiceOverrideEnabled;

    const sttProvider = agent.voiceSettings?.speech?.stt?.provider || 'Team default service';

    // Safe extraction of TTS parameters
    const tts = agent.voiceSettings.speech.tts || {};
    const ttsProvider = (tts.provider === 'ElevenLabs') ? 'ElevenLabs' : 'Azure';
    const azure = tts.azure || {
      voice: tts.voice || 'en-US-JennyNeural',
      speed: tts.azureSpeed || 1.1,
      pitch: tts.azurePitch || 'Default',
      volume: tts.azureVolume || 'Default',
      style: tts.azureStyle || 'Neutral',
      styleDegree: tts.azureStyleDegree || 1.0
    };
    const elevenLabs = tts.elevenLabs || {
      voiceId: tts.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
      model: tts.elevenLabsModel || 'eleven_flash_v2_5',
      stability: tts.elevenLabsStability ?? 0.5,
      similarity: tts.elevenLabsSimilarity ?? 0.75,
      styleExaggeration: tts.elevenLabsStyleExaggeration ?? 0,
      speakerBoost: tts.elevenLabsSpeakerBoost ?? true
    };

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

    function updateTts(key, val) {
      actions.updateCurrentAgent({
        voiceSettings: {
          ...agent.voiceSettings,
          speech: {
            ...agent.voiceSettings.speech,
            tts: {
              ...tts,
              [key]: val
            }
          }
        }
      });
    }

    function updateAzureTts(key, val) {
      actions.updateCurrentAgent({
        voiceSettings: {
          ...agent.voiceSettings,
          speech: {
            ...agent.voiceSettings.speech,
            tts: {
              ...tts,
              provider: 'Azure',
              azure: { ...azure, [key]: val },
              [key === 'voice' ? 'voice' : 'azure' + key.charAt(0).toUpperCase() + key.slice(1)]: val
            }
          }
        }
      });
    }

    function updateElevenLabsTts(key, val) {
      actions.updateCurrentAgent({
        voiceSettings: {
          ...agent.voiceSettings,
          speech: {
            ...agent.voiceSettings.speech,
            tts: {
              ...tts,
              provider: 'ElevenLabs',
              elevenLabs: { ...elevenLabs, [key]: val },
              ['elevenLabs' + key.charAt(0).toUpperCase() + key.slice(1)]: val
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
        <div className="accordion ${openSections.transcription ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-transcription"
            aria-expanded="${openSections.transcription ? 'true' : 'false'}"
            aria-controls="accordion-content-transcription"
            onClick=${() => toggleSection('transcription')}
          >
            <div className="accordion-title">
              ${renderIcon('mic', { size: 18, color: 'var(--color-primary)' })}
              <span>Transcription Settings</span>
              <span className="badge badge-alpha">Alpha Feature</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.transcription ? html`
            <div 
              className="accordion-content"
              id="accordion-content-transcription"
              role="region"
              aria-labelledby="accordion-header-transcription"
            >
              ${!isExternalTranscriptionAllowed ? html`
                <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px;">
                  ${renderIcon('alert-triangle', { size: 16, color: '#D97706' })}
                  <div style="font-size: 13px; color: #92400E; line-height: 1.4;">
                    <strong>External Transcription Unavailable:</strong> This feature is restricted to agents using <strong>Realtime Voice</strong> with <strong>Voice Model Override enabled</strong>. To activate, enable Model Override under Model Settings and select the Realtime stack.
                  </div>
                </div>
              ` : ''}

              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; opacity: ${isExternalTranscriptionAllowed ? 1 : 0.6};">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Enable external transcription</div>
                  <div className="text-secondary" style="font-size: 13px;">
                    Use an alternate STT path for the realtime model's user transcripts. Alpha feature.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    disabled=${!isExternalTranscriptionAllowed}
                    checked=${isExternalTranscriptionAllowed && agent.voiceSettings.transcription.externalTranscription}
                    onChange=${(e) => updateVoice('transcription', 'externalTranscription', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; opacity: ${isExternalTranscriptionAllowed ? 1 : 0.6};">
                <div className="form-group" style="margin-bottom: 0;">
                  <label className="form-label">Transcription STT profile</label>
                  <select 
                    className="form-select"
                    disabled=${!isExternalTranscriptionAllowed}
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
                    disabled=${!isExternalTranscriptionAllowed}
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
        <div className="accordion ${openSections.speech ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-speech"
            aria-expanded="${openSections.speech ? 'true' : 'false'}"
            aria-controls="accordion-content-speech"
            onClick=${() => toggleSection('speech')}
          >
            <div className="accordion-title">
              ${renderIcon('volume-2', { size: 18, color: 'var(--color-primary)' })}
              <span>Speech Recognition & Synthesis</span>
              <span className="badge badge-published">Core Engine</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.speech ? html`
            <div 
              className="accordion-content"
              id="accordion-content-speech"
              role="region"
              aria-labelledby="accordion-header-speech"
            >
              ${isRealtime ? html`
                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 18px; display: flex; align-items: flex-start; gap: 14px;">
                  <div style="color: #166534; margin-top: 2px;">
                    ${renderIcon('check-circle', { size: 20 })}
                  </div>
                  <div style="font-size: 13px; color: #166534; line-height: 1.5;">
                    <strong style="display: block; font-size: 14px; margin-bottom: 4px; color: #14532D;">Realtime Speech-to-Speech Active</strong>
                    <span>Speech recognition and audio synthesis are handled natively within the integrated Realtime audio pipeline (${agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.modelRealtime : 'Realtime Voice'}). Discrete STT and TTS provider configurations are bypassed in Realtime mode. Voice timbre and turn detection can be fine-tuned under <strong>Model Settings › Voice Model Override</strong>.</span>
                  </div>
                </div>
              ` : html`
                <!-- STT / TTS Sub-tabs for Cascaded Stack -->
                <div className="radio-pill-group" style="margin-bottom: 20px;">
                  <div 
                    className="radio-pill ${agent.voiceSettings.speech.activeTab === 'stt' ? 'active' : ''}"
                    onClick=${() => actions.updateCurrentAgent({
                      voiceSettings: {
                        ...agent.voiceSettings,
                        speech: { ...agent.voiceSettings.speech, activeTab: 'stt' }
                      }
                    })}
                    style="cursor: pointer;"
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
                    style="cursor: pointer;"
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
                          value=${sttProvider}
                          onChange=${(e) => {
                            const newProv = e.target.value;
                            const models = STT_MODELS_BY_PROVIDER[newProv] || ['Provider default'];
                            actions.updateCurrentAgent({
                              voiceSettings: {
                                ...agent.voiceSettings,
                                speech: {
                                  ...agent.voiceSettings.speech,
                                  stt: {
                                    ...agent.voiceSettings.speech.stt,
                                    provider: newProv,
                                    sttModel: models[0]
                                  }
                                }
                              }
                            });
                          }}
                        >
                          ${STT_PROVIDERS.map(p => html`<option key=${p} value=${p}>${p}</option>`)}
                        </select>
                        <div className="helper-text">Team default service maps to enterprise Azure Neural STT.</div>
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
                          ${(STT_MODELS_BY_PROVIDER[sttProvider] || ['Provider default']).map(m => html`
                            <option key=${m} value=${m}>${m}</option>
                          `)}
                        </select>
                        <div className="helper-text">Models available for ${sttProvider}.</div>
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
                          onInput=${(e) => actions.setVoiceSttLangInput(e.target.value)}
                          onKeyDown=${(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              actions.addVoiceSttLanguage();
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="btn btn-secondary" 
                          onClick=${() => actions.addVoiceSttLanguage()}
                        >
                          Add
                        </button>
                      </div>
                      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${agent.voiceSettings.speech.stt.languages.map(code => html`
                          <span key=${code} className="tag-chip">
                            <span>${code}</span>
                            <span 
                              className="remove-btn" 
                              onClick=${() => actions.removeVoiceSttLanguage(code)}
                              title="Remove language"
                            >
                              ${renderIcon('x', { size: 12 })}
                            </span>
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
                          value=${agent.voiceSettings.speech.stt.segmentationSilenceTimeout ?? 500}
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
                          value=${agent.voiceSettings.speech.silenceTimeout ?? 400}
                          onInput=${(e) => actions.updateCurrentAgent({
                            voiceSettings: {
                              ...agent.voiceSettings,
                              speech: {
                                ...agent.voiceSettings.speech,
                                silenceTimeout: parseInt(e.target.value, 10) || 400,
                                stt: { ...agent.voiceSettings.speech.stt, silenceTimeout: parseInt(e.target.value, 10) || 400 }
                              }
                            }
                          })}
                        />
                        <div className="helper-text">General speech silence timeout. Default 400 ms</div>
                      </div>

                      ${(sttProvider === 'Team default service' || sttProvider.includes('Azure')) ? html`
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
                          <div className="helper-text">Leave blank to use base foundation model.</div>
                        </div>
                      ` : html`
                        <div></div>
                      `}
                    </div>

                    <!-- Reply in detected language -->
                    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-color);">
                      <div>
                        <div style="font-weight: 700; font-size: 14px;">Reply in detected language</div>
                        <div className="text-secondary" style="font-size: 13px;">TTS dynamically speaks the language detected by STT on each turn.</div>
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

                    ${(() => {
                      const resolvedSttVendor = (sttProvider === 'Team default service' || sttProvider.includes('Azure')) ? 'Azure' : sttProvider.split(' ')[0];
                      const resolvedTtsVendor = ttsProvider === 'ElevenLabs' ? 'ElevenLabs' : 'Azure';
                      const hasProviderMismatch = resolvedSttVendor !== resolvedTtsVendor;
                      return (agent.voiceSettings.speech.stt.replyInDetectedLanguage && hasProviderMismatch) ? html`
                        <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: var(--radius-md); padding: 12px 14px; margin-top: 12px; display: flex; align-items: flex-start; gap: 10px;">
                          ${renderIcon('alert-triangle', { size: 16, color: '#D97706' })}
                          <div style="font-size: 13px; color: #92400E; line-height: 1.4;">
                            <strong>Provider Mismatch Notice:</strong> "Reply in detected language" is active with disparate STT (${resolvedSttVendor}) and TTS (${resolvedTtsVendor}) providers. Ensure both providers support dynamic language switching for your target locale catalog to prevent latency spikes or voice timbre shifts.
                          </div>
                        </div>
                      ` : '';
                    })()}
                  </div>
                ` : ''}

                <!-- TTS TAB -->
                ${agent.voiceSettings.speech.activeTab === 'tts' ? html`
                  <div>
                    <div style="margin-bottom: 20px;">
                      <label className="form-label required">Select TTS Provider</label>
                      <div style="display: flex; gap: 12px;">
                        <div 
                          className="selection-card ${ttsProvider === 'Azure' ? 'selected' : ''}"
                          onClick=${() => updateTts('provider', 'Azure')}
                          style="flex: 1; padding: 14px; cursor: pointer;"
                        >
                          <div style="font-weight: 700; font-size: 14px;">Azure Speech Services</div>
                          <div className="text-secondary" style="font-size: 12px; margin-top: 4px;">Neural voices with rich SSML styles and multi-lingual expressiveness.</div>
                        </div>

                        <div 
                          className="selection-card ${ttsProvider === 'ElevenLabs' ? 'selected' : ''}"
                          onClick=${() => updateTts('provider', 'ElevenLabs')}
                          style="flex: 1; padding: 14px; cursor: pointer;"
                        >
                          <div style="font-weight: 700; font-size: 14px;">ElevenLabs Turbo</div>
                          <div className="text-secondary" style="font-size: 12px; margin-top: 4px;">Ultra low-latency hyper-realistic streaming speech synthesis.</div>
                        </div>
                      </div>
                    </div>

                    <!-- Azure Specific TTS Controls -->
                    ${ttsProvider === 'Azure' ? html`
                      <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 16px;">
                        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 14px; color: var(--text-primary);">Azure TTS Voice & Prosody</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                          <div>
                            <label className="form-label">Voice (TTS)</label>
                            <select 
                              className="form-select"
                              value=${azure.voice}
                              onChange=${(e) => updateAzureTts('voice', e.target.value)}
                            >
                              <option value="en-US-JennyNeural">en-US-JennyNeural (Warm & Friendly)</option>
                              <option value="en-US-GuyNeural">en-US-GuyNeural (Professional & Direct)</option>
                              <option value="en-US-AriaNeural">en-US-AriaNeural (Clear & Confident)</option>
                              <option value="de-DE-KatjaNeural">de-DE-KatjaNeural (German Natural)</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label">Speaking Style</label>
                            <select 
                              className="form-select"
                              value=${azure.style}
                              onChange=${(e) => updateAzureTts('style', e.target.value)}
                            >
                              <option value="neutral">Neutral (Default)</option>
                              <option value="empathetic">Empathetic / Customer Support</option>
                              <option value="cheerful">Cheerful</option>
                              <option value="chat">Chat / Conversational</option>
                            </select>
                          </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                          <div>
                            <label className="form-label">Speed: ${azure.speed}x</label>
                            <input 
                              type="range" min="0.8" max="1.5" step="0.05"
                              className="form-range"
                              value=${azure.speed}
                              onInput=${(e) => updateAzureTts('speed', parseFloat(e.target.value))}
                            />
                            <div className="helper-text">Default: 1.1x</div>
                          </div>

                          <div>
                            <label className="form-label">Pitch: ${azure.pitch}</label>
                            <select 
                              className="form-select"
                              value=${azure.pitch}
                              onChange=${(e) => updateAzureTts('pitch', e.target.value)}
                            >
                              <option value="default">Default</option>
                              <option value="low">Low (-5%)</option>
                              <option value="high">High (+5%)</option>
                            </select>
                            <div className="helper-text">Default: Default</div>
                          </div>

                          <div>
                            <label className="form-label">Volume: ${azure.volume || 'Default'}</label>
                            <select 
                              className="form-select"
                              value=${azure.volume || 'Default'}
                              onChange=${(e) => updateAzureTts('volume', e.target.value)}
                            >
                              <option value="Default">Default</option>
                              <option value="Silent">Silent</option>
                              <option value="Soft">Soft</option>
                              <option value="Medium">Medium</option>
                              <option value="Loud">Loud</option>
                            </select>
                            <div className="helper-text">Default: Default</div>
                          </div>

                          <div>
                            <label className="form-label">Style Degree: ${azure.styleDegree}</label>
                            <input 
                              type="range" min="0.5" max="2.0" step="0.1"
                              className="form-range"
                              value=${azure.styleDegree}
                              onInput=${(e) => updateAzureTts('styleDegree', parseFloat(e.target.value))}
                            />
                            <div className="helper-text">Default: 1.0</div>
                          </div>
                        </div>
                      </div>
                    ` : ''}

                    <!-- ElevenLabs Specific TTS Controls -->
                    ${ttsProvider === 'ElevenLabs' ? html`
                      <div style="background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 16px;">
                        <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 14px; color: var(--text-primary);">ElevenLabs Turbo Parameters</h4>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                          <div>
                            <label className="form-label">Voice ID</label>
                            <select 
                              className="form-select"
                              value=${elevenLabs.voiceId}
                              onChange=${(e) => updateElevenLabsTts('voiceId', e.target.value)}
                            >
                              <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm & Natural)</option>
                              <option value="AZnzlk1XvdvUeBnXmlld">Domi (Warm Customer Support)</option>
                              <option value="EXAVITQu4vr4xnSDxMaL">Bella (Expressive)</option>
                              <option value="ErXwobaYiN019PkySvjV">Antoni (Direct & Confident)</option>
                            </select>
                          </div>

                          <div>
                            <label className="form-label">Model</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              disabled 
                              value="eleven_flash_v2_5" 
                              style="background: #F3F4F6;"
                            />
                            <div className="helper-text">Model: eleven_flash_v2_5</div>
                          </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                          <div>
                            <label className="form-label">Stability: ${elevenLabs.stability}</label>
                            <input 
                              type="range" min="0" max="1" step="0.05"
                              className="form-range"
                              value=${elevenLabs.stability}
                              onInput=${(e) => updateElevenLabsTts('stability', parseFloat(e.target.value))}
                            />
                            <div className="helper-text">Default: 0.5</div>
                          </div>

                          <div>
                            <label className="form-label">Similarity: ${elevenLabs.similarity}</label>
                            <input 
                              type="range" min="0" max="1" step="0.05"
                              className="form-range"
                              value=${elevenLabs.similarity}
                              onInput=${(e) => updateElevenLabsTts('similarity', parseFloat(e.target.value))}
                            />
                            <div className="helper-text">Default: 0.75</div>
                          </div>

                          <div>
                            <label className="form-label">Style Exaggeration: ${elevenLabs.styleExaggeration ?? 0}</label>
                            <input 
                              type="range" min="0" max="1" step="0.05"
                              className="form-range"
                              value=${elevenLabs.styleExaggeration ?? 0}
                              onInput=${(e) => updateElevenLabsTts('styleExaggeration', parseFloat(e.target.value))}
                            />
                            <div className="helper-text">Default: 0</div>
                          </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-color);">
                          <div>
                            <div style="font-weight: 700; font-size: 13px;">Speaker Boost</div>
                            <div className="text-secondary" style="font-size: 12px;">Boosts voice likeness and volume clarity on phone calls.</div>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked=${elevenLabs.speakerBoost}
                              onChange=${(e) => updateElevenLabsTts('speakerBoost', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    ` : ''}

                  </div>
                ` : ''}
              `}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION C: LANGUAGE (REALTIME) ================= -->
        <div className="accordion ${openSections.language ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-language"
            aria-expanded="${openSections.language ? 'true' : 'false'}"
            aria-controls="accordion-content-language"
            onClick=${() => toggleSection('language')}
          >
            <div className="accordion-title">
              ${renderIcon('bot', { size: 18, color: 'var(--color-primary)' })}
              <span>Language Control (Realtime)</span>
              ${!isRealtime ? html`<span className="badge badge-draft" style="font-size: 10px;">Realtime Only</span>` : ''}
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.language ? html`
            <div 
              className="accordion-content"
              id="accordion-content-language"
              role="region"
              aria-labelledby="accordion-header-language"
            >
              ${!isRealtime ? html`
                <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: var(--radius-md); padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px;">
                  ${renderIcon('alert-triangle', { size: 16, color: '#D97706' })}
                  <div style="font-size: 13px; color: #92400E; line-height: 1.4;">
                    <strong>Realtime Feature Only:</strong> Language Control is exclusive to the Realtime Voice architecture. Cascaded Voice manages recognized languages via the Speech-to-Text (STT) language list.
                  </div>
                </div>
              ` : ''}

              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; opacity: ${isRealtime ? 1 : 0.6};">
                <div>
                  <div style="font-weight: 700; font-size: 14px;">Language Control</div>
                  <div className="text-secondary" style="font-size: 13px;">Turn on to set primary and supported languages; the agent dynamically replies in the caller's language.</div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    disabled=${!isRealtime}
                    checked=${isRealtime && agent.voiceSettings.language.control}
                    onChange=${(e) => updateVoice('language', 'control', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              ${isRealtime && agent.voiceSettings.language.control ? html`
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                  <div>
                    <label className="form-label required">Primary language</label>
                    <select 
                      className="form-select"
                      value=${agent.voiceSettings.language.primaryLanguage}
                      onChange=${(e) => updateVoice('language', 'primaryLanguage', e.target.value)}
                    >
                      ${LANGUAGES.map(l => html`<option key=${l} value=${l}>${l}</option>`)}
                    </select>
                    <div className="helper-text">Base language for greeting and default speech synthesis.</div>
                  </div>

                  <div>
                    <label className="form-label">Supported languages</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                      <select 
                        className="form-select" 
                        style="font-size: 13px;"
                        id="select-add-voice-language"
                        onChange=${(e) => {
                          const val = e.target.value;
                          if (val) {
                            const cur = agent.voiceSettings.language.supportedLanguages || [];
                            if (!cur.includes(val)) {
                              updateVoice('language', 'supportedLanguages', [...cur, val]);
                            }
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">+ Add language from catalog...</option>
                        ${LANGUAGES.filter(l => !(agent.voiceSettings.language.supportedLanguages || []).includes(l)).map(l => html`
                          <option key=${l} value=${l}>${l}</option>
                        `)}
                      </select>
                    </div>

                    <!-- Interactive Editable Language Chips with Remove 'x' -->
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; min-height: 38px; padding: 6px; background: #F8FAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                      ${(agent.voiceSettings.language.supportedLanguages || []).map(lang => html`
                        <span key=${lang} className="tag-chip" style="font-size: 12px; background: #FFFFFF; border: 1px solid #CBD5E1; padding: 3px 8px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 6px;">
                          <span>${lang}</span>
                          <span 
                            style="cursor: pointer; display: flex; align-items: center; color: var(--text-muted);"
                            onClick=${() => {
                              const cur = agent.voiceSettings.language.supportedLanguages || [];
                              updateVoice('language', 'supportedLanguages', cur.filter(l => l !== lang));
                            }}
                            title="Remove language"
                          >
                            ${renderIcon('x', { size: 12 })}
                          </span>
                        </span>
                      `)}
                      ${(!agent.voiceSettings.language.supportedLanguages || agent.voiceSettings.language.supportedLanguages.length === 0) ? html`
                        <span style="font-size: 12px; color: var(--text-muted); align-self: center; padding-left: 4px;">No additional supported languages selected.</span>
                      ` : ''}
                    </div>
                    <div className="helper-text">Add or remove languages the agent dynamically understands on calls.</div>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION D: BARGE-IN ================= -->
        <div className="accordion ${openSections.bargeIn ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-bargeIn"
            aria-expanded="${openSections.bargeIn ? 'true' : 'false'}"
            aria-controls="accordion-content-bargeIn"
            onClick=${() => toggleSection('bargeIn')}
          >
            <div className="accordion-title">
              ${renderIcon('mic-off', { size: 18, color: 'var(--color-primary)' })}
              <span>Barge-in (Caller Interruption)</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.bargeIn ? html`
            <div 
              className="accordion-content"
              id="accordion-content-bargeIn"
              role="region"
              aria-labelledby="accordion-header-bargeIn"
            >
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
        <div className="accordion ${openSections.dtmf ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-dtmf"
            aria-expanded="${openSections.dtmf ? 'true' : 'false'}"
            aria-controls="accordion-content-dtmf"
            onClick=${() => toggleSection('dtmf')}
          >
            <div className="accordion-title">
              ${renderIcon('hash', { size: 18, color: 'var(--color-primary)' })}
              <span>DTMF Keypad Settings</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.dtmf ? html`
            <div 
              className="accordion-content"
              id="accordion-content-dtmf"
              role="region"
              aria-labelledby="accordion-header-dtmf"
            >
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
                <div style="background: #F9FAFB; padding: 16px; border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                    <div>
                      <div style="font-weight: 700; font-size: 13px;">DTMF Barge-in</div>
                      <div className="text-secondary" style="font-size: 12px;">Allows keypad entry to interrupt ongoing agent speech immediately. Default ON.</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked=${agent.voiceSettings.dtmf.bargeIn !== false}
                        onChange=${(e) => updateVoice('dtmf', 'bargeIn', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
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
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <!-- ================= ACCORDION F: INACTIVITY ================= -->
        <div className="accordion ${openSections.inactivity ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-inactivity"
            aria-expanded="${openSections.inactivity ? 'true' : 'false'}"
            aria-controls="accordion-content-inactivity"
            onClick=${() => toggleSection('inactivity')}
          >
            <div className="accordion-title">
              ${renderIcon('clock', { size: 18, color: 'var(--color-primary)' })}
              <span>Inactivity Handling</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.inactivity ? html`
            <div 
              className="accordion-content"
              id="accordion-content-inactivity"
              role="region"
              aria-labelledby="accordion-header-inactivity"
            >
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
                        <option value="Agent generated">Agent generated (Default)</option>
                        <option value="Fixed prompt">Fixed prompt</option>
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
        <div className="accordion ${openSections.noise ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-noise"
            aria-expanded="${openSections.noise ? 'true' : 'false'}"
            aria-controls="accordion-content-noise"
            onClick=${() => toggleSection('noise')}
          >
            <div className="accordion-title">
              ${renderIcon('shield', { size: 18, color: 'var(--color-primary)' })}
              <span>Noise Cancellation</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.noise ? html`
            <div 
              className="accordion-content"
              id="accordion-content-noise"
              role="region"
              aria-labelledby="accordion-header-noise"
            >
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
                      <option value="FFmpeg">FFmpeg (Default)</option>
                      <option value="GStreamer">GStreamer</option>
                      <option value="AWS Elemental">AWS Elemental</option>
                      <option value="Twilio Media Streams">Twilio Media Streams</option>
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
        <div className="accordion ${openSections.recording ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-recording"
            aria-expanded="${openSections.recording ? 'true' : 'false'}"
            aria-controls="accordion-content-recording"
            onClick=${() => toggleSection('recording')}
          >
            <div className="accordion-title">
              ${renderIcon('play', { size: 18, color: 'var(--color-primary)' })}
              <span>Call Recording</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.recording ? html`
            <div 
              className="accordion-content"
              id="accordion-content-recording"
              role="region"
              aria-labelledby="accordion-header-recording"
            >
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
        <div className="accordion ${openSections.security ? 'is-open' : ''}">
          <button 
            type="button"
            className="accordion-header" 
            id="accordion-header-security"
            aria-expanded="${openSections.security ? 'true' : 'false'}"
            aria-controls="accordion-content-security"
            onClick=${() => toggleSection('security')}
          >
            <div className="accordion-title">
              ${renderIcon('shield', { size: 18, color: 'var(--color-primary)' })}
              <span>Security, PII & Data Retention</span>
              <span className="badge badge-published">Strict Compliance</span>
            </div>
            <span className="accordion-chevron">
              ${renderIcon('chevron-down', { size: 18 })}
            </span>
          </button>

          ${openSections.security ? html`
            <div 
              className="accordion-content"
              id="accordion-content-security"
              role="region"
              aria-labelledby="accordion-header-security"
            >
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
                    onInput=${(e) => actions.setVoiceDomainInput(e.target.value)}
                    onKeyDown=${(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        actions.addVoiceDomain();
                      }
                    }}
                  />
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick=${() => actions.addVoiceDomain()}
                  >
                    Add Domain
                  </button>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${agent.voiceSettings.security.allowedDomains.map(dom => html`
                    <span key=${dom} className="tag-chip">
                      ${renderIcon('shield', { size: 12, color: 'var(--color-primary)' })}
                      <span>${dom}</span>
                      <span 
                        className="remove-btn" 
                        onClick=${() => actions.removeVoiceDomain(dom)}
                        title="Remove domain"
                      >
                        ${renderIcon('x', { size: 12 })}
                      </span>
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