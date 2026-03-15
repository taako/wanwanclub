const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const req = (path, method = 'GET', data = null) => new Promise((resolve, reject) => {
  const options = {
    hostname: 'localhost',
    port: 3010,
    path,
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  const request = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  });
  request.on('error', reject);
  if (data) request.write(JSON.stringify(data));
  request.end();
});

async function main() {
  console.log("1. Add member");
  console.log(await req('/api/members', 'POST', { id: '001', dogName: 'Pochi' }));
  
  console.log("\n2. Enter");
  console.log(await req('/api/enter', 'POST', { memberId: '001' }));
  
  console.log("\n3. Status (should show 1 active)");
  console.log(await req('/api/status'));

  console.log("\n4. Exit");
  console.log(await req('/api/exit', 'POST', { memberId: '001' }));

  console.log("\n5. Status (should show 0 active)");
  console.log(await req('/api/status'));

  console.log("\n6. Re-Enter");
  console.log(await req('/api/enter', 'POST', { memberId: '001' }));

  console.log("\n7. Simulating 31 minutes passed...");
  const thirtyOneMinsAgo = new Date(Date.now() - 31 * 60 * 1000);
  await prisma.usageSession.updateMany({
    where: { memberId: '001', exitedAt: null },
    data: { enteredAt: thirtyOneMinsAgo }
  });

  console.log("\n8. Status (should show 0 active due to 30 min auto-exit)");
  console.log(await req('/api/status'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
