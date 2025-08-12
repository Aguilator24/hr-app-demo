# Configuración Detallada de Gmail para Notificaciones

## Paso a Paso para Configurar Gmail

### 1. Activar Verificación en 2 Pasos

1. **Ir a tu cuenta de Google:**
   - Ve a https://myaccount.google.com
   - Inicia sesión con tu cuenta de Gmail

2. **Acceder a Seguridad:**
   - En el menú lateral izquierdo, haz clic en "Seguridad"
   - Busca la sección "Iniciar sesión en Google"

3. **Activar Verificación en 2 pasos:**
   - Haz clic en "Verificación en 2 pasos"
   - Sigue las instrucciones para configurarla
   - Puedes usar tu teléfono móvil para recibir códigos

### 2. Crear Contraseña de Aplicación

1. **Una vez activada la verificación en 2 pasos:**
   - Regresa a la página de Seguridad
   - Busca "Contraseñas de aplicaciones"
   - Haz clic en "Contraseñas de aplicaciones"

2. **Generar nueva contraseña:**
   - En "Seleccionar app", elige "Correo"
   - En "Seleccionar dispositivo", elige "Otro (nombre personalizado)"
   - Escribe: "Sistema Control Horario"
   - Haz clic en "Generar"

3. **Guardar la contraseña:**
   - Google te mostrará una contraseña de 16 caracteres
   - **¡MUY IMPORTANTE!** Copia y guarda esta contraseña
   - Se verá algo así: `abcd efgh ijkl mnop`
   - Esta contraseña la usarás en lugar de tu contraseña normal

### 3. Configuración en el Código

En tu archivo `.env`, usa estos datos:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=tu_email@gmail.com
```

### 4. Código de Ejemplo para Enviar Correos

```javascript
const nodemailer = require('nodemailer');

// Configurar el transportador
const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para enviar correo
async function enviarCorreo(destinatario, asunto, contenido) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: destinatario,
            subject: asunto,
            html: contenido
        });
        
        console.log('Correo enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error enviando correo:', error);
        return { success: false, error: error.message };
    }
}
```

### 5. Probar la Configuración

Para probar que todo funciona:

```javascript
// Enviar correo de prueba
enviarCorreo(
    'destinatario@ejemplo.com',
    'Prueba del Sistema',
    '<h1>¡El sistema de correos funciona!</h1><p>Este es un correo de prueba.</p>'
);
```

### 6. Solución de Problemas

**Error: "Invalid login"**
- Verifica que uses la contraseña de aplicación, no tu contraseña normal
- Asegúrate de que la verificación en 2 pasos esté activa

**Error: "Less secure app access"**
- Gmail ya no permite aplicaciones menos seguras
- Debes usar contraseñas de aplicación obligatoriamente

**Error: "Authentication failed"**
- Revisa que el email y contraseña sean correctos
- Verifica que no haya espacios extra en la contraseña

### 7. Límites de Gmail

- **Límite diario:** 500 correos por día
- **Límite por minuto:** 100 correos por minuto
- **Destinatarios:** Máximo 500 destinatarios por correo

Para un sistema de empresa pequeña, estos límites son más que suficientes.

### 8. Alternativas a Gmail

Si necesitas enviar más correos, puedes usar:

**SendGrid (Recomendado para empresas):**
- 100 correos gratis por día
- Planes desde $14.95/mes para 50,000 correos

**Mailgun:**
- 5,000 correos gratis por mes
- Planes desde $35/mes

**Amazon SES:**
- $0.10 por cada 1,000 correos
- Muy económico para grandes volúmenes

### 9. Configuración para Producción

En producción, es recomendable:

1. **Usar variables de entorno:**
   ```bash
   export EMAIL_USER=tu_email@gmail.com
   export EMAIL_PASS=tu_contraseña_aplicacion
   ```

2. **Configurar logs:**
   ```javascript
   // Guardar logs de correos enviados
   const fs = require('fs');
   
   function logEmail(info) {
       const log = `${new Date().toISOString()} - Correo enviado: ${info.messageId}\n`;
       fs.appendFileSync('email.log', log);
   }
   ```

3. **Manejar errores:**
   ```javascript
   // Reintentar envío en caso de error
   async function enviarCorreoConReintentos(destinatario, asunto, contenido, intentos = 3) {
       for (let i = 0; i < intentos; i++) {
           try {
               const resultado = await enviarCorreo(destinatario, asunto, contenido);
               if (resultado.success) return resultado;
           } catch (error) {
               if (i === intentos - 1) throw error;
               await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
           }
       }
   }
   ```

¡Con esta configuración tendrás un sistema de correos completamente funcional!