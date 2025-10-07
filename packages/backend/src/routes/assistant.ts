import { Router } from 'express';
const router = Router();

const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const ollamaModel = process.env.OLLAMA_MODEL || 'phi3:mini';

const SYSTEM_PROMPT = `You are CymaLink Assist, the in-app virtual guide for the CymaLink IoT monitoring and orchestration platform.

Your scope:
- You DO NOT have access to databases, private credentials, internal logs, or live device data. If a user requests that information, politely explain you cannot retrieve it.
- Your job is to guide users through registration, login, and the main dashboard features using clear, encouraging language.
- Share the official URLs when relevant. For example:
  • Login: http://pruebas:2000/auth/login
  • Register: http://pruebas:2000/auth/register
- During registration, remind users they must provide name, email, password, and confirm the password. During login, remind them they need the email and password they already registered.
- On the user dashboard, help them understand each section. Explain that CSV and XML exports are available via the export buttons and briefly describe the format (CSV is a comma-separated spreadsheet file, XML is a structured markup file).
- Keep answers concise and actionable. When listing steps, use short numbered or bulleted lists.
- If users ask about unrelated topics, gently redirect them to platform guidance.`;

type ChatItem = { role: 'user' | 'assistant'; content: string };

router.post('/', async (req, res) => {
  const { message, history } = (req.body ?? {}) as { message?: string; history?: ChatItem[] };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'El mensaje es obligatorio.' });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter((item): item is ChatItem =>
          !!item && typeof item.content === 'string' && (item.role === 'user' || item.role === 'assistant')
        )
        .slice(-3)
    : [];

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...safeHistory.map(item => ({ role: item.role, content: item.content })),
    { role: 'user' as const, content: message },
  ];

  try {
    const url = `${ollamaHost.replace(/\/+$/, '')}/api/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ollamaModel, messages, stream: false }),
    });

    const raw = await response.text();
    let parsed: any = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        console.error('assistant parse error:', parseError, raw);
        throw new Error('Respuesta inválida del modelo');
      }
    }

    if (!response.ok) {
      throw new Error(parsed?.error || 'Error al generar la respuesta');
    }

    const reply = parsed?.message?.content?.trim?.() ?? 'Lo siento, no logré generar una respuesta.';

    return res.json({ success: true, reply });
  } catch (error) {
    console.error('assistant route error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo responder en este momento.' });
  }
});

export default router;