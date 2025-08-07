#!/usr/bin/env node

// Force webpack-dev-server to bind properly in Docker
process.env.HOST = '0.0.0.0';
process.env.PORT = '3000';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.WDS_SOCKET_HOST = '0.0.0.0';
process.env.WDS_SOCKET_PORT = '0';
process.env.DANGEROUSLY_DISABLE_HOST_CHECK = 'true';

// Start react-scripts
require('react-scripts/scripts/start');