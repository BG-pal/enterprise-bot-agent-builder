# Enterprise Bot — AI Agent Builder

A complete, interactive, enterprise-grade SaaS web application prototype for **Enterprise Bot**.

This application enables enterprise customer operations teams to create, configure, test, and publish autonomous AI agents that communicate with customers across **Voice** and **Email** channels.

---

## 🚀 Quick Start (Local Development Only)

This application runs **100% locally on your laptop** with **zero external server dependencies**.

### Option 1: One-Click Startup (Recommended)
1. Navigate to the project directory:
   ```
   C:\Users\Pallavi BG\.gemini\antigravity\scratch\enterprise-bot-agent-builder
   ```
2. Double-click **`start.bat`**.
3. It will launch the local development server on **`http://localhost:5173/`** and automatically open it in your browser.

### Option 2: PowerShell Local Server
Open PowerShell in the project directory and run:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```
Then navigate to: **[http://localhost:5173/](http://localhost:5173/)**

### Option 3: Direct Browser Launch
You can also open the prototype directly without any web server:
- Open your browser (Edge, Chrome, Brave, etc.) and navigate to:
  `file:///C:/Users/Pallavi BG/.gemini/antigravity/scratch/enterprise-bot-agent-builder/index.html`

---

## 🎨 Design System & Specifications

- **Primary Viewport:** 1440 × 900 px (Desktop-first).
- **Responsive Layout:** Optimized and fully functional around 900 px width with collapsible sidebars and responsive form stacking.
- **Primary Accent:** `#3870E9`
- **Application Background:** `#F7F8FA`
- **Cards & Panels:** `#FFFFFF`
- **Primary Text:** `#202124`
- **Secondary Text:** `#656B75`
- **Muted Text:** `#858B96`
- **Borders:** `#E5E7EB`
- **Status Colors:**
  - Success: `#10B981` (Published badge)
  - Warning: `#F59E0B` (Unsaved changes badge)
  - Error: `#EF4444` (Validation alerts)
  - Disabled: `#9CA3AF` (Coming Soon)
- **Primary Typeface:** **Lato** (Google Fonts loaded with system fallbacks).
- **Icons:** **Lucide Icons** implemented as scalable, crisp SVGs.
- **Spacing:** Strict 8px grid system (`8px`, `16px`, `24px`, `32px`, `40px`).
- **Input Heights:** 40px consistent input & button heights.

---

## 🧭 End-to-End User Journey

```
STEP 1: Agents Dashboard
   ↓
STEP 2: Create Agent (with 6 Evaluation Test States)
   ↓
STEP 3: Agent Configuration Shell & Overview
   ↓
STEP 4: Configure Prompt, Tools, Model Settings & Channel Settings
   ↓
STEP 5: Try It (Voice Call Simulator & Email Thread Simulator)
   ↓
STEP 6: Review & Update Configuration (Unsaved Changes Dirty Tracking)
   ↓
STEP 7: Publish (Version Naming & Auto-Generated Version ID)
   ↓
STEP 8: Published Agent (Persistent LocalStorage State)
```

---

## 🖥️ Screen-by-Screen Breakdown

### Screen 01: Agents Dashboard
- **Page Heading:** "Agents", Subtitle: "Create and manage your AI agents."
- **Primary Action:** Prominent **`Create Agent`** button.
- **Search & Filters:** Real-time search by name/keyword and status tabs (`All`, `Published`, `Draft`, `Unsaved changes`).
- **Rich Table View:** Displays Agent Name, Description, Channel Badges (Voice, Email), Status Badge, Last Updated timestamp, and Actions (`Configure`, `Try It`, `Delete`).
- **Preloaded Sample Data:**
  - `Customer Support Agent` (Published, Voice + Email, Cascaded, GPT-4.1-mini)
  - `Sales Assistant` (Draft, Voice only, Realtime Voice)
  - `Insurance Support Agent` (Unsaved changes, Voice + Email, Cascaded)

### Screen 02: Create Agent & Required Test States
- **Section A — Channel Selection:**
  - **Voice:** Default ON, answers phone calls.
  - **Speech Stack (visible only when Voice is ON):**
    - *Cascaded:* Default selected. Separate STT and TTS around text model.
    - *Realtime Voice:* Single speech-to-speech model for lowest latency.
  - **Email:** Default OFF, replies from a mailbox. Both Voice and Email can be selected together.
  - **Chat:** Disabled, faded, "Coming Soon" badge, not keyboard-focusable.
- **Section B — Agent Details:**
  - **Name:** Required with asterisk (`*`), inline red error if submitted empty.
  - **Primary Language:** 8 options (`English (US)` default, `English (UK)`, `German`, `French`, `Italian`, `Spanish`, `Portuguese`, `Polish`).
  - **Description, Welcome Message, Instructions:** Optional fields with descriptive helper text.
- **Section C — Actions:**
  - **Cancel:** Discards entered details and returns to Agents dashboard without saving.
  - **Create Agent:** Validates name & channel selection, creates Draft agent, and routes intelligently:
    - *Voice only:* Routes directly to Prompt (`Behaviour → Prompts`).
    - *Email only:* Routes directly to Email Inbox (`Email → Inbox`).
    - *Both channels:* Routes to Configuration Overview.
- **Interactive Assignment States Bar:**
  A top verification bar allows instant 1-click testing of all 6 assignment states:
  - `State 1: Default` (Voice ON, Cascaded, Email OFF, Name empty, Create disabled)
  - `State 2: Realtime Voice` (Voice ON, Realtime Voice selected)
  - `State 3: Email Only` (Voice OFF, Email ON, speech stack hidden)
  - `State 4: Name Error` (Inline red "Required" error & focus)
  - `State 5: Channel Error` (Inline "Select at least one channel to create an agent")
  - `State 6: Chat Unavailable` (Disabled & Coming Soon)

### Screen 03: Configuration Overview & Navigation
- **Persistent Header:** "Back to Agents", editable Agent Name, Status badge (`Draft`, `Published`, `Unsaved changes`, `Publishing…`), Save Changes, Discard Changes, Try It, Publish.
- **Left Navigation:** Dynamic section tabs (`Overview`, `Prompt`, `Tools`, `Model Settings`, `Voice Settings` [if Voice ON], `Email Settings` [if Email ON]).
- **Overview Landing:** Channel summary cards, active model details, tool counts, and direct navigation links.

### Screen 04: Prompt Configuration
- Fields:
  1. Welcome Message (spoken before caller says anything).
  2. Instructions / Prompt (core system prompt).
  3. Guidelines — Voice Response Rules.
  4. Guidelines — Text Response Rules.
  5. Guidelines — Call Transfer (explains handoff triggers).
  6. Guidelines — Expected Output (success criteria for turns).
- **Simulated "Rewrite with AI":** Every field features a dedicated AI Rewrite action that analyzes the current text, renders a suggested rewrite preview box, and gives the user explicit **`Keep`** and **`Discard`** buttons.

### Screen 05: Tools Configuration
- **Tool Call Custom Messages:** Toggle (default OFF). When ON, reveals required "Default Message" textarea.
- **Assigned Tools:** Searchable multi-select from team tool library (`kb_search`, `crm_lookup_policy`, `calendar_scheduler`, `order_status_check`, `send_sms_notification`).
- **Realtime Compatibility Warning:** Incompatible tools display a distinct amber badge: **`Not on Realtime voice compatibility`**.
- **Bound Entities:** Global entity multi-select (`customer_id`, `policy_number`, `claim_id`, `email_address`, `phone_number`, `order_id`).
- **Tags:** Dynamic tag input with chips and removal.

### Screen 06: Model Settings
- **Section A — Shared Model Settings:**
  - Model dropdown (`azure/gpt-4.1-mini/eu` default, Claude Sonnet 4.5, Gemini 2.5 Flash, etc.)
  - Response Modality (`Audio`, `Text`)
  - Tool Call Limit (`5` default)
  - Temperature slider (`0.0` - `1.0`)
  - Date & Time Injection toggle (Precision: Day/Hour/Minute, IANA Timezone)
  - History Summary toggle (10 responses, 8000 trigger tokens, 5000 target tokens)
- **Section B — Voice Model Override:**
  - Toggle: "Override the agent model"
  - Cascaded vs Realtime model selection
  - Realtime voices (`Aria – calm, mid-pitch`, `Nova`, `Onyx`, `Sage`)
  - Turn detection (`Server VAD · 0.6 s` default, Semantic VAD, Push to talk)
  - Reasoning effort (`Minimal`, `Low`, `Medium`, `High`)
  - Voice history override
- **Section C — Email Model Override:**
  - Text-only model selection, read-only Text modality, email history override.

### Screen 07: Voice Settings
Organized into structured accordions:
- **A. Transcription:** External transcription toggle (Alpha), STT profile, allowed languages (`en, hi`).
- **B. Speech (STT & TTS Tabs):**
  - *STT Tab:* Azure, Soniox, Deepgram, Google; language codes; reply in detected language; silence timeouts; custom model ID; profanity filtering.
  - *TTS Tab:* Azure Neural TTS controls (Speed, Pitch, Volume, Style, Degree) vs ElevenLabs parameters (Voice ID, Model, Stability, Similarity).
- **C. Language:** Realtime language control toggle & supported languages.
- **D. Barge-in:** Agent Responses (default ON), Platform Messages (default OFF).
- **E. DTMF:** Telephony keypad tones, inter-digit timeout, max digits, terminator key (`#` or `*`).
- **F. Inactivity:** Wait time, retries, retry prompt modes, inactivity prompts ("Are you still there?"), hangup/transfer actions.
- **G. Noise Cancellation:** FFmpeg, GStreamer, AWS Elemental, Twilio Media Streams.
- **H. Recording:** Compliance dual-channel audio storage toggle.
- **I. Security:** PII redaction (email/phone/card masking), rate limiting, data retention (30 days), allowed webhook domains.

### Screen 08: Email Settings
Organized into structured groups:
- **A. Inbox:** Connect Mailbox CTA modal, connected mailbox table with "Test Connection" ping and "Remove", thread window (14 days).
- **B. Threading:** Reply-to scope, quote original, Send-as ("On behalf of a named person", "The mailbox", "A separate reply-to address"), default CC, signatures.
- **C. Replies:** Send mode (Draft for review vs Send automatically), missing information handling.
- **D. Triage:** Answer scope (folder, domains, subjects), never answer categories (Coming Soon).
- **E. Escalation:** Human handoff triggers, forward queues (Support Tier 1, Billing, Named mailbox, Genesys queue), auto-confirmation note.
- **F. Attachments:** Inbound OCR reading, page limits (20 pages), password-protected handling, file skipping.
- **G. Security:** Prompt injection scanner, setup leak prevention, personal data masking, thread retention.
- **H-J. Coming Soon Sections:** Structured Entity Extraction, Loop Protection, Delivery Failure Handling (visibly disabled and labeled).

### Screen 09: Try It (Testing Workspace)
- **Voice Testing:**
  - Live call timer (`mm:ss`).
  - Mute/unmute microphone button.
  - Show/hide transcript toggle.
  - Live transcript with caller and agent turn bubbles.
  - Per-turn tool execution badges (`[Tool: crm_lookup_policy]`, `[Tool: kb_search]`).
  - End call button triggering post-call summary ("Caller ended the call", call duration, "Call again" button, view logs).
  - Quick caller prompts: "Check my claim status", "Reference CLM-98234", "Transfer to representative".
- **Email Testing:**
  - Read-only From and To addresses.
  - Subject and Body inputs with quick inquiry templates.
  - Send button triggering "Writing a reply using model…" typing state.
  - Agent response card with corporate signature.
  - Collapsible "Tools executed" chips.
  - Collapsible "Extracted entities" table with confidence ratings (`claim_id`, `customer_name`, `intent`).
  - Thread collapsible cards & "New Test Email" button.
- **Chat Testing:** Disabled with "Coming Soon" badge.

### Screen 10: Publish Workflow & Versioning
- **Status Badges:** `Draft`, `Published`, `Unsaved changes`, `Publishing…`.
- **Publish Trigger:** Disabled with tooltip when agent is already published and up to date. Enabled when edits exist.
- **Publish Modal:**
  - Displays Agent Name.
  - Optional Version Name (e.g. `v1.5.0 - Winter claims update`).
  - Explains unique Version ID generation.
  - "Confirm & Publish" triggers simulated publishing progress spinner.
  - Completes to `Published` status.
  - Generates unique copyable Version ID (e.g. `ver_eb_9b42e7a1`).
  - Copy Version ID button with "Copied!" feedback and toast alert.
- **Discard Changes:** Confirmation dialog restoring the last published configuration from snapshot.

---

## 💾 State Persistence (LocalStorage)

All agent configurations, newly created agents, and published versions are persisted directly in your browser's **`localStorage`** under the key `enterprise_bot_agents_v1`. Refreshing the page or closing the browser retains all your changes without data loss.
