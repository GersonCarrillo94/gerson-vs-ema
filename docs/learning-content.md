# 📚 Estructura del contenido educativo

## Distribución global

```
NIVEL BÁSICO (subniveles 1-12)         → 100 pts cada uno
NIVEL INTERMEDIO (subniveles 13-24)    → 150 pts cada uno
NIVEL AVANZADO (subniveles 25-36)      → 200 pts cada uno
```

---

## Tipos de actividad

Cada subnivel se compone de 1-3 actividades de los siguientes tipos:

| Tipo | Código | Descripción |
|---|---|---|
| Flashcards | `flashcards` | Vocabulario con imagen + audio |
| Opción múltiple | `multiple_choice` | Escoger respuesta correcta |
| Completar frase | `fill_blank` | Rellenar el hueco con la palabra correcta |
| Traducción | `translation` | Traducir frase del idioma A al B |
| Ordenar palabras | `word_order` | Arrastrar palabras para formar la frase |
| Escucha | `listening` | Escuchar audio y responder preguntas |
| Pronunciación | `pronunciation` | Grabar voz y comparar |
| Lectura | `reading` | Leer texto + preguntas de comprensión |
| Diálogo | `dialogue` | Mini-conversación guiada |
| Crucigrama | `crossword` | Resolver crucigrama de vocabulario |
| Escritura libre | `writing` | Responder con texto a un prompt |
| Juego de palabras | `word_game` | Ahorcado, scramble, etc |

---

## Formato JSON de un subnivel

Cada subnivel vive en `src/data/lessons/<lang>/sublevel-XX.json`:

```jsonc
{
  "id": "en-sublevel-01",
  "language": "english",
  "number": 1,
  "level": "basic",
  "title": "The alphabet and greetings",
  "description": "Learn the letters and basic greetings in English.",
  "estimatedMinutes": 15,
  "pointsReward": 100,
  "activities": [
    {
      "id": "act-1",
      "type": "flashcards",
      "title": "Alphabet flashcards",
      "items": [
        {
          "id": "flash-1",
          "front": "A",
          "back": "/eɪ/",
          "audioUrl": "/audio/en/letters/a.mp3",
          "example": "Apple"
        }
      ]
    },
    {
      "id": "act-2",
      "type": "multiple_choice",
      "title": "Choose the correct greeting",
      "items": [
        {
          "id": "q-1",
          "prompt": "How do you say 'Hola' in English?",
          "options": ["Goodbye", "Hello", "Thanks", "Please"],
          "correctIndex": 1,
          "explanation": "'Hello' is the most common greeting in English."
        }
      ]
    },
    {
      "id": "act-3",
      "type": "fill_blank",
      "title": "Complete the sentence",
      "items": [
        {
          "id": "fb-1",
          "sentence": "___ morning! How are you?",
          "blanks": [
            {
              "answer": "Good",
              "alternatives": ["good"]
            }
          ]
        }
      ]
    }
  ],
  "passingScore": 70
}
```

### Reglas del formato

- **`id`** debe ser único globalmente, formato `<lang>-sublevel-XX`
- **`activities`** array NO vacío
- **`passingScore`** entre 0-100, default 70
- **`items`** dentro de cada actividad: al menos 5 (excepto crucigrama y diálogo)
- Si la actividad incluye audio, **`audioUrl`** debe ser ruta válida en `/public/audio/`

---

## Distribución de niveles

### 🟦 Nivel Básico (1-12)

| # | Título | Tipos sugeridos |
|---|---|---|
| 1 | El alfabeto y saludos | flashcards, multiple_choice |
| 2 | Números y colores | flashcards, multiple_choice |
| 3 | Vocabulario esencial (familia, casa) | flashcards, fill_blank |
| 4 | Presentación personal | dialogue, writing |
| 5 | Artículos y género gramatical | multiple_choice, fill_blank |
| 6 | Verbos básicos (to be / ser-estar) | fill_blank, translation |
| 7 | Frases del día a día | flashcards, listening |
| 8 | Presente simple | fill_blank, word_order |
| 9 | Preguntas básicas (Wh- / qué quién dónde) | multiple_choice, dialogue |
| 10 | Direcciones y lugares | listening, dialogue |
| 11 | Escucha básica | listening, multiple_choice |
| 12 | Conversación básica | dialogue, pronunciation |

### 🟩 Nivel Intermedio (13-24)

| # | Título | Tipos sugeridos |
|---|---|---|
| 13 | Tiempo pasado simple | fill_blank, word_order |
| 14 | Tiempo futuro | fill_blank, translation |
| 15 | Vocabulario temático (trabajo, viajes) | flashcards, reading |
| 16 | Conectores (sin embargo, además) | fill_blank, writing |
| 17 | Condicionales básicos | translation, fill_blank |
| 18 | Lectura comprensiva | reading, multiple_choice |
| 19 | Escucha nivel intermedio | listening, multiple_choice |
| 20 | Habla nivel intermedio | dialogue, pronunciation |
| 21 | Escritura básica | writing, fill_blank |
| 22 | Diálogo formal | dialogue, multiple_choice |
| 23 | Modismos comunes | flashcards, translation |
| 24 | Mini conversación completa | dialogue, writing |

### 🟨 Nivel Avanzado (25-36)

| # | Título | Tipos sugeridos |
|---|---|---|
| 25 | Subjuntivo y matices | translation, fill_blank |
| 26 | Vocabulario profesional | flashcards, reading |
| 27 | Escritura avanzada | writing, multiple_choice |
| 28 | Lectura avanzada | reading, writing |
| 29 | Escucha de hablantes nativos | listening, multiple_choice |
| 30 | Debate básico | dialogue, writing |
| 31 | Jerga y cultura | flashcards, reading |
| 32 | Redacción formal | writing, multiple_choice |
| 33 | Comprensión auténtica | listening, reading |
| 34 | Conversación fluida | dialogue, pronunciation |
| 35 | Presentación oral | pronunciation, writing |
| 36 | Examen final integral | combinación de todos |

---

## Guía para crear contenido

### Tono
- Conversacional, no académico
- Mostrar contexto cultural cuando aplique
- Evitar palabras vulgares o controversiales

### Dificultad progresiva
- Cada subnivel debe ser ligeramente más difícil que el anterior
- Reutilizar vocabulario de subniveles previos (refuerzo)
- Introducir solo 5-10 conceptos nuevos por subnivel

### Audios
- Si no se graban manualmente, usar Web Speech API en cliente
- Velocidad normal, no lenta artificial
- Voces masculina y femenina alternadas para variedad

### Errores comunes
- Anticipar errores típicos del hispanohablante aprendiendo inglés (y viceversa)
- Ej: confundir "actually" con "actualmente" → incluir explicación

---

## Validación del contenido

Antes de añadir un subnivel nuevo, ejecutar:

```bash
npm run validate-lessons
```

Este script (a crear) debe verificar:
- JSON válido
- `id` único en el dataset completo
- Todos los `audioUrl` referenciados existen en `/public/audio/`
- `items` no vacíos
- `correctIndex` dentro del rango de `options`
- Sin typos comunes (script puede usar un linter de spell-check)
