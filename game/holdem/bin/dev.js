#!/usr/bin/env node
var spawn = require('child_process').spawn;

spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
spawn('npm', ['run', 'bs'], { stdio: 'inherit' });
