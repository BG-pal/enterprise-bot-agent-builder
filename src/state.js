// Global State Management & Persistence with LocalStorage
// Implements dirty checking, undo/discard, snapshotting, and publish workflows.

(function (global) {
  const STORAGE_KEY = 'enterprise_bot_agents_v1';

  // Deep merge helper ensuring all default sections and fields exist
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    const output = Array.isArray(target) ? [...target] : { ...target };
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = deepMerge(target && target[key] ? target[key] : {}, source[key]);
        } else {
          output[key] = (target && target[key] !== undefined) ? target[key] : source[key];
        }
      }
    }
    return output;
  }

  function loadInitialAgents() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaults = window.ENTERPRISE_DATA?.DEFAULT_AGENT_CONFIG;
          parsed.forEach((a, idx) => {
            if (defaults) {
              parsed[idx] = deepMerge(a, defaults);
            }
            if (parsed[idx].voiceSettings?.speech?.tts?.provider === 'Azure Neural TTS') {
              parsed[idx].voiceSettings.speech.tts.provider = 'Azure';
            }
          });
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(window.ENTERPRISE_DATA.INITIAL_AGENTS));
  }

  function saveAgentsToStorage(agents) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // Deep clone helper
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Generate version ID
  function generateVersionId() {
    const chars = '0123456789abcdef';
    let id = 'ver_eb_';
    for (let i = 0; i < 8; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  const state = {
    agents: loadInitialAgents(),
    currentAgentId: 'agent_customer_support',
    currentAgent: null,
    savedSnapshot: null, // Pristine snapshot of current agent
    hasUnsavedChanges: false,
    
    currentView: 'dashboard', // 'dashboard' | 'create' | 'configure'
    configTab: 'overview', // 'overview' | 'prompt' | 'tools' | 'model' | 'voice' | 'email'
    
    searchQuery: '',
    statusFilter: 'all', // 'all' | 'published' | 'draft' | 'unsaved'
    
    // Testing modal & workspace
    tryItOpen: false,
    tryItChannel: 'voice', // 'voice' | 'email'
    tryIt: {
      channel: 'voice', // 'voice' | 'email'
      voiceState: 'idle', // 'idle' | 'live' | 'ended'
      callSeconds: 0,
      timerInterval: null,
      isMuted: false,
      showTranscript: true,
      callEndedBy: '',
      voiceTurns: [],
      customCallerInput: '',
      emailFrom: 'pallavi.user@enterprise.com',
      emailSubject: '',
      emailBody: '',
      isReplying: false,
      emailThread: [],
      expandedDetails: {}
    },

    // Voice Settings Accordions & inputs (all collapsed initially)
    voiceSettingsUi: {
      openSections: {
        transcription: false,
        speech: false,
        language: false,
        bargeIn: false,
        dtmf: false,
        inactivity: false,
        noise: false,
        recording: false,
        security: false
      },
      domainInput: '',
      sttLangInput: ''
    },
    
    // Publish modal
    publishModalOpen: false,
    isPublishing: false,
    lastPublishedVersionId: null,
    
    // Discard modal
    discardModalOpen: false,
    
    // Mailbox connect modal
    connectMailboxOpen: false,
    
    // Notifications & Profile dropdown
    notificationsOpen: false,
    profileMenuOpen: false,
    
    // Toast alerts
    toasts: []
  };

  // Initialize current agent
  const defaultAgent = state.agents.find(a => a.id === state.currentAgentId) || state.agents[0];
  if (defaultAgent) {
    state.currentAgent = clone(defaultAgent);
    state.savedSnapshot = clone(defaultAgent);
  }

  function notify() {
    saveAgentsToStorage(state.agents);
    if (typeof window.scheduleRender === 'function') {
      window.scheduleRender();
    }
  }

  function addToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    state.toasts.push({ id, message, type });
    notify();
    setTimeout(() => {
      state.toasts = state.toasts.filter(t => t.id !== id);
      notify();
    }, 3500);
  }

  function checkDirty() {
    if (!state.currentAgent || !state.savedSnapshot) {
      state.hasUnsavedChanges = false;
      return;
    }
    const currentStr = JSON.stringify(state.currentAgent);
    const savedStr = JSON.stringify(state.savedSnapshot);
    const isDirty = currentStr !== savedStr;
    state.hasUnsavedChanges = isDirty;
    if (isDirty && state.currentAgent.status === 'Published') {
      state.currentAgent.status = 'Unsaved changes';
    } else if (!isDirty && state.savedSnapshot.status === 'Published') {
      state.currentAgent.status = 'Published';
    }
  }

  function validateAgentConfig(agent) {
    if (!agent) return ['No agent selected.'];
    const errors = [];

    // 1. General & Channels
    if (!agent.name || !agent.name.trim()) {
      errors.push('Agent Name is required.');
    }
    if (agent.channels?.voice && !agent.speechStack) {
      errors.push('Voice architecture (Speech Stack) is required.');
    }

    // 2. Tools
    if (agent.toolCallCustomMessages && (!agent.toolDefaultMessage || !agent.toolDefaultMessage.trim())) {
      errors.push('Default Tool Message is required when Tool Call Custom Messages are enabled.');
    }

    // 3. Shared Model Settings
    if (agent.sharedModel) {
      const temp = Number(agent.sharedModel.temperature);
      if (isNaN(temp) || temp < 0 || temp > 1) {
        errors.push('Shared Model Temperature must be between 0.0 and 1.0.');
      }
      const limit = Number(agent.sharedModel.toolCallLimit);
      if (isNaN(limit) || limit < 1) {
        errors.push('Tool Call Limit must be an integer greater than or equal to 1.');
      }
      if (agent.sharedModel.historyManagement?.enabled) {
        const trig = Number(agent.sharedModel.historyManagement.triggerTokens);
        const targ = Number(agent.sharedModel.historyManagement.targetTokens);
        if (!isNaN(trig) && !isNaN(targ) && targ > trig) {
          errors.push('History Management target tokens cannot exceed trigger tokens.');
        }
      }
    }

    // 4. Voice Model Override
    if (agent.voiceModelOverride?.enabled) {
      if (agent.voiceModelOverride.temperature !== 'Inherited') {
        const temp = Number(agent.voiceModelOverride.temperature);
        if (isNaN(temp) || temp < 0 || temp > 1) {
          errors.push('Voice Override Temperature must be between 0.0 and 1.0.');
        }
      }
      if (agent.voiceModelOverride.toolCallLimit !== 'Inherited') {
        const limit = Number(agent.voiceModelOverride.toolCallLimit);
        if (isNaN(limit) || limit < 1) {
          errors.push('Voice Override Tool Call Limit must be an integer >= 1.');
        }
      }
    }

    // 5. Voice Settings
    const vs = agent.voiceSettings;
    if (vs) {
      // Speech: STT
      if (!vs.speech?.stt?.provider || !vs.speech.stt.provider.trim()) {
        errors.push('STT Speech Service is required.');
      }
      // Speech: TTS
      if (!vs.speech?.tts?.provider || !vs.speech.tts.provider.trim()) {
        errors.push('TTS Provider is required.');
      }
      // Inactivity
      if (vs.inactivity?.enabled && vs.inactivity.retryPromptMode === 'Fixed prompt') {
        if (!vs.inactivity.inactivityPrompt || !vs.inactivity.inactivityPrompt.trim()) {
          errors.push('Inactivity retry prompt is required when Fixed prompt mode is selected.');
        }
      }
      // Security
      if (vs.security) {
        const rate = Number(vs.security.rateLimit);
        if (isNaN(rate) || rate <= 0) {
          errors.push('Security rate limit must be a positive number.');
        }
        if (Array.isArray(vs.security.allowedDomains)) {
          for (const d of vs.security.allowedDomains) {
            if (!d || !d.includes('.')) {
              errors.push(`Invalid domain format in allowed domains: "${d}". Must contain a valid domain (e.g. example.com).`);
              break;
            }
          }
        }
      }
    }

    return errors;
  }

  const actions = {
    validateAgentConfig,

    setView(view, agentId = null) {
      state.currentView = view;
      if (agentId) {
        actions.selectAgent(agentId);
      }
      notify();
    },

    setConfigTab(tab) {
      state.configTab = tab;
      notify();
    },

    selectAgent(agentId) {
      const found = state.agents.find(a => a.id === agentId);
      if (found) {
        state.currentAgentId = agentId;
        state.currentAgent = clone(found);
        state.savedSnapshot = clone(found);
        state.hasUnsavedChanges = false;
        state.currentView = 'configure';
        state.configTab = 'overview';
      }
      notify();
    },

    updateCurrentAgent(updates) {
      if (!state.currentAgent) return;
      Object.assign(state.currentAgent, updates);
      state.currentAgent.updatedAt = new Date().toISOString();
      checkDirty();
      notify();
    },

    saveChanges() {
      if (!state.currentAgent) return false;
      const errors = validateAgentConfig(state.currentAgent);
      if (errors && errors.length > 0) {
        addToast(`Validation error: ${errors[0]}`, 'error');
        return false;
      }
      state.currentAgent.updatedAt = new Date().toISOString();
      state.savedSnapshot = clone(state.currentAgent);
      state.hasUnsavedChanges = false;

      // Update in agents list
      const idx = state.agents.findIndex(a => a.id === state.currentAgent.id);
      if (idx !== -1) {
        state.agents[idx] = clone(state.currentAgent);
      }
      addToast('Changes saved successfully!', 'success');
      notify();
      return true;
    },

    discardChanges() {
      if (!state.savedSnapshot) return;
      state.currentAgent = clone(state.savedSnapshot);
      state.hasUnsavedChanges = false;
      state.discardModalOpen = false;
      addToast('Unsaved changes discarded. Restored previous configuration.', 'info');
      notify();
    },

    openPublishModal() {
      if (!state.currentAgent) return;
      const errors = validateAgentConfig(state.currentAgent);
      if (errors && errors.length > 0) {
        addToast(`Cannot publish: ${errors[0]}`, 'error');
        return;
      }
      if (!state.hasUnsavedChanges && state.currentAgent.status === 'Published') {
        addToast('No changes to publish. Your agent is already up to date.', 'info');
        return;
      }
      state.publishModalOpen = true;
      notify();
    },

    closePublishModal() {
      state.publishModalOpen = false;
      notify();
    },

    publishAgent(versionName) {
      if (!state.currentAgent) return;
      state.isPublishing = true;
      state.currentAgent.status = 'Publishing…';
      notify();

      setTimeout(() => {
        const newVersionId = generateVersionId();
        state.currentAgent.status = 'Published';
        state.currentAgent.versionName = versionName || (state.currentAgent.versionName || 'v1.0.0 - Production');
        state.currentAgent.versionId = newVersionId;
        state.currentAgent.publishedAt = new Date().toISOString();
        state.currentAgent.updatedAt = new Date().toISOString();

        state.savedSnapshot = clone(state.currentAgent);
        state.hasUnsavedChanges = false;
        state.isPublishing = false;
        state.lastPublishedVersionId = newVersionId;

        // Update in agents list
        const idx = state.agents.findIndex(a => a.id === state.currentAgent.id);
        if (idx !== -1) {
          state.agents[idx] = clone(state.currentAgent);
        }

        addToast(`Agent published successfully! Version: ${newVersionId}`, 'success');
        notify();
      }, 1200);
    },

    createNewAgent(agentData) {
      const newId = 'agent_' + Date.now();
      const newAgent = {
        ...clone(window.ENTERPRISE_DATA.DEFAULT_AGENT_CONFIG),
        ...agentData,
        id: newId,
        status: 'Draft',
        updatedAt: new Date().toISOString()
      };

      // Voice stack inherits the selection made during agent creation
      if (newAgent.voiceModelOverride) {
        newAgent.voiceModelOverride.speechStack = agentData.speechStack || 'cascaded';
      }

      state.agents.unshift(newAgent);
      state.currentAgentId = newId;
      state.currentAgent = clone(newAgent);
      state.savedSnapshot = clone(newAgent);
      state.hasUnsavedChanges = false;
      state.currentView = 'configure';

      // After-create routing as strictly specified in assignment:
      // - Voice-only agent -> Behaviour -> Prompts
      state.configTab = 'prompt';

      addToast(`Agent "${newAgent.name}" created as Draft!`, 'success');
      notify();
    },

    deleteAgent(agentId) {
      state.agents = state.agents.filter(a => a.id !== agentId);
      if (state.currentAgentId === agentId) {
        if (state.agents.length > 0) {
          actions.selectAgent(state.agents[0].id);
        } else {
          state.currentAgent = null;
          state.currentAgentId = null;
          state.currentView = 'dashboard';
        }
      }
      addToast('Agent deleted.', 'info');
      notify();
    },

    openTryIt(channel = null) {
      if (!state.currentAgent) return;
      if (channel) {
        state.tryIt.channel = channel;
        state.tryItChannel = channel;
      } else if (state.currentAgent.channels.voice) {
        state.tryIt.channel = 'voice';
        state.tryItChannel = 'voice';
      } else {
        state.tryIt.channel = 'email';
        state.tryItChannel = 'email';
      }
      state.tryItOpen = true;
      notify();
    },

    closeTryIt() {
      if (state.tryIt.timerInterval) {
        clearInterval(state.tryIt.timerInterval);
        state.tryIt.timerInterval = null;
      }
      state.tryItOpen = false;
      notify();
    },

    setTryItChannel(channel) {
      if (!state.currentAgent) return;
      if (channel === 'voice' && !state.currentAgent.channels.voice) return;
      if (channel === 'email' && !state.currentAgent.channels.email) return;
      if (channel === 'chat') return; // Chat is Coming Soon
      state.tryIt.channel = channel;
      state.tryItChannel = channel;
      notify();
    },

    startVoiceCall() {
      if (!state.currentAgent) return;
      if (state.tryIt.timerInterval) {
        clearInterval(state.tryIt.timerInterval);
        state.tryIt.timerInterval = null;
      }
      state.tryIt.voiceState = 'live';
      state.tryIt.callSeconds = 0;
      state.tryIt.isMuted = false;
      state.tryIt.showTranscript = true;
      state.tryIt.callEndedBy = '';
      const greeting = state.currentAgent.welcomeMessage?.trim() || 'Hello! Thank you for calling Acme Enterprise Support. How can I assist you today?';
      state.tryIt.voiceTurns = [
        {
          speaker: 'agent',
          text: greeting,
          tool: null,
          timestamp: '00:01'
        }
      ];
      state.tryIt.timerInterval = setInterval(() => {
        if (state.tryIt.voiceState === 'live') {
          state.tryIt.callSeconds++;
          notify();
        }
      }, 1000);
      notify();
    },

    endVoiceCall(endedBy = 'Caller') {
      if (state.tryIt.timerInterval) {
        clearInterval(state.tryIt.timerInterval);
        state.tryIt.timerInterval = null;
      }
      state.tryIt.voiceState = 'ended';
      state.tryIt.callEndedBy = `${endedBy} ended the call`;
      notify();
    },

    toggleVoiceMute() {
      state.tryIt.isMuted = !state.tryIt.isMuted;
      notify();
    },

    toggleVoiceTranscript() {
      state.tryIt.showTranscript = !state.tryIt.showTranscript;
      notify();
    },

    sendVoiceCallerTurn(promptText) {
      if (!promptText || state.tryIt.voiceState !== 'live') return;
      const m = Math.floor(state.tryIt.callSeconds / 60);
      const s = state.tryIt.callSeconds % 60;
      const timestamp = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      state.tryIt.voiceTurns.push({
        speaker: 'caller',
        text: promptText.trim(),
        timestamp: timestamp
      });
      state.tryIt.customCallerInput = '';
      notify();

      setTimeout(() => {
        if (state.tryIt.voiceState !== 'live') return;
        const lower = promptText.toLowerCase();
        let reply = '';
        let tool = null;

        if (lower.includes('claim') || lower.includes('status')) {
          reply = 'Certainly! I would be glad to look up your claim status. Could you please share your claim reference number?';
          tool = 'kb_search';
        } else if (lower.includes('clm') || lower.includes('98234') || lower.includes('reference')) {
          reply = 'Thank you! I located claim #CLM-98234 for property damage repair. The claim was approved by the claims adjuster on Oct 24th, and a reimbursement payment of $1,420.00 will be credited to your account within 2 business days.';
          tool = 'crm_lookup_policy';
        } else if (lower.includes('transfer') || lower.includes('human') || lower.includes('representative') || lower.includes('agent') || lower.includes('person')) {
          reply = 'I understand. I am transferring your call directly to our Senior Claims Specialist queue now. Please hold for just a moment.';
          tool = 'calendar_scheduler';
        } else {
          reply = `I have logged your request regarding "${promptText}". Querying internal records now... How else can I assist with this request?`;
          tool = state.currentAgent.assignedTools?.[0] || 'kb_search';
        }

        const agentSec = state.tryIt.callSeconds;
        const am = Math.floor(agentSec / 60);
        const as = agentSec % 60;
        state.tryIt.voiceTurns.push({
          speaker: 'agent',
          text: reply,
          tool: tool,
          timestamp: `${String(am).padStart(2, '0')}:${String(as).padStart(2, '0')}`
        });
        notify();
      }, 750);
    },

    setTryItCallerInput(val) {
      state.tryIt.customCallerInput = val;
      notify();
    },

    setTryItEmailSubject(val) {
      state.tryIt.emailSubject = val;
      notify();
    },

    setTryItEmailBody(val) {
      state.tryIt.emailBody = val;
      notify();
    },

    sendTryItEmail() {
      const subject = state.tryIt.emailSubject?.trim();
      const body = state.tryIt.emailBody?.trim();
      if (!subject || !body) return;

      const agent = state.currentAgent;
      const recipientMailbox = agent?.emailSettings?.inbox?.mailboxes?.[0]?.address || 'support@acme.enterprisebot.ai';

      const userMsgId = 'msg_' + Date.now();
      const sentMsg = {
        id: userMsgId,
        sender: state.tryIt.emailFrom,
        recipient: recipientMailbox,
        subject: subject,
        body: body,
        timestamp: 'Just now',
        isExpanded: false,
        type: 'user'
      };

      // Collapse older messages so the latest will be clear
      state.tryIt.emailThread.forEach(m => m.isExpanded = false);
      sentMsg.isExpanded = true;
      state.tryIt.emailThread.push(sentMsg);
      state.tryIt.isReplying = true;
      state.tryIt.emailSubject = '';
      state.tryIt.emailBody = '';
      notify();

      setTimeout(() => {
        state.tryIt.isReplying = false;
        const threading = agent?.emailSettings?.threading || {};
        let sig = '';
        if (threading.appendSignature) {
          if (threading.signatureType === 'Agent signature' && threading.agentSignatureText) {
            sig = '\n\n' + threading.agentSignatureText;
          } else {
            sig = '\n\nBest regards,\nCustomer Support Team\nAcme Enterprise';
          }
        }

        const replyBody = `Hello,\n\nThank you for contacting us regarding "${subject}".\n\nOur system has reviewed your request. Your claim reference CLM-98234 is currently in final review with all required documentation attached. A confirmation has been logged to your account.\n\nPlease let us know if you need any additional assistance.${sig}`;

        // Collapse previous messages, newest message expanded by default
        state.tryIt.emailThread.forEach(m => m.isExpanded = false);

        const agentMsgId = 'msg_' + (Date.now() + 1);
        const agentMsg = {
          id: agentMsgId,
          sender: threading.personAddress || 'support.rep@acme.enterprisebot.ai',
          recipient: state.tryIt.emailFrom,
          subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
          body: replyBody,
          timestamp: 'Just now',
          isExpanded: true, // newest message expanded by default
          type: 'agent',
          toolsUsed: ['crm_lookup_policy', 'kb_search'],
          extractedEntities: [
            { name: 'claim_id', value: 'CLM-98234', confidence: '98%' },
            { name: 'customer_name', value: 'Pallavi BG', confidence: '95%' },
            { name: 'intent', value: 'claim_status_inquiry', confidence: '99%' }
          ]
        };

        state.tryIt.emailThread.push(agentMsg);
        notify();
      }, 1100);
    },

    toggleTryItEmailMessage(id) {
      const msg = state.tryIt.emailThread.find(m => m.id === id);
      if (msg) {
        msg.isExpanded = !msg.isExpanded;
        notify();
      }
    },

    toggleTryItEmailDetails(id) {
      state.tryIt.expandedDetails[id] = !state.tryIt.expandedDetails[id];
      notify();
    },

    newTestEmail() {
      state.tryIt.emailThread = [];
      state.tryIt.emailSubject = '';
      state.tryIt.emailBody = '';
      state.tryIt.isReplying = false;
      state.tryIt.expandedDetails = {};
      addToast('Started a fresh email testing thread.', 'info');
      notify();
    },

    toggleVoiceAccordion(sectionKey) {
      if (!state.voiceSettingsUi) {
        state.voiceSettingsUi = { openSections: {} };
      }
      if (!state.voiceSettingsUi.openSections) {
        state.voiceSettingsUi.openSections = {};
      }
      state.voiceSettingsUi.openSections[sectionKey] = !state.voiceSettingsUi.openSections[sectionKey];
      notify();
    },

    setVoiceDomainInput(val) {
      if (!state.voiceSettingsUi) state.voiceSettingsUi = { openSections: {} };
      state.voiceSettingsUi.domainInput = val;
      notify();
    },

    setVoiceSttLangInput(val) {
      if (!state.voiceSettingsUi) state.voiceSettingsUi = { openSections: {} };
      state.voiceSettingsUi.sttLangInput = val;
      notify();
    },

    addVoiceDomain() {
      if (!state.voiceSettingsUi) state.voiceSettingsUi = { openSections: {} };
      const val = state.voiceSettingsUi.domainInput?.trim();
      if (!val) return;
      if (!val.includes('.')) {
        addToast('Domain must contain a valid domain name (e.g. example.com)', 'error');
        return;
      }
      if (state.currentAgent) {
        const currentDomains = state.currentAgent.voiceSettings.security.allowedDomains || [];
        if (!currentDomains.includes(val)) {
          state.currentAgent.voiceSettings.security.allowedDomains = [...currentDomains, val];
          state.hasUnsavedChanges = true;
          state.voiceSettingsUi.domainInput = '';
          notify();
        } else {
          addToast('Domain is already in the allowed list.', 'info');
        }
      }
    },

    removeVoiceDomain(dom) {
      if (state.currentAgent) {
        state.currentAgent.voiceSettings.security.allowedDomains = (state.currentAgent.voiceSettings.security.allowedDomains || []).filter(d => d !== dom);
        state.hasUnsavedChanges = true;
        notify();
      }
    },

    addVoiceSttLanguage() {
      if (!state.voiceSettingsUi) state.voiceSettingsUi = { openSections: {} };
      const val = state.voiceSettingsUi.sttLangInput?.trim();
      if (val && state.currentAgent) {
        const currentLangs = state.currentAgent.voiceSettings.speech.stt.languages || [];
        if (!currentLangs.includes(val)) {
          state.currentAgent.voiceSettings.speech.stt.languages = [...currentLangs, val];
          state.hasUnsavedChanges = true;
          state.voiceSettingsUi.sttLangInput = '';
          notify();
        }
      }
    },

    removeVoiceSttLanguage(code) {
      if (state.currentAgent) {
        state.currentAgent.voiceSettings.speech.stt.languages = (state.currentAgent.voiceSettings.speech.stt.languages || []).filter(c => c !== code);
        state.hasUnsavedChanges = true;
        notify();
      }
    },

    addToast
  };

  global.AppState = state;
  global.AppActions = actions;
})(window);
