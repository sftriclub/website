const ALLOWED_ORIGIN = 'https://sftriclub.org';
const TO_ADDRESS     = 'phil@sftriclub.org';
const FROM_ADDRESS   = 'website@sftriclub.org';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { name, email, message } = body;

    if (!name || !String(name).trim())           return json({ error: 'name is required' }, 400);
    if (!email || !String(email).trim())          return json({ error: 'email is required' }, 400);
    if (!isValidEmail(String(email).trim()))      return json({ error: 'email is invalid' }, 400);
    if (!message || !String(message).trim())      return json({ error: 'message is required' }, 400);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:     FROM_ADDRESS,
        to:       [TO_ADDRESS],
        subject:  `SF Tri Club Contact: message from ${String(name).trim()}`,
        text:     `Name: ${String(name).trim()}\nEmail: ${String(email).trim()}\n\n${String(message).trim()}`,
        reply_to: String(email).trim(),
      }),
    });

    if (!resendResponse.ok) {
      console.error('Resend error:', await resendResponse.text());
      return json({ error: 'Failed to send message. Please email us directly.' }, 500);
    }

    return json({ success: true });
  },
};
