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
      expandedDetails: {},
      callHistory: [],
      callLogsOpen: false
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
    toasts: [],

    // Multi-snapshot tracking (Phase 8)
    lastSavedSnapshot: null,
    lastPublishedSnapshot: null
  };

  // Initialize current agent
  const defaultAgent = state.agents.find(a => a.id === state.currentAgentId) || state.agents[0];
  if (defaultAgent) {
    state.currentAgent = clone(defaultAgent);
    state.lastSavedSnapshot = clone(defaultAgent);
    state.savedSnapshot = clone(defaultAgent);
    state.lastPublishedSnapshot = defaultAgent.status === 'Published' ? clone(defaultAgent) : null;
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
    if (!state.currentAgent || !state.lastSavedSnapshot) {
      state.hasUnsavedChanges = false;
      return;
    }
    const currentStr = JSON.stringify(state.currentAgent);
    const savedStr = JSON.stringify(state.lastSavedSnapshot);
    const publishedStr = state.lastPublishedSnapshot ? JSON.stringify(state.lastPublishedSnapshot) : null;

    const isDirty = currentStr !== savedStr;
    state.hasUnsavedChanges = isDirty;

    if (publishedStr) {
      if (currentStr !== publishedStr) {
        state.currentAgent.status = 'Unsaved changes';
      } else {
        state.currentAgent.status = 'Published';
      }
    } else {
      state.currentAgent.status = 'Draft';
    }
  }

  function validateAgentConfig(agent) {
    if (!agent) return ['No agent selected.'];
    const errors = [];

    const isIntegerGte1 = (v) => v !== '' && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) >= 1;
    const isIntegerGte0 = (v) => v !== '' && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) >= 0;
    const isPositiveInteger = (v) => v !== '' && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) > 0;

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
      if (!isIntegerGte1(agent.sharedModel.toolCallLimit)) {
        errors.push('Tool Call Limit must be an integer greater than or equal to 1.');
      }
      if (agent.sharedModel.historySummaryEnabled) {
        if (!isIntegerGte1(agent.sharedModel.historyResponses)) {
          errors.push('History Responses must be an integer greater than or equal to 1.');
        }
        if (!isPositiveInteger(agent.sharedModel.triggerTokens)) {
          errors.push('Trigger Tokens must be a positive integer.');
        }
        if (!isPositiveInteger(agent.sharedModel.targetTokens)) {
          errors.push('Target Tokens must be a positive integer.');
        }
        if (isPositiveInteger(agent.sharedModel.triggerTokens) && isPositiveInteger(agent.sharedModel.targetTokens)) {
          if (Number(agent.sharedModel.targetTokens) >= Number(agent.sharedModel.triggerTokens)) {
            errors.push('Target Tokens must be strictly less than Trigger Tokens.');
          }
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
        if (!isIntegerGte1(agent.voiceModelOverride.toolCallLimit)) {
          errors.push('Voice Override Tool Call Limit must be an integer >= 1.');
        }
      }
      if (agent.voiceModelOverride.historyOverride?.enabled) {
        if (!isIntegerGte1(agent.voiceModelOverride.historyOverride.historyResponses)) {
          errors.push('Number of History Responses must be an integer >= 1.');
        }
        if (!isPositiveInteger(agent.voiceModelOverride.historyOverride.triggerTokens)) {
          errors.push('Trigger Tokens must be a positive integer.');
        }
        if (!isPositiveInteger(agent.voiceModelOverride.historyOverride.targetTokens)) {
          errors.push('Target Tokens must be a positive integer.');
        }
        if (isPositiveInteger(agent.voiceModelOverride.historyOverride.triggerTokens) && isPositiveInteger(agent.voiceModelOverride.historyOverride.targetTokens)) {
          if (Number(agent.voiceModelOverride.historyOverride.targetTokens) >= Number(agent.voiceModelOverride.historyOverride.triggerTokens)) {
            errors.push('Voice Target Tokens must be strictly less than Trigger Tokens.');
          }
        }
      }
    }

    // 5. Voice Settings (only when voice channel enabled)
    if (agent.channels?.voice) {
      const vs = agent.voiceSettings;
      const effectiveStack = (typeof window.getEffectiveSpeechStack === 'function')
        ? window.getEffectiveSpeechStack(agent)
        : (agent.voiceModelOverride?.enabled ? agent.voiceModelOverride.speechStack : agent.speechStack) || 'cascaded';
      const isRealtime = effectiveStack === 'realtime';

      if (vs) {
        // Speech: STT/TTS only for cascaded stack
        if (!isRealtime) {
          if (!vs.speech?.stt?.provider || !vs.speech.stt.provider.trim()) {
            errors.push('STT Speech Service is required.');
          }
          if (!vs.speech?.tts?.provider || !vs.speech.tts.provider.trim()) {
            errors.push('TTS Provider is required.');
          }
          if (vs.speech?.silenceTimeout !== undefined && !isIntegerGte0(vs.speech.silenceTimeout)) {
            errors.push('General Speech Silence Timeout must be a non-negative integer.');
          }
          if (vs.speech?.stt?.segmentationSilenceTimeout !== undefined && !isIntegerGte0(vs.speech.stt.segmentationSilenceTimeout)) {
            errors.push('STT Segmentation Silence Timeout must be a non-negative integer.');
          }
        }

        // DTMF Keypad
        if (vs.dtmf?.enabled) {
          if (!isIntegerGte0(vs.dtmf.interDigitTimeout)) {
            errors.push('DTMF inter-digit timeout must be a non-negative integer.');
          }
          if (!isIntegerGte1(vs.dtmf.maxDigits)) {
            errors.push('DTMF maximum digits must be an integer >= 1.');
          }
        }

        // Inactivity
        if (vs.inactivity?.enabled) {
          if (!isIntegerGte0(vs.inactivity.initialWaitTime)) {
            errors.push('Inactivity initial wait time must be a non-negative integer.');
          }
          if (!isIntegerGte0(vs.inactivity.retryInterval)) {
            errors.push('Inactivity retry interval must be a non-negative integer.');
          }
          if (!isIntegerGte0(vs.inactivity.inactivityRetries)) {
            errors.push('Inactivity retry count must be a non-negative integer.');
          }
          if (vs.inactivity.retryPromptMode === 'Fixed prompt') {
            if (!vs.inactivity.inactivityPrompt || !vs.inactivity.inactivityPrompt.trim()) {
              errors.push('Inactivity retry prompt is required when Fixed prompt mode is selected.');
            }
          }
        }

        // Security
        if (vs.security) {
          if (!isIntegerGte1(vs.security.rateLimit)) {
            errors.push('Security rate limit must be an integer >= 1.');
          }
          if (!isIntegerGte0(vs.security.dataRetentionDays)) {
            errors.push('Security data retention must be a non-negative integer.');
          }
          if (Array.isArray(vs.security.allowedDomains)) {
            const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
            for (const d of vs.security.allowedDomains) {
              if (!d || !domainRegex.test(d)) {
                errors.push(`Invalid domain format in allowed domains: "${d}". Must contain a valid domain (e.g. app.acme.com).`);
                break;
              }
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
        state.lastSavedSnapshot = clone(found);
        state.savedSnapshot = clone(found);
        state.lastPublishedSnapshot = found.status === 'Published'
          ? clone(found)
          : (found.lastPublishedConfig ? clone(found.lastPublishedConfig) : (found.publishedAt ? clone(found) : null));
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
      state.lastSavedSnapshot = clone(state.currentAgent);
      state.savedSnapshot = clone(state.currentAgent);
      state.hasUnsavedChanges = false;

      // Maintain status tracking relative to production published state
      if (state.lastPublishedSnapshot) {
        const isIdenticalToPublished = JSON.stringify(state.currentAgent) === JSON.stringify(state.lastPublishedSnapshot);
        state.currentAgent.status = isIdenticalToPublished ? 'Published' : 'Unsaved changes';
      } else {
        state.currentAgent.status = 'Draft';
      }

      // Update in agents list
      const idx = state.agents.findIndex(a => a.id === state.currentAgent.id);
      if (idx !== -1) {
        state.agents[idx] = clone(state.currentAgent);
      }
      addToast('Working configuration saved.', 'success');
      notify();
      return true;
    },

    discardChanges() {
      // Requirement 1: Discard Changes restores lastPublishedSnapshot for published agents
      const targetSnapshot = state.lastPublishedSnapshot || state.lastSavedSnapshot;
      if (!targetSnapshot) return;

      state.currentAgent = clone(targetSnapshot);
      state.lastSavedSnapshot = clone(targetSnapshot);
      state.savedSnapshot = clone(targetSnapshot);
      state.hasUnsavedChanges = false;
      state.discardModalOpen = false;

      if (state.lastPublishedSnapshot) {
        state.currentAgent.status = 'Published';
      } else {
        state.currentAgent.status = 'Draft';
      }

      const idx = state.agents.findIndex(a => a.id === state.currentAgent.id);
      if (idx !== -1) {
        state.agents[idx] = clone(state.currentAgent);
      }

      addToast(
        state.lastPublishedSnapshot
          ? 'Discarded changes. Restored last published configuration.'
          : 'Discarded unsaved changes. Restored saved configuration.',
        'info'
      );
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

        state.currentAgent.lastPublishedConfig = clone(state.currentAgent);
        state.lastPublishedSnapshot = clone(state.currentAgent);
        state.lastSavedSnapshot = clone(state.currentAgent);
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
      // - Email picked -> Email -> Inbox
      if (newAgent.channels?.email && !newAgent.channels?.voice) {
        state.configTab = 'email';
      } else {
        state.configTab = 'prompt';
      }

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
      const reason = (endedBy === 'Agent') ? 'Agent ended the call' : 'Caller ended the call';
      state.tryIt.callEndedBy = reason;

      if (!state.tryIt.callHistory) {
        state.tryIt.callHistory = [];
      }
      state.tryIt.callHistory.unshift({
        id: 'call_' + Date.now(),
        sessionId: 'SESS-' + Math.floor(100000 + Math.random() * 900000),
        agentName: state.currentAgent?.name || 'Voice Agent',
        endedBy: reason,
        duration: state.tryIt.callSeconds,
        turnsCount: state.tryIt.voiceTurns.length,
        timestamp: new Date().toLocaleTimeString(),
        turns: clone(state.tryIt.voiceTurns)
      });
      notify();
    },

    toggleCallLogs() {
      state.tryIt.callLogsOpen = !state.tryIt.callLogsOpen;
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
          tool = null;
        }

        // Restrict tool strictly to assigned and compatible tools (Phase 7 requirement)
        const assigned = state.currentAgent?.assignedTools || [];
        const effectiveStack = (typeof window.getEffectiveSpeechStack === 'function')
          ? window.getEffectiveSpeechStack(state.currentAgent)
          : (state.currentAgent?.voiceModelOverride?.enabled ? state.currentAgent.voiceModelOverride.speechStack : state.currentAgent?.speechStack) || 'cascaded';
        const isRealtime = state.currentAgent?.channels?.voice && effectiveStack === 'realtime';
        
        const compatibleTools = assigned.filter(tId => {
          if (!isRealtime) return true;
          const toolDef = window.ENTERPRISE_DATA?.TEAM_TOOLS?.find(t => t.id === tId);
          return !toolDef?.incompatibleRealtime;
        });

        if (tool && !compatibleTools.includes(tool)) {
          tool = compatibleTools.length > 0 ? compatibleTools[0] : null;
        } else if (!tool && compatibleTools.length > 0 && Math.random() > 0.5) {
          tool = compatibleTools[0];
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
