const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/database');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const PROMPTS = {
  oil: (c) =>
    `Para un ${c.brand} ${c.model} del año ${c.year} con motor ${c.engine} (${c.fuel}), ¿qué aceite de motor se recomienda? Indica: viscosidad, tipo (sintético/semisintético), especificación API/ACEA y norma del fabricante si aplica. Responde en español, máximo 4 líneas, sin introducción.`,

  brakeFluid: (c) =>
    `Para un ${c.brand} ${c.model} del año ${c.year} con motor ${c.engine}, ¿qué líquido de frenos utiliza? Indica el DOT recomendado y si hay algún requisito especial del fabricante. Responde en español, máximo 3 líneas, sin introducción.`,

  coolant: (c) =>
    `Para un ${c.brand} ${c.model} del año ${c.year} con motor ${c.engine}, ¿qué anticongelante utiliza? Indica color, tipo (G11/G12/G13/OAT) y dilución recomendada. Responde en español, máximo 3 líneas, sin introducción.`,

  brakes: (c) =>
    `Para un ${c.brand} ${c.model} del año ${c.year} con motor ${c.engine}, ¿qué medidas de pastillas y discos de freno lleva (delantero y trasero)? Indica diámetros de disco y grosor de pastilla si es posible. Responde en español, máximo 4 líneas, sin introducción.`,

  mods: (c) =>
    `Tengo un ${c.brand} ${c.model} ${c.year} con motor ${c.engine} y ${c.current_km} km. Quiero modificarlo. Dame una guía práctica por categorías: Rendimiento, Estética, Suspensión y Audio. Para cada una, 2-3 mejoras ordenadas de menor a mayor coste. Responde en español de forma estructurada.`,
};

const askCarAssistant = async (req, res) => {
  const { carId, questionType } = req.body;
  const userId = req.user.id;

  if (!PROMPTS[questionType]) {
    return res.status(400).json({ error: 'Tipo de consulta inválido' });
  }

  try {
    const [cars] = await db.execute(
      'SELECT * FROM cars WHERE id = ? AND user_id = ?',
      [carId, userId]
    );
    if (!cars.length) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: PROMPTS[questionType](cars[0]) }],
    });

    res.json({ answer: message.content[0].text });
  } catch (err) {
    console.error('askCarAssistant error:', err);
    res.status(500).json({ error: 'Error al consultar el asistente' });
  }
};

module.exports = { askCarAssistant };
