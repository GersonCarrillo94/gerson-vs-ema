---
name: lesson-content
description: Use this skill when creating or editing lesson content JSON files in src/data/lessons/. Provides the schema, content guidelines, and validation rules. Ensures pedagogical quality and technical correctness.
---

# Skill: Lesson Content Creation

## Cuándo usar este skill

Cada vez que crees o edites un archivo `src/data/lessons/<lang>/sublevel-XX.json`.

## Estructura del archivo

```jsonc
{
  "id": "en-sublevel-01",
  "language": "english",
  "number": 1,
  "level": "basic",
  "title": "El alfabeto y saludos",
  "description": "Aprende las letras y los saludos básicos en inglés.",
  "estimatedMinutes": 15,
  "pointsReward": 100,
  "passingScore": 70,
  "activities": [
    // ... ver tipos abajo
  ]
}
```

### Reglas del archivo

- **`id`**: formato `<lang>-sublevel-<NN>` donde NN tiene 2 dígitos (01-36)
- **`language`**: `"english"` o `"spanish"`
- **`number`**: 1-36, debe coincidir con el sufijo del `id`
- **`level`**: derivado del número
  - 1-12 → `"basic"`
  - 13-24 → `"intermediate"`
  - 25-36 → `"advanced"`
- **`title`** y **`description`**: en el idioma del aprendiz (español si learner aprende inglés, inglés si learner aprende español)
- **`estimatedMinutes`**: 10-25, realista
- **`pointsReward`**: 100/150/200 según level
- **`passingScore`**: 60-80, default 70
- **`activities`**: array, MÍNIMO 1, máximo 5, idealmente 2-3 de tipos VARIADOS

## Tipos de actividad y sus schemas

### `flashcards`
```jsonc
{
  "id": "act-1",
  "type": "flashcards",
  "title": "Letras del alfabeto",
  "items": [
    {
      "id": "flash-1",
      "front": "A",
      "back": "/eɪ/",
      "audioUrl": "/audio/en/letters/a.mp3",  // opcional
      "example": "Apple"                       // opcional
    }
    // Mínimo 5 items
  ]
}
```

### `multiple_choice`
```jsonc
{
  "id": "act-2",
  "type": "multiple_choice",
  "title": "Elige el saludo correcto",
  "items": [
    {
      "id": "q-1",
      "prompt": "¿Cómo se dice 'Hola' en inglés?",
      "options": ["Goodbye", "Hello", "Thanks", "Please"],
      "correctIndex": 1,
      "explanation": "'Hello' es el saludo más común en inglés."
    }
    // Mínimo 5 items
  ]
}
```

Reglas:
- `correctIndex` siempre en rango 0..length-1
- 3-4 opciones por pregunta
- Las opciones incorrectas deben ser PLAUSIBLES (no obvias)
- `explanation` opcional pero recomendado para aprendizaje

### `fill_blank`
```jsonc
{
  "id": "act-3",
  "type": "fill_blank",
  "title": "Completa la frase",
  "items": [
    {
      "id": "fb-1",
      "sentence": "___ morning! How are you?",
      "blanks": [
        {
          "answer": "Good",
          "alternatives": ["good", "GOOD"]  // case variations
        }
      ]
    }
  ]
}
```

Reglas:
- El blank se marca con `___` (3 underscores) en `sentence`
- Puede haber múltiples blanks en una frase
- `alternatives` para tolerar variaciones (mayúsculas, contracciones)

### `translation`
```jsonc
{
  "id": "act-4",
  "type": "translation",
  "title": "Traduce al inglés",
  "items": [
    {
      "id": "tr-1",
      "source": "Buenos días",
      "sourceLanguage": "spanish",
      "targetLanguage": "english",
      "accepted": ["Good morning", "good morning"],
      "hint": "Es la traducción más común"  // opcional
    }
  ]
}
```

### `word_order`
```jsonc
{
  "id": "act-5",
  "type": "word_order",
  "title": "Ordena las palabras",
  "items": [
    {
      "id": "wo-1",
      "words": ["are", "How", "you", "?"],
      "correctOrder": [1, 0, 2, 3],
      "translation": "¿Cómo estás?"
    }
  ]
}
```

### `listening`
```jsonc
{
  "id": "act-6",
  "type": "listening",
  "title": "Escucha y responde",
  "items": [
    {
      "id": "ls-1",
      "audioUrl": "/audio/en/lessons/01-dialogue-1.mp3",
      "transcript": "Hello, my name is John.",  // oculto al usuario, para review
      "questions": [
        {
          "prompt": "What is the person's name?",
          "options": ["Joe", "John", "Jack", "James"],
          "correctIndex": 1
        }
      ]
    }
  ]
}
```

### `dialogue`
```jsonc
{
  "id": "act-7",
  "type": "dialogue",
  "title": "Práctica una conversación",
  "scenario": "Estás en una cafetería pidiendo un café.",
  "exchanges": [
    {
      "speaker": "barista",
      "text": "Good morning, what can I get you?",
      "audioUrl": "/audio/en/dialogues/cafe-01.mp3"
    },
    {
      "speaker": "user",
      "prompt": "Pide un café con leche",
      "expected": ["A coffee with milk, please", "A latte, please"],
      "hint": "Acuérdate de decir 'please'"
    }
  ]
}
```

## Validación

Antes de añadir un archivo nuevo, ejecutar:
```bash
npm run validate-lessons
```

Debe verificar:
- JSON sintácticamente válido
- Estructura conforme al schema Zod
- `id` único globalmente
- `audioUrl` apuntando a archivos existentes en `/public/audio/`
- Sin typos comunes (cspell)

Si el script no existe aún → crearlo siguiendo `.claude/agents/lesson-designer.md`.

## Guía pedagógica

### Dificultad progresiva
- Subnivel N+1 introduce máximo 10 conceptos nuevos respecto a N
- Reutilizar 30-50% del vocabulario de subniveles previos (refuerzo)
- Nunca asumir conocimiento que no se enseñó

### Variedad
- En 1 subnivel, NO repetir el mismo tipo de actividad seguido
- Si tiene 3 actividades, idealmente 3 tipos distintos
- Tipos "pasivos" (flashcards, listening) alternados con "activos" (writing, dialogue)

### Contenido útil
- Frases que el aprendiz USARÁ ("¿Dónde está el baño?")
- NO frases académicas absurdas ("El gato está en la mesa")
- Contexto cultural cuando aplique (saludos formales vs informales)

### Sensibilidad
- Diversidad de nombres (María, Wei, John, Fatima)
- Sin estereotipos
- Sin política, religión, alcohol, drogas, violencia
- Sin chistes que no traduzcan bien

## Audios

- Formato: `.mp3` o `.m4a` (más livianos que `.wav`)
- Velocidad: natural, NO ralentizada artificialmente
- Voces variadas: alternar masculina/femenina
- Bitrate: 128 kbps es suficiente para voz
- Ubicación: `/public/audio/<lang>/<categoria>/<archivo>.mp3`

### Alternativa sin audios grabados
Usar Web Speech API en cliente:
```ts
function speak(text: string, lang: 'en-US' | 'es-ES') {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  speechSynthesis.speak(utterance);
}
```

Gratis pero calidad variable según browser/OS. Para Fase 6 considerar TTS de calidad (ElevenLabs).

## Distribución sugerida por subnivel

| Subnivel | Foco principal | Tipos sugeridos |
|---|---|---|
| 1 | Alfabeto y saludos | flashcards + multiple_choice |
| 2 | Números y colores | flashcards + multiple_choice |
| 3 | Familia y casa | flashcards + fill_blank |
| 4 | Presentación personal | dialogue + writing |
| 5 | Artículos y género | multiple_choice + fill_blank |
| 6 | Verbo ser/to be | fill_blank + translation |
| 7 | Frases cotidianas | flashcards + listening |
| 8 | Presente simple | fill_blank + word_order |
| 9 | Preguntas Wh- | multiple_choice + dialogue |
| 10 | Direcciones | listening + dialogue |
| 11 | Escucha básica | listening + multiple_choice |
| 12 | **Conversación final del nivel** | dialogue + pronunciation |

(Repetir patrón para intermedio 13-24 y avanzado 25-36)

## Plantilla mínima para empezar

```jsonc
{
  "id": "en-sublevel-XX",
  "language": "english",
  "number": XX,
  "level": "basic",
  "title": "TÍTULO EN ESPAÑOL",
  "description": "DESCRIPCIÓN BREVE EN ESPAÑOL",
  "estimatedMinutes": 15,
  "pointsReward": 100,
  "passingScore": 70,
  "activities": [
    {
      "id": "act-1",
      "type": "flashcards",
      "title": "TÍTULO DE LA ACTIVIDAD",
      "items": [
        { "id": "flash-1", "front": "PALABRA", "back": "TRADUCCIÓN", "example": "FRASE" }
      ]
    }
  ]
}
```

## Anti-patrones

- ❌ Reutilizar el `id` de otro subnivel
- ❌ `correctIndex` fuera de rango de `options`
- ❌ Solo 1 actividad y de tipo "flashcards" (aburrido y poco efectivo)
- ❌ Frases sin contexto ("La casa es grande" → ¿para qué?)
- ❌ Vocabulario super avanzado en nivel básico
- ❌ Errores ortográficos / gramaticales en el contenido (es de aprendizaje, debe ser PERFECTO)
- ❌ Más de 20 items en una sola actividad (cansa)
- ❌ Mezclar lenguajes en `title`/`description` (mantener consistencia)
- ❌ Olvidar regenerar tipos si añades un tipo de actividad nuevo
