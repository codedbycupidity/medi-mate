const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const target = process.env.REACT_APP_PROXY_TARGET || 'http://localhost:3001';
  
  console.log('[SetupProxy] Configuring proxy for /api/* requests');
  console.log(`[SetupProxy] Target: ${target}`);
  
  // Use pattern matching to keep the full path
  app.use(
    '/api/**',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy Request] ${req.method} ${req.url} -> ${target}${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy Response] ${proxyRes.statusCode} for ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
      }
    })
  );
  
  console.log('[SetupProxy] Proxy configured successfully');
};