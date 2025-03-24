// Configuración de Hugging Face
let HF_TOKEN = ""; // Se llenará desde el servidor
const MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"; // Modelo a utilizar

// Función para obtener el token del servidor
async function getHuggingFaceToken() {
  try {
    // Ruta al endpoint proxy que proporciona el token
    const response = await fetch('/api/token.php', {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.token) {
      HF_TOKEN = data.token;
      console.log("Token obtenido correctamente");
      return true;
    } else {
      throw new Error("No se recibió el token");
    }
  } catch (error) {
    console.error("Error al obtener el token:", error);
    return false;
  }
}

// Elementos del DOM
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// Historial de mensajes para contexto
let messageHistory = [];

// Prompt del sistema para BITER
const SYSTEM_PROMPT = `Eres BITER, un mentor experto en negocios y emprendimiento digital. 
Tu objetivo es ayudar a emprendedores a tomar decisiones estratégicas inteligentes. 
Hablas como un CEO experimentado: claro, directo y estratégico. 
Siempre respondes en español, con un tono profesional pero cercano. 
Eres realista y práctico, nunca te vas por las ramas. 
Responde de forma concisa y directa a esta pregunta:`;

// Función para mostrar un mensaje en el chat
function addMessage(text, isUser = false) {
  const messageElement = document.createElement("div");
  messageElement.className = isUser ? "message user-message" : "message bot-message";

  // Convertir saltos de línea a HTML y formatear listas numeradas
  const formattedText = text
    .replace(/\n/g, "<br>")
    .replace(/(\d+\.\s[^\n]+)(?:\n|$)/g, "<li>$1</li>")
    .replace(/<li>/g, "<ol><li>")
    .replace(/<\/li>$/, "</li></ol>")
    .replace(/<\/li><ol>/g, "</li></ol><ol>");

  messageElement.innerHTML = formattedText;
  chatMessages.appendChild(messageElement);

  // Scroll al final del chat
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Guardar mensaje en el historial
  messageHistory.push({
    role: isUser ? "user" : "assistant",
    content: text,
  });

  // Limitar el historial a los últimos 10 mensajes para evitar tokens excesivos
  if (messageHistory.length > 10) {
    messageHistory = messageHistory.slice(messageHistory.length - 10);
  }
}

// Función para mostrar el indicador de escritura
function showTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.className = "typing-indicator";
  typingIndicator.id = "typing-indicator";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    typingIndicator.appendChild(dot);
  }

  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para ocultar el indicador de escritura
function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Función para enviar mensaje al modelo y obtener respuesta
async function sendMessageToModel(message) {
  try {
    // Verificar si el token está configurado
    if (!HF_TOKEN) {
      // Intentar obtener el token si no está configurado
      const tokenObtained = await getHuggingFaceToken();
      if (!tokenObtained) {
        return "⚠️ No se pudo obtener el token de autenticación. Por favor, intenta de nuevo más tarde.";
      }
    }

    // Construir el prompt completo con el historial
    let fullPrompt = SYSTEM_PROMPT + "\n\n";

    // Añadir historial de conversación
    messageHistory.forEach((msg) => {
      fullPrompt += `${msg.role === "user" ? "Usuario" : "BITER"}: ${msg.content}\n\n`;
    });

    // Añadir el mensaje actual
    fullPrompt += `Usuario: ${message}\n\nBITER:`;

    // Llamar a la API de Hugging Face
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    // Extraer y limpiar la respuesta
    let botResponse = data[0].generated_text.trim();

    // Eliminar prefijos como "BITER:" si aparecen en la respuesta
    botResponse = botResponse.replace(/^BITER:\s*/i, "");

    return botResponse;
  } catch (error) {
    console.error("Error al comunicarse con el modelo:", error);
    return "Lo siento, estoy teniendo problemas para procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.";
  }
}

// Función para manejar el envío de mensajes
async function handleSendMessage() {
  const message = messageInput.value.trim();

  if (!message) return;

  // Limpiar el input
  messageInput.value = "";

  // Mostrar el mensaje del usuario
  addMessage(message, true);

  // Mostrar indicador de escritura
  showTypingIndicator();

  // Deshabilitar el botón de envío mientras se procesa
  sendButton.disabled = true;

  try {
    // Obtener respuesta del modelo
    const response = await sendMessageToModel(message);

    // Ocultar indicador de escritura
    hideTypingIndicator();

    // Mostrar la respuesta del bot
    addMessage(response);
  } catch (error) {
    console.error("Error:", error);

    // Ocultar indicador de escritura
    hideTypingIndicator();

    // Mostrar mensaje de error
    addMessage("Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.");
  } finally {
    // Habilitar el botón de envío
    sendButton.disabled = false;
  }
}

// Event listeners
sendButton.addEventListener("click", handleSendMessage);

messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    handleSendMessage();
  }
});

// Mensaje de bienvenida al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  // Obtener el token al cargar la página
  await getHuggingFaceToken();
  
  // Mostrar mensaje de bienvenida
  addMessage("¡Hola! Soy BITER, tu mentor en tiempo real para decisiones de negocio. ¿En qué puedo ayudarte hoy?");
});
