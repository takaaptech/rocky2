#!/usr/bin/env node
var spawn = require('child_process').spawn;

spawn('npm', ['run', 'start:web'], { stdio: 'inherit' });
spawn('npm', ['run', 'start:game'], { stdio: 'inherit' });
