/**
 * Quick end-to-end test for Groq vision.
 * Run: node scripts/test-vision.mjs
 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Read env manually (no dotenv needed — just grab the key)
const envContent = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const key = getEnv('GROQ_API_KEY');
const model = getEnv('GROQ_VISION_MODEL') ?? 'qwen/qwen3.6-27b';

// 3×3 solid colour JPEG — minimal valid image Groq accepts
// Generated from a known-good base64 JPEG of a plain peach square
const b64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAADAAMBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABQQG/8QAHxAAAQMFAQEAAAAAAAAAAAAAAQIDBBESISIx/9oACAEBAAA/AL0GjWm5vVJl0TRFA3MWpKAR7ItXO3lBqL//2Q==';

const body = JSON.stringify({
  model,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'You are Derma, a dermatology AI assistant. Describe what you see in this image in one sentence.' },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }
    ]
  }],
  max_tokens: 150
});

console.log(`\nTesting Groq vision: ${model}`);
console.log('─'.repeat(50));

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body
});

const data = await res.json();

if (!res.ok || data.error) {
  console.error('❌  FAIL:', data.error?.message ?? `HTTP ${res.status}`);
  process.exit(1);
}

const raw = data.choices?.[0]?.message?.content ?? '';
// Strip Qwen thinking tags (same logic as GroqVisionProvider.ts)
const clean = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || raw;

console.log('✅  PASS');
console.log('Has <think> block:', /<think>/i.test(raw));
console.log('Clean reply      :', clean);
console.log('Tokens           :', `prompt=${data.usage?.prompt_tokens}  completion=${data.usage?.completion_tokens}`);
