# Guía Completa: Migrar el Sistema a un Servidor Propio

## ¿Qué vamos a hacer?

Actualmente tu sistema funciona en Trickle (como una demo). Vamos a moverlo a tu propio servidor para que sea completamente tuyo y puedas enviar correos reales usando Gmail.

## Paso 1: Preparar tu Computadora

### 1.1 Instalar Node.js
1. Ve a https://nodejs.org
2. Descarga la versión "LTS" (la recomendada)
3. Ejecuta el archivo descargado y sigue las instrucciones
4. Para verificar que se instaló:
   - Abre "Símbolo del sistema" (Windows) o "Terminal" (Mac)
   - Escribe: `node --version`
   - Debe mostrar un número como "v18.17.0"

### 1.2 Instalar un Editor de Código
1. Descarga Visual Studio Code desde https://code.visualstudio.com
2. Instálalo siguiendo las instrucciones

## Paso 2: Crear la Estructura del Servidor

### 2.1 Crear la Carpeta del Proyecto
1. Crea una carpeta en tu escritorio llamada "sistema-horario"
2. Abre Visual Studio Code
3. Ve a "Archivo" > "Abrir Carpeta" y selecciona "sistema-horario"

### 2.2 Estructura de Archivos Necesaria
Dentro de tu carpeta, necesitas crear esta estructura:
```
sistema-horario/
├── servidor/
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── timeEntries.js
│   │   ├── vacations.js
│   │   └── email.js
│   └── middleware/
│       └── auth.js
├── cliente/
│   ├── index.html
│   ├── employee-dashboard.html
│   ├── admin-dashboard.html
│   ├── js/
│   ├── css/
│   └── components/
└── base-datos/
    └── init.sql
```

## Paso 3: Configurar la Base de Datos

### 3.1 Instalar MySQL
1. Ve a https://dev.mysql.com/downloads/mysql/
2. Descarga MySQL Community Server
3. Durante la instalación:
   - Elige "Custom" (personalizada)
   - Instala solo "MySQL Server" y "MySQL Workbench"
   - Crea una contraseña para el usuario "root" (¡APÚNTALA!)

### 3.2 Crear la Base de Datos
1. Abre MySQL Workbench
2. Conecta con usuario "root" y tu contraseña
3. Crea una nueva base de datos llamada "control_horario"
4. Ejecuta este script SQL:

```sql
CREATE DATABASE control_horario;
USE control_horario;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('employee', 'admin') NOT NULL,
    department VARCHAR(255),
    vacation_days INT DEFAULT 22,
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE vacation_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    document_type ENUM('payroll', 'contract', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    month_year VARCHAR(7),
    folder VARCHAR(255),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Insertar usuarios de prueba
INSERT INTO users (email, password, name, role, department, vacation_days, hire_date) VALUES
('admin@empresa.com', 'admin123', 'Administrador', 'admin', 'Recursos Humanos', 0, '2020-01-01'),
('empleado@empresa.com', 'empleado123', 'Juan Pérez', 'employee', 'Desarrollo', 22, '2022-03-15');
```

## Paso 4: Configurar Gmail para Envío de Correos

### 4.1 Preparar tu Cuenta de Gmail
1. Ve a tu cuenta de Gmail
2. Haz clic en tu foto de perfil (esquina superior derecha)
3. Selecciona "Gestionar tu cuenta de Google"
4. Ve a "Seguridad" en el menú lateral
5. Busca "Verificación en 2 pasos" y actívala si no está activa
6. Una vez activada, busca "Contraseñas de aplicaciones"
7. Selecciona "Correo" y "Otro" (escribe "Sistema Horario")
8. Google te dará una contraseña de 16 caracteres (¡GUÁRDALA!)

### 4.2 Anotar Datos Importantes
Apunta esta información:
- Tu correo de Gmail: ejemplo@gmail.com
- Contraseña de aplicación: (la de 16 caracteres)
- Servidor SMTP: smtp.gmail.com
- Puerto: 587

## Paso 5: Configurar el Servidor

### 5.1 Crear package.json
En la carpeta "servidor", crea un archivo llamado `package.json`:

```json
{
  "name": "sistema-control-horario",
  "version": "1.0.0",
  "description": "Sistema de control horario y vacaciones",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.4",
    "cors": "^2.8.5",
    "multer": "^1.4.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 5.2 Instalar Dependencias
1. Abre la terminal en Visual Studio Code (Terminal > Nueva Terminal)
2. Navega a la carpeta servidor: `cd servidor`
3. Ejecuta: `npm install`
4. Espera a que termine (puede tomar unos minutos)

### 5.3 Crear Archivo de Configuración
En la carpeta "servidor", crea un archivo llamado `.env`:

```
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql_aqui
DB_NAME=control_horario

# JWT (para seguridad)
JWT_SECRET=mi_clave_super_secreta_123456

# Configuración de correo Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_16_caracteres
EMAIL_FROM=tu_email@gmail.com

# Puerto del servidor
PORT=3000
```

**¡IMPORTANTE!** Reemplaza:
- `tu_contraseña_mysql_aqui` con la contraseña de MySQL
- `tu_email@gmail.com` con tu correo de Gmail
- `tu_contraseña_de_aplicacion_16_caracteres` con la contraseña de aplicación

## Paso 6: Migrar el Código del Cliente

### 6.1 Copiar Archivos HTML
Copia todos los archivos `.html` de tu proyecto actual a la carpeta "cliente"

### 6.2 Copiar Archivos JavaScript
Copia todos los archivos `.js` a la carpeta "cliente/js"

### 6.3 Actualizar las URLs
En todos los archivos JavaScript, cambia las llamadas a la base de datos:

**ANTES:**
```javascript
await trickleCreateObject('user', userData);
```

**DESPUÉS:**
```javascript
await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(userData)
});
```

## Paso 7: Probar el Sistema

### 7.1 Iniciar el Servidor
1. En la terminal, ve a la carpeta servidor: `cd servidor`
2. Ejecuta: `npm start`
3. Deberías ver: "Servidor corriendo en puerto 3000"

### 7.2 Abrir el Sistema
1. Abre tu navegador
2. Ve a: `http://localhost:3000`
3. Deberías ver tu sistema funcionando

### 7.3 Probar Correos
1. Crea una solicitud de vacaciones
2. Revisa tu correo Gmail
3. Deberías recibir la notificación

## Paso 8: Subir a un Servidor en Internet

### 8.1 Opciones de Hosting
Para que otros accedan desde internet, puedes usar:

**Opción A: DigitalOcean (Recomendado)**
- Costo: $5-10 USD/mes
- Más control y rendimiento

**Opción B: Heroku (Más Fácil)**
- Costo: $7 USD/mes
- Más fácil de configurar

### 8.2 Pasos para DigitalOcean
1. Crea cuenta en digitalocean.com
2. Crea un "Droplet" (servidor virtual)
3. Elige Ubuntu 22.04
4. Conecta por SSH
5. Instala Node.js y MySQL
6. Sube tu código
7. Configura el dominio

### 8.3 Pasos para Heroku
1. Crea cuenta en heroku.com
2. Instala Heroku CLI
3. Configura tu proyecto para Heroku
4. Sube tu código con Git
5. Configura variables de entorno

## Paso 9: Configurar Dominio Propio

### 9.1 Comprar Dominio
1. Ve a namecheap.com o godaddy.com
2. Busca un dominio (ejemplo: miempresa-horario.com)
3. Compralo (cuesta unos $10-15 USD/año)

### 9.2 Configurar DNS
1. En el panel de tu dominio, configura los DNS
2. Apunta el dominio a la IP de tu servidor
3. Espera 24-48 horas para que se propague

## Paso 10: Configurar HTTPS (Seguridad)

### 10.1 Instalar Certificado SSL
1. Usa Let's Encrypt (gratuito)
2. En tu servidor, ejecuta:
```bash
sudo apt install certbot
sudo certbot --nginx -d tudominio.com
```

## Solución de Problemas Comunes

### Problema: "Cannot connect to database"
**Solución:** Verifica que MySQL esté corriendo y las credenciales sean correctas

### Problema: "Port 3000 already in use"
**Solución:** Cambia el puerto en el archivo .env a 3001 o 8080

### Problema: "Gmail authentication failed"
**Solución:** Verifica que tengas activada la verificación en 2 pasos y uses la contraseña de aplicación

### Problema: "Cannot find module"
**Solución:** Ejecuta `npm install` en la carpeta servidor

## Presupuesto Estimado

- Servidor DigitalOcean: $5-10 USD/mes
- Dominio: $10-15 USD/año
- Certificado SSL: Gratis (Let's Encrypt)
- **Total mensual: $6-11 USD**

## Tiempo Estimado

- Configuración inicial: 4-6 horas
- Migración del código: 2-3 horas
- Configuración del servidor: 2-4 horas
- **Total: 8-13 horas**

## Contacto para Ayuda

Si necesitas ayuda adicional, puedes:
1. Contratar un desarrollador freelance (costo: $200-500 USD)
2. Usar servicios de migración de hosting
3. Seguir tutoriales en YouTube sobre "deploy Node.js application"

¡Recuerda hacer copias de seguridad de todo antes de empezar!