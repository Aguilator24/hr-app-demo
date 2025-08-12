function VacationRequestForm({ user }) {
  try {
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [requests, setRequests] = React.useState([]);
    const [usedDays, setUsedDays] = React.useState(0);

    React.useEffect(() => {
      loadRequests();
    }, []);

    const loadRequests = async () => {
      try {
        const result = await trickleListObjects(`vacation_request:${user.id}`, 100, true);
        setRequests(result.items);
        
        // Calcular días usados y pendientes
        const currentYear = new Date().getFullYear();
        const usedAndPendingDays = result.items
          .filter(req => {
            const reqYear = new Date(req.objectData.start_date).getFullYear();
            return reqYear === currentYear && (req.objectData.status === 'approved' || req.objectData.status === 'pending');
          })
          .reduce((sum, req) => sum + req.objectData.days_requested, 0);
        
        setUsedDays(usedAndPendingDays);
      } catch (error) {
        console.error('Error loading requests:', error);
      }
    };

    const handleCancelRequest = async (requestId) => {
      if (confirm('¿Estás seguro de que quieres cancelar esta solicitud?')) {
        try {
          await trickleDeleteObject(`vacation_request:${user.id}`, requestId);
          setMessage('Solicitud cancelada correctamente');
          loadRequests();
        } catch (error) {
          setMessage('Error al cancelar la solicitud');
          console.error('Error canceling request:', error);
        }
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!startDate || !endDate) {
        setMessage('Selecciona las fechas de inicio y fin');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        setMessage('La fecha de fin debe ser posterior a la de inicio');
        return;
      }

      const daysRequested = TimeUtils.getWorkingDaysBetween(startDate, endDate);
      
      // Validar días disponibles
      const availableDays = user.vacation_days - usedDays;
      if (daysRequested > availableDays) {
        setMessage(`No puedes solicitar ${daysRequested} días. Solo tienes ${availableDays} días disponibles.`);
        return;
      }
      
      setLoading(true);
      try {
        await trickleCreateObject(`vacation_request:${user.id}`, {
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          days_requested: daysRequested,
          reason: reason,
          status: 'pending'
        });

        // Enviar notificación al administrador
        const notificationResult = await EmailService.sendVacationRequestNotification(
          user.name,
          user.email,
          startDate,
          endDate,
          daysRequested,
          reason
        );

        setMessage(`Solicitud enviada correctamente. ${notificationResult.message}`);
        setStartDate('');
        setEndDate('');
        setReason('');
        loadRequests();
      } catch (error) {
        setMessage('Error al enviar la solicitud');
      } finally {
        setLoading(false);
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

    return (
      <div data-name="vacation-request-form" data-file="components/VacationRequestForm.js">
        <h2 className="text-2xl font-bold mb-6">Solicitud de Vacaciones</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Nueva Solicitud</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Motivo</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field h-20"
                  placeholder="Describe el motivo de tu solicitud..."
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-blue-800">
                  Días totales asignados: {user.vacation_days}
                </p>
                <p className="text-sm text-blue-600">
                  Días usados/pendientes: {usedDays}
                </p>
                <p className="text-sm text-blue-600">
                  Días disponibles: {user.vacation_days - usedDays}
                </p>
                {startDate && endDate && (
                  <p className="text-sm font-medium text-blue-800 mt-2">
                    Días a solicitar: {TimeUtils.getWorkingDaysBetween(startDate, endDate)}
                  </p>
                )}
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.includes('Error') 
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Mis Solicitudes</h3>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No tienes solicitudes de vacaciones
                </p>
              ) : (
                requests.map((request) => (
                  <div key={request.objectId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {new Date(request.objectData.start_date).toLocaleDateString()} - {' '}
                          {new Date(request.objectData.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.objectData.days_requested} días
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.objectData.status)}`}>
                          {getStatusText(request.objectData.status)}
                        </span>
                        {request.objectData.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.objectId)}
                            className="btn-danger text-xs px-2 py-1"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{request.objectData.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Solicitado: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('VacationRequestForm component error:', error);
    return null;
  }
}