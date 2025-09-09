export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Log para debugging
console.log('🔑 OpenAI API Key disponible:', !!OPENAI_API_KEY);
console.log('🔑 OpenAI API Key length:', OPENAI_API_KEY?.length);
console.log('🔑 OpenAI API Key starts with sk-:', OPENAI_API_KEY?.startsWith('sk-'));

export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
  maxTokens: 300, // Aumentar tokens para respuestas más completas
  temperature: 0.1, // Reducir temperatura para respuestas más consistentes
};

// Función para validar la API key
const isValidApiKey = (apiKey: string): boolean => {
  return !!(apiKey && apiKey.startsWith('sk-') && apiKey.length > 20);
};

// Función para manejar errores de API
const handleApiError = (error: any, context: string): string => {
  console.error(`${context} Error:`, error);
  
  if (error.message?.includes('401')) {
    return 'API key de OpenAI inválida. Verifica tu configuración.';
  } else if (error.message?.includes('429')) {
    return 'Límite de API alcanzado. Intenta de nuevo en unos minutos.';
  } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  } else {
    return 'Error al procesar el texto. Intenta ser más específico.';
  }
};

// Helper function to get relative date
const getRelativeDate = (days: number, dayOfWeek?: string) => {
  const today = new Date();
  
  if (dayOfWeek) {
    // Calcular el día de la semana anterior
    const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    let targetDay;
    
    switch (dayOfWeek.toLowerCase()) {
      case 'monday': targetDay = 1; break;
      case 'tuesday': targetDay = 2; break;
      case 'wednesday': targetDay = 3; break;
      case 'thursday': targetDay = 4; break;
      case 'friday': targetDay = 5; break;
      case 'saturday': targetDay = 6; break;
      case 'sunday': targetDay = 0; break;
      default: targetDay = currentDay;
    }
    
    // Calcular días hasta el lunes anterior
    let daysToSubtract = currentDay - targetDay;
    if (daysToSubtract <= 0) daysToSubtract += 7; // Si es el mismo día o posterior, ir a la semana anterior
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - daysToSubtract);
    return targetDate.toISOString().split('T')[0];
  }
  
  // Para días relativos (ayer, hace X días)
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + days);
  return targetDate.toISOString().split('T')[0];
};

// Función para procesar texto natural a transacciones
export const parseNaturalLanguageTransaction = async (text: string): Promise<{
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  error?: string;
} | null> => {
  try {
    // Validar API key
    if (!isValidApiKey(OPENAI_API_KEY)) {
      throw new Error('API key de OpenAI no válida');
    }

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    console.log('🤖 Enviando solicitud a OpenAI para transacción:', text);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente financiero especializado en español. Convierte CUALQUIER texto sobre dinero a una transacción estructurada.

INSTRUCCIONES CRÍTICAS:
1. SIEMPRE responde con un JSON válido
2. NO agregues explicaciones, solo el JSON
3. Si el texto menciona dinero, crea una transacción
4. DETECTA LA FECHA mencionada en el texto

FORMATO OBLIGATORIO:
{"type": "income/expense", "amount": NUMERO, "category": "CATEGORIA", "description": "DESCRIPCION", "date": "YYYY-MM-DD", "isRecurring": boolean}

FECHA ACTUAL: ${today} (${todayFormatted})

DETECCIÓN DE FECHAS:
- "ayer gasté 25 euros" → "date": "${getRelativeDate(-1)}"
- "hoy he comprado comida" → "date": "${today}"
- "el lunes pagué 100 euros" → "date": "${getRelativeDate(-1, 'monday')}"
- "el martes recibí mi nómina" → "date": "${getRelativeDate(-1, 'tuesday')}"
- "el miércoles fui al médico" → "date": "${getRelativeDate(-1, 'wednesday')}"
- "el jueves compré ropa" → "date": "${getRelativeDate(-1, 'thursday')}"
- "el viernes cené fuera" → "date": "${getRelativeDate(-1, 'friday')}"
- "el sábado fui al cine" → "date": "${getRelativeDate(-1, 'saturday')}"
- "el domingo compré pan" → "date": "${getRelativeDate(-1, 'sunday')}"
- "hace 3 días gasté 50 euros" → "date": "${getRelativeDate(-3)}"
- "la semana pasada compré libros" → "date": "${getRelativeDate(-7)}"
- "el mes pasado recibí dividendos" → "date": "${getRelativeDate(-30)}"

IMPORTANTE: Si NO se menciona fecha específica, usa la fecha de hoy: "${today}"

EJEMPLOS:
- "ayer gasté 25 euros en comida" → {"type": "expense", "amount": 25, "category": "Comida", "description": "Gasto en comida", "date": "${getRelativeDate(-1)}", "isRecurring": false}
- "hoy me han pagado 100 euros" → {"type": "income", "amount": 100, "category": "Salario", "description": "Pago recibido", "date": "${today}", "isRecurring": false}
- "el lunes compré patatas por 6 euros" → {"type": "expense", "amount": 6, "category": "Comida", "description": "Patatas", "date": "${getRelativeDate(-1, 'monday')}", "isRecurring": false}
- "gasté 30 euros en gasolina" → {"type": "expense", "amount": 30, "category": "Transporte", "description": "Gasolina", "date": "${today}", "isRecurring": false}

CATEGORÍAS: Comida, Transporte, Entretenimiento, Servicios, Salario, Freelance, Otros

NOTA: Si NO se menciona fecha específica, usa la fecha de hoy: "${today}"`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('✅ Respuesta de OpenAI:', content);
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Extraer JSON de la respuesta con mejor regex
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No se encontró JSON en la respuesta:', content);
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validar estructura con valores por defecto
    if (!parsed.type || !parsed.amount) {
      console.error('❌ Estructura inválida:', parsed);
      throw new Error('Invalid transaction structure - missing type or amount');
    }

    const result = {
      type: parsed.type,
      amount: parseFloat(parsed.amount),
      category: parsed.category || 'Otros',
      description: parsed.description || text,
      date: parsed.date || new Date().toISOString().split('T')[0], // Usar fecha de la IA o fecha actual
      isRecurring: parsed.isRecurring || false,
      recurringInterval: parsed.recurringInterval,
    };

    console.log('🎉 Transacción procesada correctamente:', result);
    return result;

  } catch (error) {
    const errorMessage = handleApiError(error, 'Transaction Parsing');
    console.error('❌ Error completo:', error);
    return { 
      type: 'expense' as const, 
      amount: 0, 
      category: 'Error', 
      description: text, 
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      error: errorMessage 
    };
  }
};

// Función para procesar texto natural a transacciones de activos
export const parseNaturalLanguageAssetTransaction = async (text: string): Promise<{
  assetName: string;
  assetType: 'crypto' | 'equity' | 'bond' | 'commodity' | 'fund' | 'forex' | 'real_estate';
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'transfer';
  amount: number;
  quantity?: number;
  price?: number;
  currency: string;
  date: string;
  notes: string;
  error?: string;
} | null> => {
  try {
    // Validar API key
    if (!isValidApiKey(OPENAI_API_KEY)) {
      throw new Error('API key de OpenAI no válida');
    }

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const todayFormatted = new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    console.log('🚀 Enviando solicitud a OpenAI para activo:', text);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `Eres un experto en finanzas que analiza operaciones de activos en español. SIEMPRE responde SOLO con JSON válido.

FORMATO OBLIGATORIO - NO añadas explicaciones:
{"assetName": "NOMBRE", "assetType": "TIPO", "type": "OPERACION", "amount": NUMERO, "currency": "MONEDA", "date": "YYYY-MM-DD", "notes": "DESCRIPCION"}

FECHA ACTUAL: ${today} (${todayFormatted})

DETECCIÓN DE FECHAS:
- "ayer compré acciones" → "date": "${getRelativeDate(-1)}"
- "hoy he vendido Bitcoin" → "date": "${today}"
- "el lunes recibí dividendos" → "date": "${getRelativeDate(-1, 'monday')}"
- "hace 3 días invertí en Tesla" → "date": "${getRelativeDate(-3)}"
- "la semana pasada compré Ethereum" → "date": "${getRelativeDate(-7)}"

IMPORTANTE: Si NO se menciona fecha específica, usa la fecha de hoy: "${today}"

TIPOS DE ACTIVOS (assetType):
- "crypto": Bitcoin, BTC, Ethereum, ETH, Dogecoin, DOGE, criptomonedas
- "equity": Apple, Tesla, Microsoft, Google, Amazon, Telefónica, Santander, acciones

TIPOS DE OPERACIONES (type):
- "buy": comprar, comprado, he comprado, inversión
- "sell": vender, vendido, he vendido
- "dividend": dividendos, dividendo, distribución
- "fee": comisión, comisiones, tasas

EJEMPLOS EXACTOS:
- "ayer compré 10 acciones de Apple a 150 dólares cada una" → {"assetName": "Apple", "assetType": "equity", "type": "buy", "amount": 1500, "quantity": 10, "price": 150, "currency": "USD", "date": "${getRelativeDate(-1)}", "notes": "Compra de 10 acciones de Apple"}
- "hoy he comprado Bitcoin por 1000 euros" → {"assetName": "Bitcoin", "assetType": "crypto", "type": "buy", "amount": 1000, "currency": "EUR", "date": "${today}", "notes": "Compra de Bitcoin"}
- "el lunes recibí dividendos de Telefónica por 25 euros" → {"assetName": "Telefónica", "assetType": "equity", "type": "dividend", "amount": 25, "currency": "EUR", "date": "${getRelativeDate(-1, 'monday')}", "notes": "Dividendos de Telefónica"}
- "compré acciones de Tesla por 500 euros" → {"assetName": "Tesla", "assetType": "equity", "type": "buy", "amount": 500, "currency": "EUR", "date": "${today}", "notes": "Compra de acciones de Tesla"}

NOTA: Si NO se menciona fecha específica, usa la fecha de hoy: "${today}"`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: OPENAI_CONFIG.maxTokens,
        temperature: OPENAI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error (Activos):', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    console.log('✅ Respuesta de OpenAI (Activos):', content);
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Extraer JSON de la respuesta con mejor regex
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No se encontró JSON en la respuesta de activos:', content);
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validar estructura con valores por defecto
    if (!parsed.assetName || !parsed.assetType || !parsed.type || !parsed.amount) {
      console.error('❌ Estructura de activo inválida:', parsed);
      throw new Error('Invalid asset transaction structure - missing required fields');
    }

    const result = {
      assetName: parsed.assetName,
      assetType: parsed.assetType,
      type: parsed.type,
      amount: parseFloat(parsed.amount),
      quantity: parsed.quantity ? parseFloat(parsed.quantity) : undefined,
      price: parsed.price ? parseFloat(parsed.price) : undefined,
      currency: parsed.currency || 'EUR',
      date: parsed.date || new Date().toISOString().split('T')[0], // Usar fecha de la IA o fecha actual
      notes: parsed.notes || text,
    };

    console.log('🎉 Transacción de activo procesada correctamente:', result);
    return result;

  } catch (error) {
    const errorMessage = handleApiError(error, 'Asset Transaction Parsing');
    console.error('❌ Error completo en activos:', error);
    return {
      assetName: 'Error',
      assetType: 'equity' as const,
      type: 'buy' as const,
      amount: 0,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      notes: text,
      error: errorMessage
    };
  }
}; 