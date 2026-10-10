import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sampleRate = 22050;
const outputDirectory = fileURLToPath(new URL('../src/assets/audio/', import.meta.url));
const twoPi = Math.PI * 2;

function envelope(time, start, duration, attack = 0.008, release = 0.06) {
  const elapsed = time - start;
  if (elapsed < 0 || elapsed > duration) return 0;
  return Math.min(1, elapsed / attack, (duration - elapsed) / release);
}

function tone(time, frequency, wave = 'sine') {
  const phase = twoPi * frequency * time;
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  if (wave === 'square') return Math.sin(phase) >= 0 ? 1 : -1;
  return Math.sin(phase);
}

function writeWav(filename, duration, renderSample) {
  const sampleCount = Math.floor(sampleRate * duration);
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const time = sampleIndex / sampleRate;
    const sample = Math.max(-1, Math.min(1, renderSample(time, sampleIndex)));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + sampleIndex * 2);
  }

  return writeFile(path.join(outputDirectory, filename), buffer);
}

const effects = {
  'tile-click.wav': {
    duration: 0.075,
    render: (time) => {
      const fade = Math.exp(-time * 42);
      const frequency = 920 - time * 3300;
      return tone(time, frequency) * fade * 0.28;
    },
  },
  'match.wav': {
    duration: 0.48,
    render: (time) => {
      const notes = [659.25, 830.61, 987.77];
      return notes.reduce((sum, frequency, index) => {
        const start = index * 0.085;
        const fade = envelope(time, start, 0.36, 0.012, 0.22);
        const elapsed = time - start;
        return sum + (tone(elapsed, frequency) + tone(elapsed, frequency * 2) * 0.16) * fade * 0.19;
      }, 0);
    },
  },
  'wrong.wav': {
    duration: 0.34,
    render: (time) => {
      const first = envelope(time, 0, 0.28, 0.012, 0.18);
      const second = envelope(time, 0.11, 0.22, 0.012, 0.16);
      return tone(time, 280, 'triangle') * first * 0.22 + tone(time, 220, 'triangle') * second * 0.18;
    },
  },
  'hint.wav': {
    duration: 0.42,
    render: (time) => {
      const notes = [523.25, 783.99, 1046.5];
      return notes.reduce((sum, frequency, index) => {
        const start = index * 0.075;
        const fade = envelope(time, start, 0.31, 0.012, 0.2);
        return sum + tone(time - start, frequency) * fade * 0.16;
      }, 0);
    },
  },
  'shuffle.wav': {
    duration: 0.46,
    render: (time, sampleIndex) => {
      const fade = envelope(time, 0, 0.45, 0.025, 0.18);
      const frequency = 240 + 680 * (time / 0.46);
      const noise = Math.sin(sampleIndex * 12.9898) * Math.cos(sampleIndex * 0.067);
      return (tone(time, frequency, 'triangle') * 0.72 + noise * 0.28) * fade * 0.18;
    },
  },
  'clock-tick.wav': {
    duration: 0.085,
    render: (time) => {
      const fade = Math.exp(-time * 58);
      return (tone(time, 1500) * 0.72 + tone(time, 950) * 0.28) * fade * 0.2;
    },
  },
};

function renderBackground(time) {
  const chords = [
    [130.81, 196, 261.63, 329.63],
    [110, 164.81, 220, 261.63],
    [87.31, 130.81, 174.61, 220],
    [98, 146.83, 196, 246.94],
  ];
  const barLength = 2;
  const barIndex = Math.floor(time / barLength);
  const chord = chords[barIndex % chords.length];
  const barTime = time % barLength;
  const edgeFade = Math.min(1, barTime / 0.2, (barLength - barTime) / 0.24);
  const pulse = 0.82 + Math.sin(twoPi * time / 4) * 0.08;
  let sample = 0;

  chord.forEach((frequency, index) => {
    const voice = tone(time, frequency, index < 2 ? 'sine' : 'triangle');
    sample += voice * (index === 0 ? 0.12 : 0.065) * edgeFade * pulse;
  });

  const beatLength = 0.5;
  const beatIndex = Math.floor(time / beatLength);
  const beatTime = time % beatLength;
  const melody = chord[[2, 3, 1, 2][beatIndex % 4]] * 2;
  sample += tone(beatTime, melody) * Math.exp(-beatTime * 5) * 0.12;
  sample += tone(beatTime, melody * 2) * Math.exp(-beatTime * 8) * 0.035;
  return sample * 0.72;
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  Object.entries(effects).map(([filename, effect]) =>
    writeWav(filename, effect.duration, effect.render)
  )
);
await writeWav('bgm.wav', 8, (time) => renderBackground(time));
console.log(`Generated ${Object.keys(effects).length + 1} WAV files in ${outputDirectory}`);