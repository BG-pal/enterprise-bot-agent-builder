// Global State Management & Persistence with LocalStorage
// Implements dirty checking, undo/discard, snapshotting, and publish workflows.

(function (global) {
  const STORAGE_KEY = 'enterprise_bot_agents_v1';

  function loadInitialAgents() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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

  const actions = {
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
      if (!state.currentAgent) return;
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
      // - Agent with Email selected -> Email -> Inbox
      if (newAgent.channels.email) {
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
      // Default to voice if enabled, otherwise email
      if (channel) {
        state.tryItChannel = channel;
      } else if (state.currentAgent.channels.voice) {
        state.tryItChannel = 'voice';
      } else {
        state.tryItChannel = 'email';
      }
      state.tryItOpen = true;
      notify();
    },

    closeTryIt() {
      state.tryItOpen = false;
      notify();
    },

    addToast
  };

  global.AppState = state;
  global.AppActions = actions;
})(window);
