import './style.css';
import { Header } from './components/Header.js';
import { ImageStudio } from './components/ImageStudio.js';

// Automatically set up the user's fal.ai API key for all components
const FAL_KEY = "1bedd3ca-1895-4136-b392-49bb7939ad15:f499d1c19e8be1cdd2b33c51060256ec";
localStorage.setItem('platform_api_key', FAL_KEY);
localStorage.setItem('fal_key', FAL_KEY);
window.__FAL_KEY__ = FAL_KEY;
document.cookie = `platform_api_key=${FAL_KEY}; path=/; max-age=31536000; SameSite=Lax`;

const app = document.querySelector('#app');
let contentArea;

// Keep all mounted page nodes so async generation survives tab switches
const mountedPages = {};

// Router — show/hide instead of destroy
function navigate(page) {
  if (!contentArea) return;

  // Hide all existing pages
  Object.values(mountedPages).forEach(node => { node.style.display = 'none'; });

  if (mountedPages[page]) {
    // Already mounted — just show it again
    mountedPages[page].style.display = '';
  } else {
    // First visit — create a wrapper and mount the studio into it
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;';
    contentArea.appendChild(wrapper);
    mountedPages[page] = wrapper;

    if (page === 'image') {
      wrapper.appendChild(ImageStudio());
    } else if (page === 'video') {
      import('./components/VideoStudio.js').then(({ VideoStudio }) => {
        wrapper.appendChild(VideoStudio());
      });
    } else if (page === 'cinema') {
      import('./components/CinemaStudio.js').then(({ CinemaStudio }) => {
        wrapper.appendChild(CinemaStudio());
      });
    } else if (page === 'lipsync') {
      import('./components/LipSyncStudio.js').then(({ LipSyncStudio }) => {
        wrapper.appendChild(LipSyncStudio());
      });
    } else if (page === 'workflows') {
      import('./components/WorkflowStudio.js').then(({ WorkflowStudio }) => {
        wrapper.appendChild(WorkflowStudio());
      });
    } else if (page === 'agents') {
      import('./components/AgentStudio.js').then(({ AgentStudio }) => {
        wrapper.appendChild(AgentStudio());
      });
    } else if (page === 'mcp-cli') {
      import('./components/McpCliStudio.js').then(({ McpCliStudio }) => {
        wrapper.appendChild(McpCliStudio());
      });
    }
  }
}

app.innerHTML = '';
// Pass navigate to Header so links work
app.appendChild(Header(navigate));

contentArea = document.createElement('main');
contentArea.id = 'content-area';
contentArea.className = 'flex-1 relative w-full overflow-hidden flex flex-col bg-app-bg';
app.appendChild(contentArea);

// Initial Route
navigate('image');

// Event Listener for Navigation
window.addEventListener('navigate', (e) => {
  if (e.detail.page === 'settings') {
    import('./components/SettingsModal.js').then(({ SettingsModal }) => {
      document.body.appendChild(SettingsModal());
    });
  } else {
    navigate(e.detail.page);
  }
});
