const EmailService = {
  async sendVacationRequestNotification(employeeName, employeeEmail, startDate, endDate, daysRequested, reason) {
    // Sistema de notificaciones en modo demo - registra en consola
    console.log('📧 NOTIFICACIÓN AL ADMINISTRADOR:', {
      destinatario: 'admin@empresa.com',
      asunto: `Nueva solicitud de vacaciones - ${employeeName}`,
      contenido: {
        empleado: `${employeeName} (${employeeEmail})`,
        fechas: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        dias_solicitados: daysRequested,
        motivo: reason,
        fecha_solicitud: new Date().toLocaleString()
      }
    });
    
    // Simular pequeña demora de envío
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      message: 'Notificación enviada al administrador (modo demo)' 
    };
  },

  async sendVacationApprovalNotification(employeeEmail, employeeName, startDate, endDate, status) {
    const statusText = status === 'approved' ? 'APROBADAS' : 'RECHAZADAS';
    
    // Sistema de notificaciones en modo demo - registra en consola
    console.log('📧 NOTIFICACIÓN AL EMPLEADO:', {
      destinatario: employeeEmail,
      asunto: `Vacaciones ${statusText}`,
      contenido: {
        empleado: employeeName,
        fechas: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        estado: statusText,
        mensaje: status === 'approved' 
          ? 'Disfruta de tus vacaciones.' 
          : 'Si tienes dudas, contacta con tu supervisor.',
        fecha_respuesta: new Date().toLocaleString()
      }
    });
    
    // Simular pequeña demora de envío
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      message: `Notificación de vacaciones ${statusText.toLowerCase()} enviada (modo demo)` 
    };
  }
};
