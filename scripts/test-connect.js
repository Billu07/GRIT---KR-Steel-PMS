const { Client } = require('pg');

const connectionString = 'postgresql://postgres.kxibnphsyloyrpcdllxb:JFPqgNFNOPgyNALZ@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

console.log("Attempting to connect to:", connectionString.replace(/:[^:]*@/, ':****@'));

const client = new Client({
  connectionString: connectionString,
  connectionTimeoutMillis: 10000, // 10s timeout
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully to port 5432!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Query result:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });
