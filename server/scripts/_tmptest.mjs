const key = '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';
const b64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAUABQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD1uiiivgj9ICiiigAooooAKKKKAP/Z';
const model = 'qwen/qwen3.6-27b';
const body = JSON.stringify({
  model,
  messages: [{ role: 'user', content: [
    { type: 'text', text: 'You are Derma. Describe this skin-tone image briefly.' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
  ]}],
  max_tokens: 150
});
fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
  body
}).then(r => r.json()).then(d => {
  if (d.error) { console.error('FAIL:', d.error.message); process.exit(1); }
  const raw = d.choices[0].message.content;
  const clean = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || raw;
  console.log('PASS');
  console.log('Has<think>:', /<think>/.test(raw));
  console.log('Reply:', clean);
  console.log('Tokens: prompt=' + d.usage.prompt_tokens + ' completion=' + d.usage.completion_tokens);
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
