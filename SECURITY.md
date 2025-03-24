
## Características

- Interfaz de chat intuitiva y responsive
- Integración directa con la API de Hugging Face
- Respuestas en español con tono profesional pero cercano
- Diseño adaptable a dispositivos móviles y de escritorio

## Tecnologías utilizadas

- HTML5, CSS3 y JavaScript (vanilla)
- Hugging Face Inference API
- Modelo Zephyr 7B Beta

## Configuración de Seguridad

⚠️ **IMPORTANTE**: Este proyecto requiere un token de API de Hugging Face.

Por razones de seguridad, no debes incluir tu token directamente en el código. Consulta el archivo [SECURITY.md](SECURITY.md) para obtener instrucciones sobre cómo configurar tu token de forma segura.

## Integración con BYTE

Este chatbot está diseñado para ser integrado en la web de BYTE. Hay varias formas de hacerlo:

### Opción 1: Integración mediante iframe

```html
<iframe src="https://tuusuario.github.io/Biter-Bot/chatbot/biter.html" 
        width="400" 
        height="600" 
        frameborder="0">
</iframe>
