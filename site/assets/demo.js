import {sprites, playlist, pairs} from './data.js';
(() => {
  function readSiteState() {
    try { return JSON.parse(localStorage.getItem('tonal-island.preferences')); }
    catch { return null; }
  }
  function writeSiteState(value) {
    try { localStorage.setItem('tonal-island.preferences', JSON.stringify(value)); }
    catch { /* The demo also works when browser storage is unavailable. */ }
  }
(() => {
  const root = document.getElementById('tonal-site-v2');
  if (!root) return;
  const dyads = pairs.map(([fromMidi,toMidi]) => {
    const semitones = Math.abs(toMidi-fromMidi), interval = sprites.intervals[semitones];
    return {id:`m${fromMidi}-m${toMidi}`,fromMidi,toMidi,fromNote:sprites.notes[fromMidi].name,toNote:sprites.notes[toMidi].name,semitones,interval:interval.label,
      assets:{expanded:sprites.bases.expanded,islandCompact:sprites.bases.island,menuCompact:sprites.bases.menu,status:interval.status}};
  });
  let trackIndex = 0;
  let melody = playlist[0];
  // Design-only JavaScript counterpart of TonalIsland/IslandTransition.swift.
function sampleIslandTransition(transition, now) {
  const elapsed = Math.max((now - transition.startTime) / 1000, 0);
  if (transition.duration <= 0 || elapsed >= transition.duration) {
    return {progress: transition.target, velocity: 0, contentOpacity: transition.target, isComplete: true};
  }
  const displacement = transition.initialProgress - transition.target;
  const frequency = transition.target === 0 ? 13.9 : 20;
  const coefficient = transition.initialVelocity + frequency * displacement;
  const decay = Math.exp(-frequency * elapsed);
  const value = transition.target + (displacement + coefficient * elapsed) * decay;
  const velocity = (transition.initialVelocity - frequency * coefficient * elapsed) * decay;
  const progress = Math.min(Math.max(value, 0), 1);
  const initialOpacity = transition.initialContentOpacity;
  const opacity = transition.target === 0
    ? initialOpacity * Math.pow(Math.max(progress, 0) / Math.max(transition.initialProgress, 0.0001), 1.6)
    : initialOpacity + (1 - initialOpacity) * ((progress - transition.initialProgress) / Math.max(1 - transition.initialProgress, 0.0001));
  return {progress, velocity: value === progress ? velocity : 0, contentOpacity: Math.min(Math.max(opacity, 0), 1), isComplete: false};
}

// Same concave attachment corners and lower radii as IslandSurfaceShape.
function islandSurfacePath(width, height, progress, scale) {
  const wing = Math.min((10 + 5 * progress) * scale, height / 2);
  const radius = Math.min((12 + 12 * progress) * scale, (width - wing * 2) / 2, height / 2);
  const curve = 0.55228475;
  const left = wing;
  const right = width - wing;
  return `M 0 0 L ${width} 0 C ${width-wing*curve} 0 ${right} ${wing*(1-curve)} ${right} ${wing} L ${right} ${height-radius} C ${right} ${height-radius*(1-curve)} ${right-radius*(1-curve)} ${height} ${right-radius} ${height} L ${left+radius} ${height} C ${left+radius*(1-curve)} ${height} ${left} ${height-radius*(1-curve)} ${left} ${height-radius} L ${left} ${wing} C ${left} ${wing*(1-curve)} ${wing*curve} 0 0 0 Z`;
}


  const demo = root.querySelector('.ti-demo');
  const stage = root.querySelector('.ti-stage');
  const surface = root.querySelector('.ti-native');
  const content = root.querySelector('.ti-native-content');
  const backdrop = root.querySelector('.ti-native-backdrop');
  const expandedImage = root.querySelector('.ti-expanded-image');
  const compactImage = root.querySelector('.ti-compact-image');
  const status = root.querySelector('.ti-menu-interval');
  const statusImage = status.querySelector('img');
  const trigger = root.querySelector('.ti-island-trigger');
  const notch = root.querySelector('.ti-notch');
  const tabs = [...root.querySelectorAll('.ti-mode')];
  const panel = root.querySelector('#ti-demo-panel');
  const piano = root.querySelector('.ti-piano-roll');
  const keysElement = root.querySelector('.ti-roll-keys');
  const grid = root.querySelector('.ti-roll-grid');
  const notesElement = root.querySelector('.ti-roll-notes');
  const playhead = root.querySelector('.ti-playhead');
  const playbackButton = root.querySelector('.ti-playback-toggle');
  const soundButton = root.querySelector('.ti-sound-toggle');
  const audioNotice = root.querySelector('.ti-audio-notice');
  const playbackNotes = root.querySelector('.ti-playback-notes');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let duration = melody.sampleCount / melody.sampleRate * 1000;
  const keys = new Map();
  const bars = [];
  let mode = 'island';
  let expanded = false;
  let progress = 0;
  let velocity = 0;
  let contentOpacity = 0;
  let transition = null;
  let motionFrame = 0;
  let hoverTimer = 0;
  let currentDyad = -1;
  let position = 0;
  let playing = false;
  let playbackFrame = 0;
  let transportStart = 0;
  let transportBase = 0;
  let userPaused = false;
  let manualPointer = false;
  let manualKeyboard = false;
  let manualPinned = false;
  let manualOpened = false;
  let activeSignature = '';
  let assetsReady = false;
  let demoVisible = false;
  let soundEnabled = false;
  let audioContext = null;
  let audioBuffer = null;
  let audioSource = null;
  let audioGain = null;
  let analyser = null;
  let audioSamples = null;
  let audioActive = false;
  let audioEpoch = 0;
  let lastAudioMeter = 0;
  let lastRestoredMode = '';
  let stateRevision = 0;

    const bufferCache = new Map();
  const waveCache = new Map();
  const previousButton = root.querySelector('.ti-track-previous');
  const nextButton = root.querySelector('.ti-track-next');
  const trackTitle = root.querySelector('.ti-track-title');
  const trackComposer = root.querySelector('.ti-track-composer');
  const trackCounter = root.querySelector('.ti-track-counter');
  const trackSource = root.querySelector('.ti-track-source');
  const expandedValues = root.querySelector('.ti-expanded-values');
  const compactValues = root.querySelector('.ti-compact-values');
  const fromValue = root.querySelector('.ti-native-from');
  const toValue = root.querySelector('.ti-native-to');
  const intervalValue = root.querySelector('.ti-native-interval');
  const footerValue = root.querySelector('.ti-native-footer');
  const compactValue = root.querySelector('.ti-native-compact-title');
  let keyboardLow = 60;
  let keyboardHigh = 84;

  function positionGlyph(element, frame, width = frame.width) {
    element.style.left = frame.x / 680 * 100 + '%';
    element.style.top = frame.y / 208 * 100 + '%';
    element.style.width = width / 680 * 100 + '%';
  }
  function positionValues() {
    positionGlyph(fromValue, sprites.geometry.noteFrom);
    positionGlyph(toValue, sprites.geometry.noteTo);
    positionGlyph(intervalValue, sprites.geometry.interval);
    positionGlyph(footerValue, sprites.geometry.footer, 80);
    positionGlyph(compactValue, mode === 'island' ? sprites.geometry.compactIsland : sprites.geometry.compactMenu);
  }

  function showTrack() {
    trackTitle.textContent = melody.title;
    trackComposer.textContent = melody.composer;
    trackCounter.textContent = `${trackIndex + 1} / ${playlist.length}`;
    trackSource.href = melody.source;
    trackSource.setAttribute('aria-label', `Public domain score: ${melody.title}, Mutopia Project`);
    root.dataset.melodyId = melody.id;
    root.dataset.melody = melody.title;
    root.querySelector('.ti-midi-demo').style.setProperty('--ti-roll-columns', melody.gridColumns);
  }

  function makeAudioBuffer(track) {
    if (bufferCache.has(track.id)) return bufferCache.get(track.id);
    const rate = 22050;
    const buffer = audioContext.createBuffer(1, track.sampleCount, rate);
    const samples = buffer.getChannelData(0);
    for (const note of track.notes) {
      const frequency = 440 * Math.pow(2, (note.midi - 69) / 12);
      let table = waveCache.get(note.midi);
      if (!table) {
        table = new Float32Array(2048);
        for (let index = 0; index < table.length; index++) {
          const phase = index / table.length * Math.PI * 2;
          let pulse = 0, triangle = 0;
          for (let harmonic = 1; harmonic < 16 && frequency * harmonic < rate * .42; harmonic += 2) {
            const value = Math.sin(phase * harmonic);
            pulse += value / harmonic;
            triangle += Math.pow(-1, (harmonic - 1) / 2) * value / (harmonic * harmonic);
          }
          table[index] = .40 * pulse * 4 / Math.PI + .25 * triangle * 8 / (Math.PI * Math.PI);
        }
        waveCache.set(note.midi, table);
      }
      const first = Math.round(note.start / 1000 * rate);
      const last = Math.min(samples.length, Math.round(note.end / 1000 * rate));
      const length = (last - first) / rate;
      const velocityGain = .72 + .28 * note.velocity / 100;
      let phase = 0;
      for (let index = first; index < last; index++) {
        const time = (index - first) / rate;
        const envelope = Math.max(0, Math.min(time / .006, (length - time) / .03, 1)) * (.7 + .3 * Math.exp(-time * 14));
        const point = phase % table.length;
        const lower = Math.floor(point), blend = point - lower;
        const value = table[lower] * (1 - blend) + table[(lower + 1) % table.length] * blend;
        samples[index] += value * envelope * velocityGain;
        phase += frequency / rate * table.length;
      }
    }
    bufferCache.set(track.id, buffer);
    return buffer;
  }

  function buildPiano() {
    keys.clear(); bars.length = 0;
    keysElement.replaceChildren(); notesElement.replaceChildren();
    grid.querySelectorAll('.ti-roll-lane').forEach(lane => lane.remove());
    keyboardLow = Math.floor(Math.min(...melody.notes.map(n => n.midi)) / 12) * 12;
    keyboardHigh = Math.ceil(Math.max(...melody.notes.map(n => n.midi)) / 12) * 12;
    if (keyboardHigh === keyboardLow) keyboardHigh += 12;
    const rows = keyboardHigh - keyboardLow + 1;
    piano.style.height = '200px';
    const isBlack = midi => [1,3,6,8,10].includes(midi % 12);
    const whites = [];
    for (let midi = keyboardHigh; midi >= keyboardLow; midi--) if (!isBlack(midi)) whites.push(midi);
    const center = midi => (keyboardHigh - midi + .5) / rows * 100;
    whites.forEach((midi, index) => {
      const key = document.createElement('div');
      key.className = 'ti-roll-key'; key.dataset.midi = String(midi);
      const top = index === 0 ? 0 : (center(whites[index - 1]) + center(midi)) / 2;
      const bottom = index === whites.length - 1 ? 100 : (center(midi) + center(whites[index + 1])) / 2;
      key.style.top = top + '%'; key.style.height = bottom - top + '%';
      if (midi % 12 === 0) {
        const label = document.createElement('span');
        label.textContent = `C${midi / 12 - 1}`;
        label.style.top = (center(midi) - top) / (bottom - top) * 100 + '%';
        key.append(label);
      }
      keysElement.append(key); keys.set(midi, key);
    });
    for (let midi = keyboardHigh; midi >= keyboardLow; midi--) {
      const lane = document.createElement('div');
      lane.className = 'ti-roll-lane' + (isBlack(midi) ? ' is-black' : '');
      lane.style.top = (keyboardHigh - midi) / rows * 100 + '%'; lane.style.height = 100 / rows + '%';
      grid.insertBefore(lane, notesElement);
      if (isBlack(midi)) {
        const key = document.createElement('div');
        key.className = 'ti-roll-key is-black'; key.dataset.midi = String(midi);
        key.style.top = (keyboardHigh - midi) / rows * 100 + '%'; key.style.height = 100 / rows + '%';
        keysElement.append(key); keys.set(midi, key);
      }
    }
    melody.notes.forEach(event => {
      const bar = document.createElement('div');
      bar.className = 'ti-roll-note'; bar.dataset.midi = String(event.midi);
      bar.style.left = event.start / duration * 100 + '%';
      bar.style.width = (event.end - event.start) / duration * 100 + '%';
      bar.style.top = (keyboardHigh - event.midi + .16) / rows * 100 + '%';
      bar.style.height = .68 / rows * 100 + '%';
      notesElement.append(bar); bars.push({...event, element:bar});
    });
  }

  function switchTrack(index, persist = true) {
    const next = (index + playlist.length) % playlist.length;
    if (next === trackIndex) return;
    const resume = playing;
    pausePlayback(false);
    trackIndex = next; melody = playlist[next];
    duration = melody.sampleCount / melody.sampleRate * 1000;
    position = transportBase = 0;
    activeSignature = ''; currentDyad = -1;
    root.dataset.pressed = '';
    audioBuffer = soundEnabled && audioContext ? makeAudioBuffer(melody) : null;
    showTrack(); buildPiano(); renderPlayback(0);
    if (resume) startPlayback(false);
    if (persist) save();
  }

  previousButton.addEventListener('click', () => switchTrack(trackIndex - 1));
  nextButton.addEventListener('click', () => switchTrack(trackIndex + 1));


  function absoluteTime() {
    if (!playing) return position;
    if (audioActive) return transportBase + (audioContext.currentTime - audioEpoch) * 1000;
    return transportBase + performance.now() - transportStart;
  }

  function phaseAt(time) { return ((time % duration) + duration) % duration; }
  function isManual() { return manualPointer || manualKeyboard || manualPinned; }
  function automaticOpen(phase) {
    const part = phase / duration;
    return (part >= .05 && part < .43) || (part >= .56 && part < .84);
  }
  function updateControlMode() {
    root.dataset.control = isManual() ? 'manual' : 'automatic';
    if (!isManual()) setOpen(automaticOpen(phaseAt(absoluteTime())), false, false);
  }

  function save() {
    const dyad = dyads[Math.max(currentDyad, 0)];
    writeSiteState({modelContent:{
      mode:mode === 'island' ? 'Dynamic Island' : 'Menu bar', expanded,
      notes:[dyad.fromNote,dyad.toNote], interval:dyad.interval,
      playing, sound:soundEnabled, melody:melody.title, melodyId:melody.id, composer:melody.composer
    },privateContent:{revision:++stateRevision}});
  }

  function labels() {
    stage.dataset.mode = mode;
    stage.dataset.open = String(expanded);
    stage.dataset.visible = String(progress > 0 || expanded);
    status.hidden = mode !== 'menu';
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)));
    panel.setAttribute('aria-labelledby', 'ti-mode-' + mode);
    [trigger,status].forEach(button => button.setAttribute('aria-expanded', String(expanded)));
    trigger.setAttribute('aria-label', expanded ? 'Close Tonal Island' : 'Open Tonal Island');
    status.setAttribute('aria-label', `${expanded ? 'Close' : 'Open'} Tonal Island in the menu bar`);
  }

  function renderSurface() {
    const nativeWidth = Math.min(680, stage.clientWidth - 16);
    const scale = nativeWidth / 680;
    const menu = mode === 'menu';
    const width = menu ? nativeWidth : (429 + (680 - 429) * progress) * scale;
    const height = (menu ? 208 * progress : 32 + 176 * progress) * scale;
    surface.style.width = width + 'px';
    surface.style.height = height + 'px';
    trigger.style.width = (mode === 'island' && progress === 0 ? 185 * scale : width) + 'px';
    trigger.style.height = height + 'px';
    surface.style.right = trigger.style.right = menu ? '0px' : '';
    content.style.clipPath = menu
      ? `inset(0 round 0 0 0 ${24 * scale}px)`
      : `path('${islandSurfacePath(width, height, progress, scale)}')`;
    backdrop.style.opacity = menu ? '1' : String(progress);
    expandedImage.style.opacity = expandedValues.style.opacity = String(contentOpacity);
    const reveal = Math.min(Math.max((progress - 0.02) / 0.26, 0), 1);
    const compactOpacity = menu ? 0 : 1 - reveal * reveal * (3 - 2 * reveal);
    compactImage.style.opacity = compactValues.style.opacity = String(compactOpacity);
    compactImage.style.filter = compactValues.style.filter = `blur(${(1 - compactOpacity) * 3 * scale}px)`;
    positionValues();
    stage.dataset.visible = String(progress > 0 || expanded);
  }

  function updateGeometry() {
    const nativeWidth = Math.min(680, stage.clientWidth - 16);
    const scale = nativeWidth / 680;
    stage.style.setProperty('--ti-native-width', nativeWidth + 'px');
    for (const [name, points] of Object.entries({height:32,font:12,line:16,gap:16,padding:16})) {
      stage.style.setProperty('--ti-menu-' + name, points * scale + 'px');
    }
    stage.style.setProperty('--ti-apple-font', 17 * scale + 'px');
    renderSurface();
  }

  function updateMotion(now) {
    if (!transition) return;
    const sample = sampleIslandTransition(transition, now);
    progress = sample.progress;
    velocity = sample.velocity;
    contentOpacity = sample.contentOpacity;
    renderSurface();
    if (sample.isComplete) {
      transition = null;
      motionFrame = 0;
      labels();
    } else motionFrame = requestAnimationFrame(updateMotion);
  }

  function setOpen(next, immediate = false, persist = true) {
    if (!immediate && expanded === next && (transition || progress === (next ? 1 : 0))) return;
    const now = performance.now();
    if (transition) {
      const sample = sampleIslandTransition(transition, now);
      progress = sample.progress;
      velocity = sample.velocity;
      contentOpacity = sample.contentOpacity;
    }
    cancelAnimationFrame(motionFrame);
    motionFrame = 0;
    expanded = next;
    if (immediate || reduced.matches) {
      transition = null;
      progress = next ? 1 : 0;
      velocity = 0;
      contentOpacity = progress;
      renderSurface();
    } else {
      transition = {initialProgress:progress,initialVelocity:velocity,initialContentOpacity:contentOpacity,target:next ? 1 : 0,startTime:now,duration:next ? 0.6 : 0.7};
      motionFrame = requestAnimationFrame(updateMotion);
    }
    labels();
    if (persist) save();
  }

  function applyDyad(index) {
    const dyad = dyads[index];
    currentDyad = index;
    expandedImage.src = dyad.assets.expanded;
    compactImage.src = mode === 'menu' ? dyad.assets.menuCompact : dyad.assets.islandCompact;
    statusImage.src = dyad.assets.status;
    statusImage.alt = dyad.interval;
    fromValue.src = sprites.notes[dyad.fromMidi].asset;
    toValue.src = sprites.notes[dyad.toMidi].asset;
    intervalValue.src = sprites.intervals[dyad.semitones].expanded;
    footerValue.src = sprites.intervals[dyad.semitones].footer;
    compactValue.src = sprites.intervals[dyad.semitones].compact;
    const summary = `${dyad.fromNote} to ${dyad.toNote}, ${dyad.interval}, ${dyad.semitones} ${dyad.semitones === 1 ? 'semitone' : 'semitones'}`;
    surface.setAttribute('aria-label', 'Tonal Island: ' + summary);
    stage.setAttribute('aria-label', 'MacBook display, ' + summary);
    playbackNotes.textContent = `${dyad.fromNote} → ${dyad.toNote}`;
    piano.setAttribute('aria-label', `Melody excerpt: ${melody.title}. Current reading: ${summary}.`);
    root.dataset.dyad = dyad.id;
    renderSurface();
  }

  function setMode(next, persist = true) {
    if (mode === next) return;
    clearTimeout(hoverTimer);
    mode = next;
    labels();
    applyDyad(Math.max(currentDyad, 0));
    if (persist) save();
  }

  function playbackLabels() {
    playbackButton.textContent = playing ? 'Pause' : 'Play';
    playbackButton.setAttribute('aria-label', playing ? 'Pause the demo' : 'Play the demo');
    soundButton.textContent = soundEnabled ? 'Sound on' : 'Sound off';
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? 'Turn sound off' : 'Turn sound on');
    root.dataset.playing = String(playing);
    root.dataset.audioState = soundEnabled && audioContext ? audioContext.state : 'off';
  }

  function renderPlayback(time) {
    const phase = phaseAt(time);
    let noteIndex = melody.notes.length - 1;
    for (let index = 0; index < melody.notes.length; index++) {
      if (melody.notes[index].start + 45 <= phase) noteIndex = index;
      else break;
    }
    const event = melody.notes[noteIndex];
    if (event.pairIndex !== currentDyad) applyDyad(event.pairIndex);
    const active = new Set();
    bars.forEach(bar => {
      const pressed = phase >= bar.start && phase < bar.end;
      bar.element.classList.toggle('is-active', pressed);
      bar.element.classList.toggle('is-past', phase >= bar.end);
      if (pressed) active.add(bar.midi);
    });
    const signature = [...active].sort().join(',');
    if (signature !== activeSignature) {
      keys.forEach((key,midi) => key.classList.toggle('is-active', active.has(midi)));
      root.dataset.pressed = signature;
      activeSignature = signature;
    }
    playhead.style.left = phase / duration * 100 + '%';
    root.dataset.playbackTime = String(Math.round(phase));
    root.dataset.loop = String(Math.floor(time / duration));
    root.dataset.clock = audioActive ? 'audio' : 'visual';
    if (!isManual()) setOpen(automaticOpen(phase), false, false);
    if (audioActive && performance.now() - lastAudioMeter > 160) {
      analyser.getFloatTimeDomainData(audioSamples);
      root.dataset.audioRms = String(Math.sqrt(audioSamples.reduce((sum,value) => sum + value*value,0) / audioSamples.length).toFixed(4));
      lastAudioMeter = performance.now();
    }
  }

  function playbackTick() {
    if (!playing) return;
    renderPlayback(absoluteTime());
    playbackFrame = requestAnimationFrame(playbackTick);
  }

  function stopAudio() {
    if (audioSource) {
      audioSource.stop();
      audioSource.disconnect();
      audioSource = null;
    }
    audioActive = false;
    root.dataset.audioRms = '0';
  }

  function attachAudio() {
    if (!playing || !soundEnabled || !audioBuffer || audioContext.state !== 'running') return;
    const now = absoluteTime();
    stopAudio();
    audioSource = audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.loop = true;
    audioSource.loopStart = 0;
    audioSource.loopEnd = duration / 1000;
    audioSource.connect(audioGain);
    audioEpoch = audioContext.currentTime;
    transportBase = now;
    transportStart = performance.now();
    audioSource.start(audioEpoch, phaseAt(now)/1000);
    audioActive = true;
  }

  function startPlayback(persist = true) {
    if (playing || !assetsReady || document.hidden) return;
    playing = true;
    transportBase = position;
    transportStart = performance.now();
    attachAudio();
    playbackLabels();
    playbackFrame = requestAnimationFrame(playbackTick);
    if (persist) save();
  }

  function pausePlayback(persist = true) {
    if (!playing) return;
    position = absoluteTime();
    playing = false;
    cancelAnimationFrame(playbackFrame);
    playbackFrame = 0;
    stopAudio();
    renderPlayback(position);
    playbackLabels();
    if (persist) save();
  }

  async function toggleSound() {
    if (soundEnabled) {
      const now = absoluteTime();
      stopAudio();
      transportBase = now;
      transportStart = performance.now();
      soundEnabled = false;
      playbackLabels();
      save();
      return;
    }
    soundEnabled = true;
    soundButton.disabled = true;
    audioNotice.hidden = true;
    try {
      if (!audioContext) {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (!AudioEngine) throw new Error('Audio unavailable');
        audioContext = new AudioEngine();
        audioGain = audioContext.createGain();
        audioGain.gain.value = .28;
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioSamples = new Float32Array(analyser.fftSize);
        audioGain.connect(analyser);
        analyser.connect(audioContext.destination);
        audioContext.addEventListener('statechange', () => {
          if (audioActive && audioContext.state !== 'running') pausePlayback(false);
          playbackLabels();
        });
      }
      // Resume is invoked directly from the click; hover never starts sound.
      const resumed = audioContext.resume();
      if (!audioBuffer) audioBuffer = makeAudioBuffer(melody);
      await resumed;
      attachAudio();
    } catch (_) {
      soundEnabled = false;
      audioNotice.hidden = false;
    } finally {
      soundButton.disabled = false;
      playbackLabels();
      save();
    }
  }

  function inCamera(event) {
    const box = (mode === 'menu' ? status : notch).getBoundingClientRect();
    return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  }
  function queueManualOpen() {
    if (manualOpened || hoverTimer) return;
    hoverTimer = setTimeout(() => {
      hoverTimer = 0;
      if (!manualPointer) return;
      manualOpened = true;
      setOpen(true, false, false);
    }, 150);
  }
  demo.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    manualPointer = true;
    manualOpened = false;
    updateControlMode();
    setOpen(false, false, false);
    if (inCamera(event)) queueManualOpen();
  });
  demo.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hoverTimer = 0;
    manualPointer = false;
    manualOpened = false;
    manualPinned = false;
    updateControlMode();
  });
  [trigger,status].forEach(button => {
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && (manualOpened || inCamera(event))) queueManualOpen();
    });
    button.addEventListener('pointermove', event => {
      if (event.pointerType === 'mouse' && !expanded && inCamera(event)) queueManualOpen();
    });
    button.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        hoverTimer = 0;
        if (!trigger.matches(':hover') && !status.matches(':hover')) {
          manualOpened = false;
          if (isManual()) setOpen(false, false, false);
        }
      }, 150);
    });
    button.addEventListener('click', () => {
      const next = !expanded;
      manualPinned = true;
      manualOpened = next;
      updateControlMode();
      setOpen(next);
    });
  });
  demo.addEventListener('focusin', event => {
    if (!event.target.matches(':focus-visible')) return;
    manualKeyboard = true;
    updateControlMode();
    if (event.target !== trigger && event.target !== status) setOpen(false, false, false);
  });
  demo.addEventListener('focusout', () => setTimeout(() => {
    const focused = document.activeElement;
    manualKeyboard = demo.contains(focused) && focused.matches(':focus-visible');
    if (!demo.contains(focused)) manualPinned = false;
    updateControlMode();
  }, 0));
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' && !demo.contains(event.target)) {
      manualPinned = false;
      manualKeyboard = false;
      updateControlMode();
    }
  });

  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length-1)) % tabs.length];
      next.focus();
      setMode(next.dataset.mode);
    });
  });
  playbackButton.addEventListener('click', async () => {
    userPaused = playing;
    if (playing) pausePlayback();
    else {
      if (soundEnabled && audioContext) await audioContext.resume();
      startPlayback();
    }
  });
  soundButton.addEventListener('click', toggleSound);
  demo.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      clearTimeout(hoverTimer);
      hoverTimer = 0;
      manualPinned = true;
      manualOpened = false;
      updateControlMode();
      setOpen(false);
    }
  });

  function restore(saved) {
    const value = saved && (saved.modelContent || saved);
    if (!value) return;
    const incoming = saved.privateContent && saved.privateContent.revision;
    if (Number.isFinite(incoming)) {
      if (incoming < stateRevision) return;
      stateRevision = incoming;
    }
    const savedTrack = playlist.findIndex(track => track.id === value.melodyId);
    if (savedTrack >= 0 && savedTrack !== trackIndex) switchTrack(savedTrack, false);
    if (!['Dynamic Island','Menu bar'].includes(value.mode) || value.mode === lastRestoredMode) return;
    lastRestoredMode = value.mode;
    setMode(value.mode === 'Menu bar' ? 'menu' : 'island', false);
  }
  function manageAutoplay() {
    if (!assetsReady) return;
    if (!demoVisible || document.hidden) pausePlayback(false);
    else if (!userPaused && !reduced.matches) startPlayback(false);
  }
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(item => item.target === panel);
    if (entry) demoVisible = entry.isIntersecting && entry.intersectionRatio >= .2;
    manageAutoplay();
  }, {threshold:[0,.2]});
  observer.observe(panel);
  document.addEventListener('visibilitychange', manageAutoplay);
  reduced.addEventListener('change', () => {
    if (reduced.matches) { pausePlayback(false); setOpen(expanded, true, false); }
    else manageAutoplay();
  });
  window.addEventListener('pagehide', () => { pausePlayback(false); if (audioContext) audioContext.close(); });

  showTrack();
  buildPiano();
  applyDyad(melody.notes[melody.notes.length - 1].pairIndex);
  labels();
  playbackLabels();
  updateControlMode();
  updateGeometry();
  new ResizeObserver(updateGeometry).observe(stage);
  statusImage.addEventListener('load', renderSurface);
  restore(readSiteState());
  playbackButton.disabled = true;
  const imageAssets = [...Object.values(sprites.bases), ...Object.values(sprites.notes).map(note => note.asset),
    ...Object.values(sprites.intervals).flatMap(interval => [interval.expanded, interval.compact, interval.footer, interval.status])];
  const images = [...new Set(imageAssets)].map(src => {
    const image = new Image(); image.src = src;
    return image.decode();
  });
  Promise.all(images).then(() => {
    assetsReady = true;
    playbackButton.disabled = false;
    manageAutoplay();
  }).catch(() => { playbackButton.textContent = 'Demo unavailable'; });
})();

})();
