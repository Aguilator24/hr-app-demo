function TimeEntryForm({ user }) {
  try {
    const [selectedDates, setSelectedDates] = React.useState([]);
    const [startTime, setStartTime] = React.useState('09:00');
    const [endTime, setEndTime] = React.useState('17:00');
    const [breakMinutes, setBreakMinutes] = React.useState(60);
    const [notes, setNotes] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [approvedVacations, setApprovedVacations] = React.useState([]);

    const handleDateChange = (date) => {
      setSelectedDates(prev => {
        if (prev.includes(date)) {
          return prev.filter(d => d !== date);
        } else {
          return [...prev, date].sort();
        }
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (selectedDates.length === 0) {
        setMessage('Selecciona al menos una fecha');
        return;
      }

      // Filtrar fechas que no están en vacaciones
      const validDates = selectedDates.filter(date => !isDateInVacation(date));
      const vacationDates = selectedDates.filter(date => isDateInVacation(date));

      if (vacationDates.length > 0) {
        setMessage(`Se omitieron ${vacationDates.length} fecha(s) por tener vacaciones aprobadas: ${vacationDates.map(d => new Date(d).toLocaleDateString()).join(', ')}`);
      }

      if (validDates.length === 0) {
        setMessage('No se pueden registrar horas en días con vacaciones aprobadas');
        return;
      }

      setLoading(true);
      try {
        for (const date of validDates) {
          await trickleCreateObject(`time_entry:${user.id}`, {
            user_id: user.id,
            date: date,
            start_time: startTime,
            end_time: endTime,
            break_minutes: breakMinutes,
            notes: notes
          });
        }
        
        const successMessage = validDates.length === selectedDates.length 
          ? 'Registros guardados correctamente'
          : `Registros guardados para ${validDates.length} de ${selectedDates.length} fechas seleccionadas`;
        
        setMessage(successMessage);
        setSelectedDates([]);
        setNotes('');
      } catch (error) {
        setMessage('Error al guardar los registros');
      } finally {
        setLoading(false);
      }
    };

    const calculateHours = () => {
      return TimeUtils.calculateHours(startTime, endTime, breakMinutes);
    };

    const [currentCalendarDate, setCurrentCalendarDate] = React.useState(new Date());

    React.useEffect(() => {
      loadApprovedVacations();
    }, [user]);

    const loadApprovedVacations = async () => {
      try {
        const vacationRequests = await trickleListObjects(`vacation_request:${user.id}`, 1000, true);
        const approved = vacationRequests.items.filter(req => req.objectData.status === 'approved');
        setApprovedVacations(approved);
      } catch (error) {
        console.error('Error loading approved vacations:', error);
      }
    };

    const isDateInVacation = (dateStr) => {
      return approvedVacations.some(vacation => {
        const startDate = new Date(vacation.objectData.start_date);
        const endDate = new Date(vacation.objectData.end_date);
        const checkDate = new Date(dateStr);
        return checkDate >= startDate && checkDate <= endDate;
      });
    };

    const generateCalendarDays = () => {
      const currentMonth = currentCalendarDate.getMonth();
      const currentYear = currentCalendarDate.getFullYear();
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      
      const days = [];
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(currentYear, currentMonth, d);
        const dateStr = date.toISOString().split('T')[0];
        const today = new Date();
        today.setHours(0,0,0,0);
        days.push({
          date: dateStr,
          day: d,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isPast: false, // Permitir seleccionar cualquier fecha
          isVacation: isDateInVacation(dateStr)
        });
      }
      return days;
    };

    const navigateMonth = (direction) => {
      setCurrentCalendarDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + direction);
        return newDate;
      });
    };

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
      <div data-name="time-entry-form" data-file="components/TimeEntryForm.js">
        <h2 className="text-2xl font-bold mb-6">Registro de Horario</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Seleccionar Fechas</h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="btn-secondary text-sm"
                >
                  <div className="icon-chevron-left text-sm"></div>
                </button>
                <span className="text-sm font-medium min-w-32 text-center">
                  {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="btn-secondary text-sm"
                >
                  <div className="icon-chevron-right text-sm"></div>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                <div key={day} className="text-center font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {generateCalendarDays().map(({ date, day, isWeekend, isPast, isVacation }) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleDateChange(date)}
                  className={`p-2 text-sm rounded-lg transition-colors relative ${
                    selectedDates.includes(date)
                      ? 'bg-[var(--primary-color)] text-white'
                      : isVacation
                      ? 'bg-green-100 text-green-800 cursor-pointer'
                      : isWeekend
                      ? 'text-gray-400 hover:bg-gray-100'
                      : 'hover:bg-[var(--primary-color)]/10'
                  }`}
                  title={isVacation ? 'Día de vacaciones aprobadas' : ''}
                >
                  {day}
                  {isVacation && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            {selectedDates.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedDates.length} fecha(s) seleccionada(s)
              </p>
            )}
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
                  <span>Vacaciones aprobadas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[var(--primary-color)] rounded mr-1"></div>
                  <span>Seleccionado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hora inicio</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Hora fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Descanso (minutos)</label>
                <input
                  type="number"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className="input-field"
                  min="0"
                  max="480"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field h-20"
                  placeholder="Descripción del trabajo realizado..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium">
                  Horas por día: {TimeUtils.formatTime(calculateHours())}
                </p>
                <p className="text-sm text-gray-600">
                  Total: {TimeUtils.formatTime(calculateHours() * selectedDates.length)}
                </p>
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
                disabled={loading || selectedDates.length === 0}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TimeEntryForm component error:', error);
    return null;
  }
}