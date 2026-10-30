// Initial data, defaults, tool library, model catalogs, and initial agents

const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'German',
  'French',
  'Italian',
  'Spanish',
  'Portuguese',
  'Polish'
];

const SHARED_MODELS = [
  'azure/gpt-4.1-mini/eu',
  'azure/gpt-4.1/eu',
  'azure/gpt-4o/eu',
  'openai/gpt-4o/global',
  'vertex_ai/gemini-2.5-flash/eu',
  'anthropic/claude-sonnet-4.5/eu'
];

const REALTIME_MODELS = [
  'azure/gpt-realtime-2.1/global',
  'azure/gpt-realtime-mini/global',
  'vertex_ai/gemini-live-2.5-flash-native-audio',
  'vertex_ai/gemini-live-2.5-flash'
];

const CASCADED_MODELS = [
  'azure/gpt-4.1/eu',
  'azure/gpt-4.1-mini/eu',
  'azure/gpt-4o/eu',
  'openai/gpt-4o/global',
  'vertex_ai/gemini-2.5-flash/eu',
  'anthropic/claude-sonnet-4.5/eu'
];

const REALTIME_VOICES = [
  'Aria – calm, mid-pitch',
  'Nova',
  'Onyx',
  'Sage'
];

const TURN_DETECTIONS = [
  'Server VAD · 0.4 s',
  'Server VAD · 0.6 s',
  'Server VAD · 1.0 s',
  'Semantic VAD',
  'Push to talk'
];

const REASONING_LEVELS = [
  'Minimal',
  'Low',
  'Medium',
  'High'
];

const TIMEZONES = [
  'Europe/Zurich (Team default)',
  'UTC',
  'America/New_York (EST/EDT)',
  'Europe/London (GMT/BST)',
  'Europe/Berlin (CET)',
  'Asia/Kolkata (IST)',
  'Asia/Tokyo (JST)'
];

const STT_PROVIDERS = [
  'Team default service',
  'Azure Speech Services',
  'Soniox Realtime',
  'Deepgram Nova-2',
  'Google Cloud Speech'
];

const TTS_PROVIDERS = [
  'Azure',
  'ElevenLabs'
];

const STT_MODELS_BY_PROVIDER = {
  'Team default service': [
    'Team default (Azure Neural v2)',
    'Enhanced telephony wideband',
    'Low-latency conversational'
  ],
  'Azure Speech Services': [
    'Provider default (Recommended)',
    'Latest neural v2',
    'Enhanced telephony wideband',
    'Custom acoustic model'
  ],
  'Soniox Realtime': [
    'Soniox general v3',
    'Soniox telephony v2',
    'Soniox high-accuracy'
  ],
  'Deepgram Nova-2': [
    'Nova-2 General (Recommended)',
    'Nova-2 Phonecall',
    'Nova-2 Conversational AI',
    'Nova-2 Medical'
  ],
  'Google Cloud Speech': [
    'Chirp v2 (Multilingual)',
    'Telephony latest_long',
    'Command and Search'
  ]
};

function getEffectiveSpeechStack(agent) {
  if (!agent) return 'cascaded';
  if (agent.voiceModelOverride?.enabled) {
    return agent.voiceModelOverride.speechStack || agent.speechStack || 'cascaded';
  }
  return agent.speechStack || 'cascaded';
}

const TEAM_TOOLS = [
  {
    id: 'kb_search',
    name: 'kb_search',
    label: 'Knowledge Base Search',
    description: 'Searches internal customer documentation, warranty guidelines, and FAQ articles.',
    incompatibleRealtime: false
  },
  {
    id: 'crm_lookup_policy',
    name: 'crm_lookup_policy',
    label: 'CRM Policy & Claims Lookup',
    description: 'Fetches active policy details, deductible status, and recent claim submissions.',
    incompatibleRealtime: false
  },
  {
    id: 'calendar_scheduler',
    name: 'calendar_scheduler',
    label: 'Calendar Booking & Appointments',
    description: 'Schedules follow-up calls or inspection visits directly on Google/Outlook calendars.',
    incompatibleRealtime: true // Warning: Not on Realtime voice compatibility
  },
  {
    id: 'order_status_check',
    name: 'order_status_check',
    label: 'Order Tracking & Shipment Status',
    description: 'Queries logistics ERP for live shipment tracking, transit milestones, and delivery estimates.',
    incompatibleRealtime: false
  },
  {
    id: 'send_sms_notification',
    name: 'send_sms_notification',
    label: 'SMS Dispatcher',
    description: 'Dispatches one-time verification links or claim summary links via Twilio SMS.',
    incompatibleRealtime: true // Warning: Not on Realtime voice compatibility
  }
];

const GLOBAL_ENTITIES = [
  { id: 'customer_id', label: 'customer_id (Account ID)' },
  { id: 'policy_number', label: 'policy_number (Policy Reference)' },
  { id: 'claim_id', label: 'claim_id (Claim Number)' },
  { id: 'email_address', label: 'email_address (Verified Email)' },
  { id: 'phone_number', label: 'phone_number (Phone Number)' },
  { id: 'order_id', label: 'order_id (Purchase Order)' }
];

const DEFAULT_AGENT_CONFIG = {
  // Section A - Channels
  channels: {
    voice: true,
    email: false,
    chat: false
  },
  speechStack: 'cascaded', // 'cascaded' | 'realtime'

  // Section B - Details
  name: '',
  language: 'English (US)',
  description: '',
  welcomeMessage: '',
  instructions: '',

  // Prompt configuration
  guidelinesVoice: '',
  guidelinesText: '',
  guidelinesTransfer: '',
  guidelinesExpectedOutput: '',

  // Tools configuration
  toolCallCustomMessages: false,
  toolDefaultMessage: '',
  assignedTools: [], // Default: None per assignment
  boundEntities: [], // Default: Not preselected per assignment
  tags: [], // Default: Empty optional per assignment

  // Model Settings - Shared
  sharedModel: {
    model: 'azure/gpt-4.1-mini/eu',
    responseModality: 'Audio',
    toolCallLimit: 5,
    temperature: 0.5,
    dateTimeEnabled: false,
    dateTimePrecision: 'Minute',
    dateTimeTimezone: 'Europe/Zurich (Team default)',
    historySummaryEnabled: true,
    historyResponses: 10,
    triggerTokens: 8000,
    targetTokens: 5000
  },

  // Model Settings - Voice Override
  voiceModelOverride: {
    enabled: false,
    speechStack: 'cascaded',
    modelCascaded: 'azure/gpt-4.1-mini/eu',
    modelRealtime: 'azure/gpt-realtime-2.1/global',
    responseModality: 'Audio',
    toolCallLimit: 'Inherited',
    reasoning: 'Minimal',
    temperature: 'Inherited',
    voice: 'Aria – calm, mid-pitch',
    turnDetection: 'Server VAD · 0.6 s',
    historyOverride: {
      enabled: true,
      historyResponses: 5,
      triggerTokens: 15000,
      targetTokens: 10000
    }
  },

  // Model Settings - Email Override
  emailModelOverride: {
    enabled: false,
    model: 'azure/gpt-4.1/eu',
    responseModality: 'Text', // read-only
    toolCallLimit: 'Inherited',
    temperature: 'Inherited',
    historyOverride: {
      enabled: true,
      historyResponses: 5
    }
  },

  // Voice Settings
  voiceSettings: {
    transcription: {
      externalTranscription: false,
      sttProfile: "Use agent's default STT profile",
      allowedLanguages: 'en, hi'
    },
    speech: {
      activeTab: 'stt',
      silenceTimeout: 400,
      stt: {
        provider: 'Team default service',
        languages: ['en-US', 'de-DE'],
        replyInDetectedLanguage: false,
        segmentationSilenceTimeout: 500,
        customModelId: '',
        sttModel: 'Provider default',
        profanityFilter: 'Masked'
      },
      tts: {
        provider: 'Azure',
        voice: 'en-US-JennyNeural',
        azure: {
          voice: 'en-US-JennyNeural',
          speed: 1.1,
          pitch: 'default',
          volume: 'default',
          style: 'neutral',
          styleDegree: 1.0
        },
        elevenLabs: {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          model: 'eleven_flash_v2_5',
          stability: 0.5,
          similarity: 0.75,
          styleExaggeration: 0,
          speakerBoost: true
        },
        azureSpeed: 1.1,
        azurePitch: 'Default',
        azureVolume: 'Default',
        azureStyle: 'Neutral',
        azureStyleDegree: 1.0,
        elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
        elevenLabsModel: 'eleven_flash_v2_5',
        elevenLabsStability: 0.5,
        elevenLabsSimilarity: 0.75,
        elevenLabsStyleExaggeration: 0,
        elevenLabsSpeakerBoost: true
      }
    },
    language: {
      control: false,
      primaryLanguage: 'English (US)',
      supportedLanguages: ['English (US)', 'German']
    },
    bargeIn: {
      agentResponses: true,
      platformMessages: false
    },
    dtmf: {
      enabled: false,
      bargeIn: true,
      interDigitTimeout: 3000,
      maxDigits: 10,
      terminator: '#'
    },
    inactivity: {
      enabled: false,
      initialWaitTime: 5000,
      retryInterval: 8000,
      inactivityRetries: 2,
      retryPromptMode: 'Agent generated',
      inactivityAction: 'Hang up',
      inactivityPrompt: 'Are you still there?'
    },
    noiseCancellation: {
      enabled: false,
      provider: 'FFmpeg',
      model: 'Default'
    },
    recording: {
      enabled: false
    },
    security: {
      piiRedaction: true,
      rateLimit: 30,
      dataRetentionDays: 30,
      allowedDomains: ['app.acme.com', 'support.acme.com']
    }
  },

  // Email Settings
  emailSettings: {
    inbox: {
      mailboxes: [], // Connect mailbox
      threadWindowDays: 14
    },
    threading: {
      replyTo: 'Sender only',
      quoteOriginal: true,
      sendAs: 'On behalf of a named person',
      personName: 'Support Agent',
      personAddress: 'support.rep@acme.enterprisebot.ai',
      replyToAddress: '',
      defaultCC: [],
      appendSignature: true,
      signatureType: 'Team signature',
      agentSignatureText: 'Best regards,\nCustomer Support AI Team\nAcme Enterprise'
    },
    replies: {
      sendMode: 'Draft for review',
      whenMissing: 'Ask the sender for what is missing'
    },
    triage: {
      answerScope: 'Every message in the folder',
      senderDomains: [],
      subjectContains: '',
      neverAnswerCategories: [] // Coming soon
    },
    escalation: {
      enabled: false,
      escalateWhen: 'The sender asks for a person',
      forwardTo: 'Support · Tier 1',
      forwardMailbox: '',
      genesysQueue: '',
      tellSender: true
    },
    attachments: {
      readInbound: true,
      pagesRead: 20,
      splitFiles: false,
      unclearSplitAction: 'Treat as one document',
      passwordProtectedAction: 'Ask the sender for an unlocked copy',
      fileSkippedAction: 'Tell the sender which file was skipped',
      storeReceivedFiles: false
    },
    security: {
      scanInjectedInstructions: true,
      onInjectedHitAction: 'Strip the injected lines and carry on',
      refuseRevealSetup: true,
      maskPersonalData: true,
      keepInClear: 'Extracted values',
      keepThreadsMonths: '12 months'
    },
    extraction: { // Coming Soon
      enabled: false,
      lookIn: ['Subject', 'Body', 'Attachments'],
      valuesToFind: [],
      missingAction: 'Ask to confirm',
      recordSource: true
    },
    loopProtection: { // Coming Soon
      ignoreAutomatedMail: true,
      repliesPerHourCap: 5,
      whenCapHit: 'Pause and flag the thread'
    },
    deliveryFailures: { // Coming Soon
      retryFailedSend: true,
      attempts: 3,
      afterLastAttempt: 'Flag for review',
      notifyTarget: 'Workspace admins'
    }
  },

  // Meta
  status: 'Draft', // 'Draft' | 'Published' | 'Unsaved changes'
  versionName: '',
  versionId: '',
  publishedAt: null,
  updatedAt: new Date().toISOString()
};

// Seed realistic agents for demonstration
const INITIAL_AGENTS = [
  {
    ...DEFAULT_AGENT_CONFIG,
    id: 'agent_customer_support',
    name: 'Customer Support Agent',
    description: 'Handles customer queries through phone calls and email with intelligent policy lookups and automated claim tracking.',
    channels: { voice: true, email: true, chat: false },
    speechStack: 'cascaded',
    language: 'English (US)',
    welcomeMessage: 'Thank you for calling Acme Support. My name is Alex, your virtual assistant. How can I assist you with your policy or claims today?',
    instructions: 'You are an enterprise AI customer support agent for Acme Insurance. You handle customer inquiries with empathy, professionalism, and concise answers. Always verify claim reference numbers and summarize next steps clearly.',
    guidelinesVoice: 'Keep spoken answers under 2 sentences when possible. Speak at an even tempo and confirm critical IDs by reading digit by digit.',
    guidelinesText: 'Format email responses with bullet points for required documents. Include standard greeting and team signature.',
    guidelinesTransfer: 'Hand off call to a senior human specialist if the caller expresses frustration or if their claim has been denied.',
    guidelinesExpectedOutput: 'Every turn should confirm the user intent, invoke the appropriate lookup tool, and provide an actionable update.',
    assignedTools: ['kb_search', 'crm_lookup_policy'],
    boundEntities: ['customer_id', 'claim_id', 'policy_number'],
    tags: ['customer-support', 'tier-1', 'claims-triage'],
    emailSettings: {
      ...DEFAULT_AGENT_CONFIG.emailSettings,
      inbox: {
        mailboxes: [
          { id: 'mb_1', name: 'Acme Support Desk', address: 'support@acme.enterprisebot.ai', status: 'Active' }
        ],
        threadWindowDays: 14
      }
    },
    status: 'Published',
    versionName: 'v1.4.0 - Winter Claims Release',
    versionId: 'ver_eb_9b42e7a1',
    publishedAt: '2026-10-28T14:30:00Z',
    updatedAt: '2026-10-28T14:30:00Z'
  },
  {
    ...DEFAULT_AGENT_CONFIG,
    id: 'agent_sales_assistant',
    name: 'Sales Assistant',
    description: 'Qualifies inbound enterprise sales leads and schedules discovery calls with regional account executives.',
    channels: { voice: true, email: false, chat: false },
    speechStack: 'realtime',
    voiceModelOverride: {
      ...DEFAULT_AGENT_CONFIG.voiceModelOverride,
      speechStack: 'realtime'
    },
    language: 'English (US)',
    welcomeMessage: 'Hi there! Thanks for calling Acme Solutions. Are you interested in enterprise automation or scheduling a demo with our product team?',
    instructions: 'You are a friendly and proactive sales qualification agent. Ask about company size, primary use case, and schedule meetings.',
    assignedTools: ['kb_search', 'calendar_scheduler'],
    status: 'Draft',
    updatedAt: '2026-10-29T10:15:00Z'
  },
  {
    ...DEFAULT_AGENT_CONFIG,
    id: 'agent_insurance_support',
    name: 'Insurance Support Agent',
    description: 'Assists policyholders with claims filing, deductible questions, and emergency roadside assistance.',
    channels: { voice: true, email: true, chat: false },
    speechStack: 'cascaded',
    language: 'English (US)',
    welcomeMessage: 'Welcome to Acme Insurance Support. Please have your policy number ready.',
    instructions: 'Assist policyholders in lodging new claims and looking up policy coverage limits.',
    assignedTools: ['crm_lookup_policy'],
    emailSettings: {
      ...DEFAULT_AGENT_CONFIG.emailSettings,
      inbox: {
        mailboxes: [
          { id: 'mb_2', name: 'Claims Inbound Queue', address: 'claims@acme.enterprisebot.ai', status: 'Active' }
        ],
        threadWindowDays: 30
      }
    },
    status: 'Unsaved changes',
    updatedAt: '2026-10-30T16:45:00Z'
  }
];

window.ENTERPRISE_DATA = {
  LANGUAGES,
  SHARED_MODELS,
  REALTIME_MODELS,
  CASCADED_MODELS,
  REALTIME_VOICES,
  TURN_DETECTIONS,
  REASONING_LEVELS,
  TIMEZONES,
  STT_PROVIDERS,
  TTS_PROVIDERS,
  STT_MODELS_BY_PROVIDER,
  TEAM_TOOLS,
  GLOBAL_ENTITIES,
  DEFAULT_AGENT_CONFIG,
  INITIAL_AGENTS,
  getEffectiveSpeechStack
};

window.getEffectiveSpeechStack = getEffectiveSpeechStack;
