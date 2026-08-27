const http = require('http');

async function testEndpoint(path, input = {}) {
  return new Promise((resolve) => {
    const inputStr = JSON.stringify({ '0': { json: input } });
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `${path}?batch=1&input=${encodeURIComponent(inputStr)}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    http.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: data.substring(0, 800) }));
    }).end();
  });
}

async function runTests() {
  console.log('Testing public endpoints...\n');

  const r1 = await testEndpoint('/trpc/categories.getBySlug', { slug: 'jewellery' });
  console.log('categories.getBySlug:', r1.status, r1.data);

  const r2 = await testEndpoint('/trpc/products.getFeatured', { limit: 5 });
  console.log('products.getFeatured:', r2.status, r2.data);

  const r3 = await testEndpoint('/trpc/products.getBySlug', { slug: 'diamond-tennis-bracelet' });
  console.log('products.getBySlug:', r3.status, r3.data);

  const r4 = await testEndpoint('/trpc/products.getRelated', {
    productId: 'cb6a8b7c-4eb8-4651-aa73-e494b4aec651',
    categoryId: '6ab12561-21ee-4d3d-b729-dcfb342ee9e8',
    limit: 4
  });
  console.log('products.getRelated:', r4.status, r4.data);

  const r5 = await testEndpoint('/trpc/categories.getList');
  console.log('categories.getList:', r5.status, r5.data);

  const r6 = await testEndpoint('/trpc/siteSettings.getPublic');
  console.log('siteSettings.getPublic:', r6.status, r6.data);

  console.log('\nTesting protected endpoints (expect 401)...');

  const r7 = await testEndpoint('/trpc/auth.getMe');
  console.log('auth.getMe (no auth):', r7.status, r7.data);

  const r8 = await testEndpoint('/trpc/enquiries.adminGetList');
  console.log('enquiries.adminGetList (no auth):', r8.status, r8.data);

  const r9 = await testEndpoint('/trpc/siteSettings.adminGetList');
  console.log('siteSettings.adminGetList (no auth):', r9.status, r9.data);

  const r10 = await testEndpoint('/trpc/auth.adminGetUsers');
  console.log('auth.adminGetUsers (no auth):', r10.status, r10.data);
}

runTests().catch(console.error);