# Sistema de Control Horario

## Descripción
Sistema web completo para la gestión de control horario y vacaciones de empleados de una empresa.

## Características Principales

### Para Empleados
- Dashboard con estadísticas personales
- Registro de horario mediante calendario con validación de vacaciones
- Solicitud de vacaciones con validación de días disponibles
- Cancelación de solicitudes de vacaciones pendientes
- Calendario personal con visualización de días trabajados y vacaciones
- Visualización de documentos personales
- Sistema de notificaciones por correo

### Para Administradores
- Panel de administración con estadísticas generales
- Gestión de empleados (crear y eliminar usuarios)
- Aprobación/rechazo de solicitudes de vacaciones con notificaciones
- Reportes detallados de tiempo por empleado (exportación XLSX)
- Gestión de documentos (subir nóminas y otros documentos)
- Sistema de carpetas para organizar documentos
- Notificaciones automáticas por correo

## Estructura del Proyecto

### Páginas Principales
- `index.html` - Página de login
- `employee-dashboard.html` - Dashboard para empleados
- `admin-dashboard.html` - Dashboard para administradores

### Componentes
- `LoginForm.js` - Formulario de autenticación
- `Header.js` - Cabecera de navegación
- `StatsCards.js` - Tarjetas de estadísticas para empleados
- `TimeEntryForm.js` - Formulario de registro horario
- `VacationRequestForm.js` - Formulario de solicitud de vacaciones
- `Calendar.js` - Componente de calendario
- `AdminStats.js` - Estadísticas para administrador
- `EmployeeManagement.js` - Gestión de empleados
- `VacationManagement.js` - Gestión de vacaciones (admin)
- `TimeReports.js` - Reportes de tiempo
- `Documents.js` - Vista de documentos para empleados
- `DocumentManagement.js` - Gestión de documentos para administrador

### Utilidades
- `auth.js` - Servicio de autenticación
- `timeUtils.js` - Utilidades para cálculos de tiempo

## Base de Datos

### Tablas
- `user` - Información de usuarios (empleados y administradores)
- `time_entry` - Registros de horario
- `vacation_request` - Solicitudes de vacaciones
- `document` - Documentos de empleados (nóminas, contratos, etc.)

## Validaciones y Restricciones
- Los empleados no pueden solicitar más días de vacaciones de los asignados
- Se consideran días ya aprobados y pendientes para el cálculo
- No se permite registro horario en días con vacaciones aprobadas
- El sistema filtra automáticamente días de vacaciones al registrar horario

## Sistema de Notificaciones
- Correo al administrador cuando se solicitan vacaciones
- Correo al empleado cuando se aprueban/rechazan vacaciones
- Notificaciones automáticas en tiempo real

## Cuentas de Prueba
- **Administrador:** admin@empresa.com / admin123
- **Empleado:** empleado@empresa.com / empleado123
