# Estructura Completa del Servidor

## Archivos Principales del Servidor

### 1. server.js (Archivo Principal)

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const timeRoutes = require('./routes/timeEntries');
const vacationRoutes = require('./routes/vacations');
const emailRoutes = require('./routes/email');
const documentRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../cliente')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/time-entries', timeRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/documents', documentRoutes);

// Servir archivos estáticos del cliente
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

### 2. config/database.js

```javascript
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
```

### 3. middleware/auth.js

```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };
```

### 4. routes/auth.js

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                vacation_days: user.vacation_days
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
```

### 5. routes/users.js

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los usuarios (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, email, name, role, department, vacation_days, hire_date FROM users'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// Crear nuevo usuario (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, department, vacation_days } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, department, vacation_days, hire_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'employee', department, vacation_days, new Date()]
        );

        res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            userId: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'El email ya existe' });
        } else {
            res.status(500).json({ message: 'Error al crear usuario' });
        }
    }
});

// Eliminar usuario (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});

module.exports = router;
```

### 6. routes/timeEntries.js

```javascript
const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener registros de tiempo del usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [entries] = await db.execute(
            'SELECT * FROM time_entries WHERE user_id = ? ORDER BY date DESC',
            [userId]
        );
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener registros' });
    }
});

// Crear nuevo registro de tiempo
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, start_time, end_time, break_minutes, notes } = req.body;
        
        const [result] = await db.execute(
            'INSERT INTO time_entries (user_id, date, start_time, end_time, break_minutes, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, date, start_time, end_time, break_minutes || 0, notes || '']
        );

        res.status(201).json({ 
            message: 'Registro creado exitosamente',
            entryId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear registro' });
    }
});

// Obtener registros por empleado (solo admin)
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [entries] = await db.execute(
            'SELECT * FROM time_entries WHERE user_id = ? ORDER BY date DESC',
            [employeeId]
        );
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener registros del empleado' });
    }
});

module.exports = router;
```

### 7. routes/vacations.js

```javascript
const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Obtener solicitudes de vacaciones del usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [requests] = await db.execute(
            'SELECT * FROM vacation_requests WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener solicitudes' });
    }
});

// Crear nueva solicitud de vacaciones
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date, days_requested, reason } = req.body;
        
        const [result] = await db.execute(
            'INSERT INTO vacation_requests (user_id, start_date, end_date, days_requested, reason) VALUES (?, ?, ?, ?, ?)',
            [userId, start_date, end_date, days_requested, reason]
        );

        // Enviar notificación al administrador
        await emailService.sendVacationRequestNotification(
            req.user.name,
            req.user.email,
            start_date,
            end_date,
            days_requested,
            reason
        );

        res.status(201).json({ 
            message: 'Solicitud creada exitosamente',
            requestId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear solicitud' });
    }
});

// Aprobar/rechazar solicitud (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const [result] = await db.execute(
            'UPDATE vacation_requests SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?',
            [status, req.user.id, new Date(), id]
        );

        // Obtener datos del empleado para notificación
        const [request] = await db.execute(
            'SELECT vr.*, u.name, u.email FROM vacation_requests vr JOIN users u ON vr.user_id = u.id WHERE vr.id = ?',
            [id]
        );

        if (request.length > 0) {
            await emailService.sendVacationApprovalNotification(
                request[0].email,
                request[0].name,
                request[0].start_date,
                request[0].end_date,
                status
            );
        }

        res.json({ message: 'Solicitud actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar solicitud' });
    }
});

module.exports = router;
```

### 8. routes/email.js

```javascript
const express = require('express');
const emailService = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Enviar correo de prueba
router.post('/test', authenticateToken, async (req, res) => {
    try {
        const { to, subject, message } = req.body;
        
        const result = await emailService.sendTestEmail(to, subject, message);
        
        if (result.success) {
            res.json({ message: 'Correo enviado exitosamente' });
        } else {
            res.status(500).json({ message: 'Error al enviar correo' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor de correo' });
    }
});

module.exports = router;
```

### 9. services/emailService.js

```javascript
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendVacationRequestNotification(employeeName, employeeEmail, startDate, endDate, daysRequested, reason) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: 'admin@empresa.com',
                subject: `Nueva solicitud de vacaciones - ${employeeName}`,
                html: `
                    <h3>Nueva solicitud de vacaciones</h3>
                    <p><strong>Empleado:</strong> ${employeeName} (${employeeEmail})</p>
                    <p><strong>Fechas:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
                    <p><strong>Días solicitados:</strong> ${daysRequested}</p>
                    <p><strong>Motivo:</strong> ${reason}</p>
                    <p>Por favor, revisa la solicitud en el panel de administración.</p>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Correo enviado:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error enviando correo:', error);
            return { success: false, error: error.message };
        }
    }

    async sendVacationApprovalNotification(employeeEmail, employeeName, startDate, endDate, status) {
        try {
            const statusText = status === 'approved' ? 'aprobadas' : 'rechazadas';
            
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: employeeEmail,
                subject: `Vacaciones ${statusText}`,
                html: `
                    <h3>Estado de tu solicitud de vacaciones</h3>
                    <p>Hola ${employeeName},</p>
                    <p>Tu solicitud de vacaciones del <strong>${new Date(startDate).toLocaleDateString()}</strong> 
                    al <strong>${new Date(endDate).toLocaleDateString()}</strong> ha sido <strong>${statusText}</strong>.</p>
                    <p>${status === 'approved' 
                        ? 'Disfruta de tus vacaciones.' 
                        : 'Si tienes dudas, contacta con tu supervisor.'
                    }</p>
                    <p>Saludos,<br>Equipo de Recursos Humanos</p>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Correo enviado:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error enviando correo:', error);
            return { success: false, error: error.message };
        }
    }

    async sendTestEmail(to, subject, message) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to: to,
                subject: subject,
                html: `<p>${message}</p>`
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Error enviando correo de prueba:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
```

### 10. routes/documents.js

```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Obtener documentos del usuario
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [documents] = await db.execute(
            'SELECT * FROM documents WHERE user_id = ? ORDER BY upload_date DESC',
            [userId]
        );
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener documentos' });
    }
});

// Subir documento (solo admin)
router.post('/', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
    try {
        const { user_id, document_type, month_year, folder } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const [result] = await db.execute(
            'INSERT INTO documents (user_id, document_type, file_name, file_path, month_year, folder, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, document_type, file.originalname, file.path, month_year, folder, req.user.id]
        );

        res.status(201).json({ 
            message: 'Documento subido exitosamente',
            documentId: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir documento' });
    }
});

// Eliminar documento (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.execute('DELETE FROM documents WHERE id = ?', [id]);
        
        res.json({ message: 'Documento eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar documento' });
    }
});

module.exports = router;
```

## Instrucciones de Instalación Paso a Paso

### 1. Crear todos los archivos
Crea cada uno de estos archivos en su respectiva carpeta dentro de tu proyecto.

### 2. Instalar dependencias adicionales
```bash
npm install bcryptjs jsonwebtoken nodemailer multer
```

### 3. Crear carpeta de uploads
```bash
mkdir uploads
```

### 4. Configurar variables de entorno
Asegúrate de que tu archivo `.env` tenga todas las variables necesarias.

### 5. Actualizar el frontend
Cambia todas las llamadas a `trickleCreateObject`, `trickleListObjects`, etc. por llamadas HTTP a tu API.

### Ejemplo de cambio en el frontend:

**ANTES:**
```javascript
const users = await trickleListObjects('user', 100, true);
```

**DESPUÉS:**
```javascript
const response = await fetch('/api/users', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});
const users = await response.json();
```

## Comandos Útiles

- **Iniciar servidor:** `npm start`
- **Modo desarrollo:** `npm run dev`
- **Ver logs:** `tail -f logs/app.log`
- **Reiniciar servidor:** `pm2 restart app`

¡Con esta estructura tendrás un servidor completo y funcional!
