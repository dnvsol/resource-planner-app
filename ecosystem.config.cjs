module.exports = {
  apps: [
    {
      name: 'dnvsol-api',
      script: 'apps/api/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'dnvsol-worker',
      script: 'apps/worker/dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
