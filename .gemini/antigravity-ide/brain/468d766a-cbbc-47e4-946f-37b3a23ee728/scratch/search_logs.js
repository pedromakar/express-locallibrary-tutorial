const fs = require('fs');
const path = require('path');
const readline = require('readline');

const transcriptPath = "C:\\Users\\makar\\.gemini\\antigravity-ide\\brain\\468d766a-cbbc-47e4-946f-37b3a23ee728\\.system_generated\\logs\\transcript.jsonl";

console.log("Searching for browser_subagent tool calls in transcript...");

const rl = readline.createInterface({
  input: fs.createReadStream(transcriptPath),
  output: process.stdout,
  terminal: false
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('browser_subagent') || line.includes('admin_dashboard_full_test')) {
    try {
      const data = JSON.parse(line);
      console.log(`Line ${lineNum}: Type: ${data.type}, Status: ${data.status}`);
      if (data.tool_calls) {
        console.log("  Tool calls:", JSON.stringify(data.tool_calls).substring(0, 1000));
      }
      if (data.content) {
        console.log("  Content:", data.content.substring(0, 2000));
      }
    } catch (e) {
      console.log("Failed parsing line " + lineNum + ": " + e.message);
    }
  }
});
