#!/usr/bin/env node
/**
 * Automated health checks for game assets and production build.
 * - Verifies required audio/image files exist and are non-empty
 * - Optionally checks dist/ bundle size after build
 * Exit code 0 = pass, 1 = fail
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const ASSETS = join(ROOT, 'src', 'assets');
const AUDIO = join(ASSETS, 'audio');
const DIST = join(ROOT, 'dist');

const REQUIRED_AUDIO = [
  'bgm.wav',
  'clock-tick.wav',
  'hint.wav',
  'match.wav',
  'shuffle.wav',
  'tile-click.wav',
  'wrong.wav',
];

const REQUIRED_SVG = [
  'animal-tiles.svg',
  'clock-tiles.svg',
  'country-tiles.svg',
  'face-tiles.svg',
  'food-tiles.svg',
];

/** Max size warnings (bytes). Soft limits — warn only. */
const SOFT_LIMITS = {
  'bgm.wav': 500_000,
  audioOther: 50_000,
  svg: 20_000,
  distJsTotal: 2_500_000, // ~2.5 MB for Phaser + game
};

let failed = false;
const warnings = [];

function fail(msg) {
  console.error(`FAIL  ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`OK    ${msg}`);
}

function warn(msg) {
  console.warn(`WARN  ${msg}`);
  warnings.push(msg);
}

function checkFile(absPath, label, softLimit) {
  if (!existsSync(absPath)) {
    fail(`Missing: ${label}`);
    return;
  }
  const size = statSync(absPath).size;
  if (size === 0) {
    fail(`Empty file: ${label}`);
    return;
  }
  ok(`${label} (${(size / 1024).toFixed(1)} KB)`);
  if (softLimit && size > softLimit) {
    warn(`${label} is large (${(size / 1024).toFixed(1)} KB > limit ${(softLimit / 1024).toFixed(0)} KB)`);
  }
}

console.log('--- Asset health check ---\n');

// Audio
for (const name of REQUIRED_AUDIO) {
  const limit = name === 'bgm.wav' ? SOFT_LIMITS['bgm.wav'] : SOFT_LIMITS.audioOther;
  checkFile(join(AUDIO, name), `audio/${name}`, limit);
}

// SVG tilesheets
for (const name of REQUIRED_SVG) {
  checkFile(join(ASSETS, name), name, SOFT_LIMITS.svg);
}

// Unexpected extra audio (informational)
if (existsSync(AUDIO)) {
  const extras = readdirSync(AUDIO).filter((f) => !REQUIRED_AUDIO.includes(f));
  if (extras.length) {
    warn(`Extra audio files (not in required list): ${extras.join(', ')}`);
  }
}

// Bundle size (if dist exists — run after npm run build)
console.log('\n--- Bundle size check ---\n');
if (!existsSync(DIST)) {
  warn('dist/ not found — skip bundle check (run npm run build first)');
} else {
  let totalJs = 0;
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.js')) {
        const size = statSync(p).size;
        totalJs += size;
        const rel = relative(ROOT, p);
        ok(`${rel} (${(size / 1024).toFixed(1)} KB)`);
      }
    }
  }
  walk(DIST);
  ok(`Total JS in dist: ${(totalJs / 1024).toFixed(1)} KB`);
  if (totalJs > SOFT_LIMITS.distJsTotal) {
    warn(
      `Total JS (${(totalJs / 1024).toFixed(0)} KB) exceeds soft limit (${(SOFT_LIMITS.distJsTotal / 1024).toFixed(0)} KB)`
    );
  }
}

console.log('');
if (warnings.length) {
  console.log(`${warnings.length} warning(s)`);
}
if (failed) {
  console.error('Asset health check FAILED');
  process.exit(1);
}
console.log('Asset health check PASSED');
