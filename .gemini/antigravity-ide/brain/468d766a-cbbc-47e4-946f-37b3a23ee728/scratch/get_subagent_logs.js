const fs = require('fs');
const path = require('path');

const transcriptPath = "C:\\Users\\makar\\.gemini\\antigravity-ide\\brain\\468d766a-cbbc-47e4-946f-37b3a23ee728\\.system_generated\\logs\\transcript_full.jsonl";

console.log("Scanning for BROWSER_SUBAGENT steps...");
const content = fs.readFileSync(transcriptPath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'BROWSER_SUBAGENT') {
      console.log(`\n--- BROWSER_SUBAGENT at Line ${i} (Step ${data.step_index}) ---`);
      console.log("Status:", data.status);
      if (data.content) {
        console.log("Content preview (last 3000 chars):", data.content.substring(Math.max(0, data.content.length - 3000)));
      }
    }
  } catch (e) {
    // Ignore
  }
}
