function VacationManagement({ user }) {
  try {
    const [requests, setRequests] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadRequests();
    }, []);

    const loadRequests = async () => {
      try {
        // Buscar todas las solicitudes de vacaciones
        const allUsers = await trickleListObjects('user', 1000, true);
        const employees = allUsers.items.filter(u => u.objectData.role === 'employee');
        
        let allRequests = [];
        for (const employee of employees) {
          try {
            const userRequests = await trickleListObjects(`vacation_request:${employee.objectId}`, 1000, true);
            const requestsWithUserData = userRequests.items.map(request => ({
              ...request,
              employeeName: employee.objectData.name
            }));
            allRequests = [...allRequests, ...requestsWithUserData];
          } catch (error) {
            console.error(`Error loading requests for user ${employee.objectId}:`, error);
          }
        }
        
        setRequests(allRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleApproval = async (requestId, status) => {
      try {
        const request = requests.find(r => r.objectId === requestId);
        if (!request) {
          alert('Solicitud no encontrada');
          return;
        }
        
        // Obtener datos del empleado para el correo
        const allUsers = await trickleListObjects('user', 1000, true);
        const employee = allUsers.items.find(u => u.objectId === request.objectData.user_id);
        
        const updatedData = {
          user_id: request.objectData.user_id,
          start_date: request.objectData.start_date,
          end_date: request.objectData.end_date,
          days_requested: request.objectData.days_requested,
          reason: request.objectData.reason,
          status: status,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        };
        
        await trickleUpdateObject(`vacation_request:${request.objectData.user_id}`, requestId, updatedData);
        
        // Enviar notificación al empleado
        let notificationMessage = '';
        if (employee) {
          const notificationResult = await EmailService.sendVacationApprovalNotification(
            employee.objectData.email,
            employee.objectData.name,
            request.objectData.start_date,
            request.objectData.end_date,
            status
          );
          notificationMessage = ` ${notificationResult.message}`;
        }
        
        alert(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} correctamente.${notificationMessage}`);
        loadRequests();
      } catch (error) {
        console.error('Error updating request:', error);
        alert('Error al actualizar la solicitud: ' + error.message);
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'approved': return 'text-green-600 bg-green-50';
        case 'rejected': return 'text-red-600 bg-red-50';
        default: return 'text-yellow-600 bg-yellow-50';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'approved': return 'Aprobada';
        case 'rejected': return 'Rechazada';
        default: return 'Pendiente';
      }
    };

    if (loading) {
      return (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div data-name="vacation-management" data-file="components/VacationManagement.js">
        <h2 className="text-2xl font-bold mb-6">Gestión de Vacaciones</h2>
        
        <div className="card">
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay solicitudes de vacaciones
              </p>
            ) : (
              requests.map((request) => (
                <div key={request.objectId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{request.employeeName}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(request.objectData.start_date).toLocaleDateString()} - {' '}
                        {new Date(request.objectData.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.objectData.days_requested} días laborales
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.objectData.status)}`}>
                      {getStatusText(request.objectData.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{request.objectData.reason}</p>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Solicitado: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    
                    {request.objectData.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(request.objectId, 'approved')}
                          className="btn-success text-sm"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleApproval(request.objectId, 'rejected')}
                          className="btn-danger text-sm"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('VacationManagement component error:', error);
    return null;
  }
}