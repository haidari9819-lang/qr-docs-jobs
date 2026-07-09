module.exports = {
  apps: [
    {
      name: 'sync-server',
      script: 'sync_server.py',
      interpreter: 'python3',
      cwd: __dirname,
      args: '--port 8090',
      env: {
        SYNC_SERVER_KEY: '0xR65PXpb0e7PUGuUMLViF8cDJmq54vn-GyxpYyebeQ',
      },
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/sync-server-error.log',
      out_file: './logs/sync-server-out.log',
      merge_logs: true,
    },
  ],
}
