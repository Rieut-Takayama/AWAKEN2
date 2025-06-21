#!/bin/bash
cd /Users/rieut/Desktop/AWAKEN2/backend
npm run build
PORT=8080 node dist/app.js