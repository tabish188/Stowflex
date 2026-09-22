#!/usr/bin/env node
// Regenerates assets/css/style.min.css from assets/css/style.css.
// style.css stays the hand-edited source of truth; run this after editing it,
// then re-upload style.min.css to Hostinger.
//   node minify-css.js
'use strict';

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'assets/css/style.css');
const outPath = path.join(__dirname, 'assets/css/style.min.css');

let css = fs.readFileSync(srcPath, 'utf8');
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
css = css.replace(/\s+/g, ' ');
css = css.replace(/\s*\{\s*/g, '{');
css = css.replace(/\s*\}\s*/g, '}');
css = css.replace(/\s*;\s*/g, ';');
css = css.replace(/\s*,\s*/g, ',');
css = css.replace(/:\s+/g, ':');
css = css.replace(/;\}/g, '}');
css = css.trim();

fs.writeFileSync(outPath, css);
console.log('CSS minified: ' + css.length + ' bytes -> assets/css/style.min.css');
