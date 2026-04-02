async function main() {
  const baseURL = 'http://localhost:3000/api';
  
  // 1. Login
  console.log('Logging in...');
  let res = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'parent12@test.com', password: 'password123' })
  });
  const loginData = await res.json();
  const token = loginData.token;

  // 2. Get children
  console.log('Fetching children...');
  res = await fetch(`${baseURL}/children`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const children = await res.json();
  console.log(`Found ${children.length} children:`, children.map((c:any) => c.name));

  const today = new Date().toISOString().split('T')[0];

  // 3. For each child, get executions
  for (const child of children) {
    console.log(`\nFetching executions for child ${child.id} (${child.name}) on date ${today}...`);
    res = await fetch(`${baseURL}/executions?childId=${child.id}&date=${today}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const execs = await res.json();
    console.log(`Returned ${execs.length} executions.`);
    const completed = execs.filter((e:any) => e.status === 'completed');
    console.log(`-> Completed count: ${completed.length}`);
    
    for (const e of execs) {
      console.log(`   - [${e.status}] ${e.assignment.task.name}`);
    }
  }
}

main().catch(console.error);
