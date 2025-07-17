import fs from 'fs';
import path from 'path';
import {JSDOM} from 'jsdom';

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Helper to load script.js into the DOM
function loadScript(window) {
  const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = scriptContent;
  window.document.body.appendChild(scriptEl);
}

describe('Playback controls', () => {
  test('playback line element is found', () => {
    const dom = new JSDOM(html, {runScripts: 'dangerously', resources: 'usable'});
    loadScript(dom.window);
    const line = dom.window.document.querySelector('.playbackLine');
    expect(line).not.toBeNull();
  });

  test('togglePlayback does not throw when playback line exists', () => {
    const dom = new JSDOM(html, {runScripts: 'dangerously', resources: 'usable'});
    loadScript(dom.window);
    const {musicEditor} = dom.window;
    expect(() => musicEditor.togglePlayback()).not.toThrow();
  });
});
