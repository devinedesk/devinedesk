import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';
const RUNS_FILE = path.join(process.cwd(), 'data', 'workflow_runs.json');

async function testAgent() {
  console.log('==========================================');
  console.log('🧪 TEST 1: Local Agent Engine (OpenRouter)');
  console.log('==========================================');
  try {
    console.log("Sending message to agent: 'Say hello in 3 words.'");
    const agentRes = await fetch(`${API_BASE}/agents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'agent_test' }),
    });
    const agent = await agentRes.json();
    const res = await fetch(`${API_BASE}/agents/by-slug/${agent.slug}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Say hello in 3 words.' }),
    });

    const data = await res.json();
    console.log('✅ Agent Response:', data.status);
    return true;
  } catch (e) {
    console.error('❌ Agent Test Failed:', e.message);
    return false;
  }
}

async function testWorkflow() {
  console.log('\n==========================================');
  console.log('🧪 TEST 2: Local DAG Workflow (AIMLAPI)');
  console.log('==========================================');

  let workflowId = null;
  let runId = null;

  try {
    // 1. Create Workflow
    console.log('1. Creating dummy workflow...');
    const createRes = await fetch(`${API_BASE}/workflow/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'End-to-End Test Workflow' }),
    });
    const wf = await createRes.json();
    workflowId = wf.id;
    console.log(`✅ Workflow Created: ${workflowId}`);

    // 2. Publish Nodes (Text Node -> Image Node)
    console.log('2. Publishing DAG Nodes & Edges...');
    const nodes = [
      {
        id: 'text_1',
        type: 'textNode',
        data: { formValues: { prompt: 'A glowing futuristic cyberpunk city skyline at night' } },
      },
      {
        id: 'image_1',
        type: 'imageNode',
        data: { formValues: { model: 'stabilityai/stable-diffusion-xl-base-1.0' } },
      },
    ];
    const edges = [{ source: 'text_1', target: 'image_1', targetHandle: 'textInput' }];

    const pRes = await fetch(`${API_BASE}/workflow/${workflowId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges, viewport: {} }),
    });
    console.log('✅ DAG Topology published:', await pRes.json());

    // 3. Execute Workflow
    console.log('3. Triggering Local DAG Execution...');
    const execRes = await fetch(`${API_BASE}/workflow/${workflowId}/api-execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: {} }),
    });
    const execData = await execRes.json();
    runId = execData.run_id;
    console.log(`✅ Execution Started: ${runId}`);

    // 4. Poll for results
    console.log('4. Polling for DAG outputs (max 60s)...');
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${API_BASE}/workflow/run/${runId}/api-outputs`);
      const run = await pollRes.json();

      if (run.status === 'COMPLETED') {
        console.log('✅ Execution COMPLETED.');
        console.log('Outputs:', JSON.stringify(run.outputs, null, 2));
        return true;
      } else if (run.status === 'FAILED') {
        console.error('❌ Execution FAILED:', run.error);
        return false;
      }
      process.stdout.write('.');
    }
    console.error('\n❌ Polling Timeout');
    return false;
  } catch (e) {
    console.error('❌ Workflow Test Failed:', e.message);
    return false;
  }
}

async function verifyPersistence() {
  console.log('\n==========================================');
  console.log('🧪 TEST 3: Data Persistence Check');
  console.log('==========================================');
  if (fs.existsSync(RUNS_FILE)) {
    const stats = fs.statSync(RUNS_FILE);
    console.log(`✅ workflow_runs.json exists and is ${stats.size} bytes.`);
    return true;
  } else {
    console.error('❌ workflow_runs.json not found locally.');
    return false;
  }
}

async function runAll() {
  console.log('🚀 Starting End-to-End Local Engine Tests\n');
  const agentOk = await testAgent();
  const wfOk = await testWorkflow();
  const dbOk = await verifyPersistence();

  console.log('\n==========================================');
  if (agentOk && wfOk && dbOk) {
    console.log('🎉 ALL TESTS PASSED! The platform is 100% decoupled and running locally.');
  } else {
    console.log('⚠️ SOME TESTS FAILED. Check logs above.');
  }
}

runAll();
