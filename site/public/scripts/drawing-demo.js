const ink = getComputedStyle(document.body).getPropertyValue('--draw-ink').trim();
const stateRGB = getComputedStyle(document.body).getPropertyValue('--state-rgb').trim();
const finishRGB = getComputedStyle(document.body).getPropertyValue('--finish-rgb').trim().split(',').map(Number);
const digitCanvas = document.querySelector('#digit-canvas');
const digitContext = digitCanvas.getContext('2d', { willReadFrequently: true });
const completionCanvas = document.querySelector('#completion-canvas');
const completionContext = completionCanvas.getContext('2d');
const smallCanvas = document.createElement('canvas'); smallCanvas.width = smallCanvas.height = 28;
const smallContext = smallCanvas.getContext('2d', { willReadFrequently: true });
const stateGrid = document.querySelector('#encoder-state');
const stateEditor = document.querySelector('#state-editor');
const stateSlider = document.querySelector('#state-slider');
const stateRestore = document.querySelector('#state-restore');
let originalState = null, editedState = null, selectedDimension = 0;
const stateCells = Array.from({ length: 32 }, (_, index) => {
  const cell = document.createElement('button'); cell.className = 'state-cell'; cell.type = 'button';
  cell.disabled = true; cell.setAttribute('aria-pressed', 'false');
  cell.setAttribute('aria-label', `Edit value ${index + 1}`); cell.title = `State ${index + 1}: waiting`;
  cell.addEventListener('click', () => {
    pauseExample(); selectedDimension = index; stateEditor.open = true; syncStateEditor();
  });
  stateGrid.append(cell); return cell;
});
const model = window.digitModel;
const encodedWeights = Uint8Array.from(atob(model.weights), char => char.charCodeAt(0));
const weights = new Float32Array(encodedWeights.buffer);
let weightOffset = 0;
const convolutions = model.conv.map(([inputChannels, outputChannels, kernel, size]) => {
  const count = inputChannels * outputChannels * kernel * kernel;
  const layer = { inputChannels, outputChannels, kernel, size, matrix: weights.subarray(weightOffset, weightOffset + count), bias: weights.subarray(weightOffset + count, weightOffset + count + outputChannels) };
  weightOffset += count + outputChannels; return layer;
});
function readLayers(sizes) {
  return sizes.slice(1).map((outputSize, index) => {
    const inputSize = sizes[index], matrixSize = inputSize * outputSize;
    const layer = { inputSize, outputSize, matrix: weights.subarray(weightOffset, weightOffset + matrixSize), bias: weights.subarray(weightOffset + matrixSize, weightOffset + matrixSize + outputSize) };
    weightOffset += matrixSize + outputSize; return layer;
  });
}
const encoder = readLayers(model.encoder), classifier = readLayers(model.classifier), decoder = readLayers(model.decoder);
function runConvolution(input, layer) {
  const { inputChannels, outputChannels, kernel, size, matrix, bias } = layer;
  const outputSize = size / 2, result = new Float32Array(outputChannels * outputSize * outputSize);
  const padding = Math.floor(kernel / 2);
  for (let channel = 0; channel < outputChannels; channel++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let value = bias[channel];
        for (let source = 0; source < inputChannels; source++) {
          for (let ky = 0; ky < kernel; ky++) {
            const iy = y + ky - padding;
            if (iy < 0 || iy >= size) continue;
            for (let kx = 0; kx < kernel; kx++) {
              const ix = x + kx - padding;
              if (ix < 0 || ix >= size) continue;
              value += input[(source * size + iy) * size + ix] * matrix[((channel * inputChannels + source) * kernel + ky) * kernel + kx];
            }
          }
        }
        const index = (channel * outputSize + Math.floor(y / 2)) * outputSize + Math.floor(x / 2);
        result[index] = Math.max(result[index], value);
      }
    }
  }
  return result;
}
function runLayers(input, layers, lastActivation) {
  let values = input;
  layers.forEach((layer, index) => {
    const next = new Float32Array(layer.outputSize);
    for (let row = 0; row < layer.outputSize; row++) {
      let value = layer.bias[row];
      for (let col = 0; col < layer.inputSize; col++) value += values[col] * layer.matrix[row * layer.inputSize + col];
      next[row] = index < layers.length - 1 || lastActivation === 'relu' ? Math.max(0, value) : lastActivation === 'sigmoid' ? 1 / (1 + Math.exp(-value)) : value;
    }
    values = next;
  });
  return values;
}
function predictDrawing(input) {
  let features = input;
  convolutions.forEach(layer => { features = runConvolution(features, layer); });
  const state = runLayers(features, encoder, 'relu');
  return predictState(state);
}
function predictState(state) {
  const logits = runLayers(state, classifier, 'linear');
  const max = Math.max(...logits), probabilities = Array.from(logits, value => Math.exp((value - max) / model.temperature));
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  const guesses = probabilities.map((value, digit) => ({ digit, score: value / total })).sort((a, b) => b.score - a.score);
  const decoderInput = new Float32Array([...state, ...probabilities.map(value => value / total)]);
  return { state, guesses, completion: runLayers(decoderInput, decoder, 'sigmoid') };
}
function readDrawing() {
  const source = digitContext.getImageData(0, 0, 280, 280).data;
  let left = 280, right = -1, top = 280, bottom = -1;
  for (let y = 0; y < 280; y++) {
    for (let x = 0; x < 280; x++) {
      if (source[(y * 280 + x) * 4 + 3] <= 5) continue;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left || Math.max(right - left, bottom - top) < 18) return null;
  const width = right - left + 1, height = bottom - top + 1, scale = 20 / Math.max(width, height);
  const fitWidth = Math.max(1, Math.round(width * scale)), fitHeight = Math.max(1, Math.round(height * scale));
  smallContext.clearRect(0, 0, 28, 28);
  smallContext.drawImage(digitCanvas, left, top, width, height, Math.floor((28 - fitWidth) / 2), Math.floor((28 - fitHeight) / 2), fitWidth, fitHeight);
  const pixels = smallContext.getImageData(0, 0, 28, 28).data;
  const input = Float32Array.from({ length: 784 }, (_, index) => pixels[index * 4 + 3] / 255);
  let mass = 0, centerX = 0, centerY = 0;
  input.forEach((value, index) => { mass += value; centerX += (index % 28) * value; centerY += Math.floor(index / 28) * value; });
  const dx = Math.round(13.5 - centerX / mass), dy = Math.round(13.5 - centerY / mass);
  const centered = new Float32Array(784);
  input.forEach((value, index) => {
    const x = index % 28 + dx, y = Math.floor(index / 28) + dy;
    if (x >= 0 && x < 28 && y >= 0 && y < 28) centered[y * 28 + x] = value;
  });
  return centered;
}
function showState(state) {
  stateCells.forEach((cell, index) => {
    const value = state[index], intensity = Math.min(1, value / model.stateScale[index]);
    cell.style.backgroundColor = `rgba(${stateRGB},${.08 + intensity * .92})`;
    cell.title = `State ${index + 1}: ${value.toFixed(4)}`;
    cell.disabled = false;
    cell.setAttribute('aria-label', `Edit value ${index + 1}, current value ${value.toFixed(4)}`);
    cell.dataset.value = value.toFixed(4);
    if (document.body.classList.contains("station")) cell.style.height = `${5 + intensity * 35}px`;
  });
  document.querySelector('#encoder-values').textContent = Array.from(state, value => value.toFixed(4)).join(', ');
  const active = state.filter(value => value > .01).length;
  stateGrid.setAttribute('aria-label', `Encoder values: 32 values, ${active} active. Select a square to edit it.`);
  syncStateEditor();
}
function syncStateEditor() {
  const state = editedState || originalState;
  document.querySelector('#state-dimension').textContent = selectedDimension + 1;
  stateSlider.disabled = !state; stateRestore.disabled = !editedState;
  stateSlider.max = Math.max(1, model.stateScale[selectedDimension] * 1.5, (originalState?.[selectedDimension] || 0) * 1.5).toFixed(2);
  stateSlider.value = state ? state[selectedDimension].toFixed(2) : '0';
  document.querySelector('#state-slider-value').textContent = state ? state[selectedDimension].toFixed(2) : '—';
  document.querySelector('#state-status').textContent = !state ? 'Draw a number to explore its values' : editedState ? 'Edited state · your strokes stay the same' : 'Original drawing values';
  stateCells.forEach((cell, index) => cell.setAttribute('aria-pressed', String(!!state && stateEditor.open && index === selectedDimension)));
}
function showCompletion(completion) {
  const image = smallContext.createImageData(28, 28);
  for (let i = 0; i < 784; i++) {
    image.data[i * 4] = finishRGB[0]; image.data[i * 4 + 1] = finishRGB[1]; image.data[i * 4 + 2] = finishRGB[2];
    image.data[i * 4 + 3] = Math.round(Math.min(1, Math.max(0, (completion[i] - .12) / .76)) * 255);
  }
  smallContext.putImageData(image, 0, 0);
  completionContext.clearRect(0, 0, 112, 112);
  completionContext.drawImage(smallCanvas, 0, 0, 112, 112);
}
const scoreLabel = score => score >= .995 ? '>99%' : score < .005 ? '<1%' : `${Math.round(score * 100)}%`;
function updateGuess(announce = false) {
  const input = readDrawing();
  if (!input) return;
  const prediction = predictDrawing(input);
  originalState = prediction.state; editedState = null;
  showPrediction(prediction, announce);
  if (drawing) stateGrid.dataset.liveUpdates = String(++liveUpdateCount);
}
function showPrediction({ state, guesses, completion }, announce = false) {
  const uncertain = guesses[0].score < .7 || guesses[0].score - guesses[1].score < .25;
  document.querySelector('#digit-guess').textContent = uncertain ? '?' : guesses[0].digit;
  document.querySelector('#digit-confidence').textContent = uncertain ? 'Not sure yet' : `${scoreLabel(guesses[0].score)} model score`;
  document.querySelector('.runner-label').textContent = uncertain ? 'Could be' : 'Other guesses';
  document.querySelector('#digit-alternatives').textContent = guesses.slice(uncertain ? 0 : 1, 3).map(guess => `${guess.digit}  ${scoreLabel(guess.score)}`).join('\n');
  document.querySelector('.guess-label').textContent = editedState ? 'EDITED STATE GUESS' : 'MY GUESS';
  document.querySelector('.finish-label').textContent = editedState ? 'Decoded from edits' : uncertain ? 'One possibility' : 'Possible finish';
  completionCanvas.setAttribute('aria-label', editedState ? 'A drawing decoded from your edited encoder values' : 'A predicted finished digit generated from the encoder state');
  completionCanvas.style.opacity = uncertain && !editedState ? '.45' : '1';
  showState(state); showCompletion(completion);
  if (announce) document.querySelector('#digit-announcement').textContent = uncertain ? `The model is unsure. Leading possibilities are ${guesses[0].digit} and ${guesses[1].digit}.` : `The current guess is ${guesses[0].digit}. The encoder state and possible finish have updated.`;
}
let liveUpdateCount = 0, exampleIndex = 0, isExample = false, drawing = false, activePointer = null, queuedFrame = null, exampleFrame = null;
function pauseExample() {
  cancelAnimationFrame(exampleFrame); exampleFrame = null;
}
stateEditor.addEventListener('toggle', () => {
  if (stateEditor.open) pauseExample();
  syncStateEditor();
});
stateSlider.addEventListener('input', () => {
  if (!originalState) return;
  pauseExample();
  if (!editedState) editedState = new Float32Array(originalState);
  editedState[selectedDimension] = Number(stateSlider.value);
  showPrediction(predictState(editedState));
});
stateSlider.addEventListener('change', () => {
  if (editedState) showPrediction(predictState(editedState), true);
});
stateRestore.addEventListener('click', () => {
  if (!originalState) return;
  editedState = null; showPrediction(predictState(originalState), true);
});
function queueInference() {
  if (queuedFrame !== null) return;
  queuedFrame = requestAnimationFrame(() => { queuedFrame = null; updateGuess(); });
}
function clearDrawing() {
  cancelAnimationFrame(queuedFrame); cancelAnimationFrame(exampleFrame); queuedFrame = exampleFrame = null;
  digitContext.clearRect(0, 0, 280, 280); completionContext.clearRect(0, 0, 112, 112);
  isExample = drawing = false; activePointer = null;
  originalState = editedState = null; stateEditor.open = false;
  document.querySelector('.guess-label').textContent = 'MY GUESS';
  document.querySelector('#digit-guess').textContent = '?';
  document.querySelector('#digit-confidence').textContent = 'Waiting for a number';
  document.querySelector('#digit-alternatives').textContent = '—';
  document.querySelector('.runner-label').textContent = 'Other guesses';
  document.querySelector('.finish-label').textContent = 'Possible finish';
  completionCanvas.style.opacity = '1';
  document.querySelector('#drawing-hint').hidden = false;
  completionCanvas.setAttribute('aria-label', 'A predicted finished digit generated from the encoder state');
  document.querySelector('#digit-announcement').textContent = 'Drawing cleared';
  document.querySelector('#encoder-values').textContent = 'Waiting for a drawing';
  liveUpdateCount = 0; stateGrid.dataset.liveUpdates = '0';
  stateGrid.setAttribute('aria-label', 'Encoder state is waiting for a drawing');
  stateCells.forEach((cell, index) => { cell.style.backgroundColor = ''; cell.style.height = ''; cell.dataset.value = ''; cell.disabled = true; cell.title = `State ${index + 1}: waiting`; cell.setAttribute('aria-label', `Edit value ${index + 1}`); });
  syncStateEditor();
}
function showExample() {
  clearDrawing(); isExample = true;
  const example = model.examples[exampleIndex++ % model.examples.length];
  const lengths = example.strokes.map(path => path.slice(1).reduce((sum, point, index) => sum + Math.hypot(point[0] - path[index][0], point[1] - path[index][1]), 0));
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2400;
  let start = null;
  const reveal = time => {
    if (start === null) start = time;
    const fraction = duration === 0 ? 1 : Math.min(1, (time - start) / duration);
    let remaining = totalLength * fraction;
    digitContext.clearRect(0, 0, 280, 280);
    digitContext.strokeStyle = ink; digitContext.lineWidth = 16; digitContext.lineCap = digitContext.lineJoin = 'round';
    for (const path of example.strokes) {
      digitContext.beginPath(); digitContext.moveTo(...path[0]);
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (length <= remaining) { digitContext.lineTo(...b); remaining -= length; }
        else {
          const portion = remaining / length;
          digitContext.lineTo(a[0] + (b[0] - a[0]) * portion, a[1] + (b[1] - a[1]) * portion); remaining = 0; break;
        }
      }
      digitContext.stroke();
      if (remaining <= 0) break;
    }
    updateGuess(fraction === 1);
    exampleFrame = fraction < 1 ? requestAnimationFrame(reveal) : null;
  };
  exampleFrame = requestAnimationFrame(reveal);
}
const drawingPoint = event => {
  const rect = digitCanvas.getBoundingClientRect();
  return [(event.clientX - rect.left) * 280 / rect.width, (event.clientY - rect.top) * 280 / rect.height];
};
digitCanvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drawing) return;
  if (isExample) clearDrawing();
  drawing = true; activePointer = event.pointerId; digitCanvas.setPointerCapture(event.pointerId);
  digitContext.strokeStyle = ink; digitContext.fillStyle = ink; digitContext.lineWidth = 16; digitContext.lineCap = digitContext.lineJoin = 'round';
  const point = drawingPoint(event);
  digitContext.beginPath(); digitContext.arc(...point, 8, 0, Math.PI * 2); digitContext.fill();
  digitContext.beginPath(); digitContext.moveTo(...point);
  document.querySelector('#drawing-hint').hidden = true; stateEditor.open = false; queueInference();
});
digitCanvas.addEventListener('pointermove', event => {
  if (!drawing || event.pointerId !== activePointer) return;
  digitContext.lineTo(...drawingPoint(event)); digitContext.stroke(); queueInference();
});
function finishDrawing(event) {
  if (!drawing || event.pointerId !== activePointer) return;
  drawing = false; activePointer = null;
  cancelAnimationFrame(queuedFrame); queuedFrame = null; updateGuess(true);
}
digitCanvas.addEventListener('pointerup', finishDrawing);
digitCanvas.addEventListener('pointercancel', finishDrawing);
digitCanvas.addEventListener('lostpointercapture', finishDrawing);
document.querySelector('#digit-clear').addEventListener('click', clearDrawing);
document.querySelector('#drawing-hint').addEventListener('click', clearDrawing);
document.querySelector('#digit-example').addEventListener('click', showExample);
// A starter stroke shows the shared encoder and both heads before the first interaction.
digitContext.strokeStyle = ink; digitContext.lineWidth = 16; digitContext.lineCap = digitContext.lineJoin = 'round';
digitContext.beginPath();
[[62,68],[103,64],[147,70],[214,65],[194,111],[172,153],[145,204],[135,227]].forEach((point, index) => index ? digitContext.lineTo(...point) : digitContext.moveTo(...point));
digitContext.stroke(); isExample = true; updateGuess();


document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.open).showModal());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
const projectTabs = [...document.querySelectorAll('[data-project-tab]')];
projectTabs.forEach(button => button.addEventListener('click', () => {
  projectTabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
  document.querySelectorAll('[data-project-panel]').forEach(panel => { panel.hidden = panel.dataset.projectPanel !== button.dataset.projectTab; });
}));
