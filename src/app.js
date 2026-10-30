// Root Application Component
// Enterprise Bot AI Agent Builder

(function (global) {
  function App() {
    const state = window.AppState;
    const actions = window.AppActions;
    const renderIcon = window.renderIcon;

    // Toast Container
    const toastsView = state.toasts.length > 0 ? html`
      <div className="toast-container" id="toast-container">
        ${state.toasts.map(t => html`
          <div key=${t.id} className="toast toast-${t.type}">
            ${renderIcon(t.type === 'error' ? 'alert-circle' : t.type === 'info' ? 'info' : 'check-circle-2', { size: 16, color: '#FFFFFF' })}
            <span>${t.message}</span>
          </div>
        `)}
      </div>
    ` : '';

    return html`
      <div className="app-layout">
        <!-- Global Left Sidebar -->
        ${window.Sidebar()}

        <div className="main-wrapper">
          <!-- Top Application Header -->
          ${window.Header()}

          <!-- View Routing Container -->
          ${state.currentView === 'dashboard' ? html`
            <main className="content-area">
              ${window.Dashboard()}
            </main>
          ` : ''}

          ${state.currentView === 'create' ? html`
            <main className="content-area">
              ${window.CreateAgent()}
            </main>
          ` : ''}

          ${state.currentView === 'configure' ? html`
            <div className="agent-config-layout">
              <!-- Persistent Configuration Header -->
              ${window.AgentConfigHeader()}

              <div className="config-body">
                <!-- Left Configuration Navigation -->
                ${window.AgentConfigNav()}

                <!-- Configuration Content Body -->
                <main className="config-main">
                  ${state.configTab === 'overview' ? window.ConfigOverview() : ''}
                  ${state.configTab === 'prompt' ? window.PromptConfig() : ''}
                  ${state.configTab === 'tools' ? window.ToolsConfig() : ''}
                  ${state.configTab === 'model' ? window.ModelSettings() : ''}
                  ${state.configTab === 'voice' ? window.VoiceSettings() : ''}
                </main>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Try It Workspace Modal -->
        ${window.TryItModal()}

        <!-- Publish & Discard Modals -->
        ${window.PublishModal()}

        <!-- Toast Notifications Alert Hub -->
        ${toastsView}
      </div>
    `;
  }

  // Mount application into DOM once window is ready
  function init() {
    const container = document.getElementById('root');
    if (container) {
      window.mount(App, container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.App = App;
})(window);
