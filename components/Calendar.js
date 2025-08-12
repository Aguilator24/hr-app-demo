function Calendar({ user }) {
  try {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [timeEntries, setTimeEntries] = React.useState([]);
    const [vacationRequests, setVacationRequests] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadCalendarData();
    }, [currentDate]);

    const loadCalendarData = async () => {
      try {
        const entries = await trickleListObjects(`time_entry:${user.id}`, 1000, true);
        const requests = await trickleListObjects(`vacation_request:${user.id}`, 1000, true);
        
        setTimeEntries(entries.items);
        setVacationRequests(requests.items.filter(r => r.objectData.status === 'approved'));
      } catch (error) {
        console.error('Error loading calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
      
      const days = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
      
      return days;
    };

    const getDayInfo = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      const entry = timeEntries.find(e => e.objectData.date === dateStr);
      const vacation = vacationRequests.find(v => {
        const start = new Date(v.objectData.start_date);
        const end = new Date(v.objectData.end_date);
        return date >= start && date <= end;
      });

      return { entry, vacation };
    };

    const navigateMonth = (direction) => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + direction);
        return newDate;
      });
    };

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (loading) {
      return (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div data-name="calendar" data-file="components/Calendar.js">
        <h2 className="text-2xl font-bold mb-6">Calendario</h2>
        
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="btn-secondary"
              >
                <div className="icon-chevron-left text-lg"></div>
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="btn-secondary"
              >
                <div className="icon-chevron-right text-lg"></div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((date, index) => {
              const { entry, vacation } = getDayInfo(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-16 p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-[var(--primary-color)]' : ''}`}
                >
                  <div className={`text-sm font-medium ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {vacation && (
                    <div className="mt-1">
                      <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                        Vacaciones
                      </div>
                    </div>
                  )}
                  
                  {entry && !vacation && (
                    <div className="mt-1">
                      <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                        {TimeUtils.formatTime(TimeUtils.calculateHours(
                          entry.objectData.start_time,
                          entry.objectData.end_time,
                          entry.objectData.break_minutes || 0
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
              <span>Día trabajado</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
              <span>Vacaciones</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Calendar component error:', error);
    return null;
  }
}