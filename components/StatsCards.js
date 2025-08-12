const ChartJS = window.Chart;

function StatsCards({ user }) {
  try {
    const [stats, setStats] = React.useState({
      workedDays: 0,
      remainingVacations: 0,
      usedVacations: 0,
      monthlyAverage: 0,
      weeklyAverage: 0,
      todayHours: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadStats();
    }, [user]);

    const loadStats = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const timeEntries = await trickleListObjects(`time_entry:${user.id}`, 1000, true);
        const vacationRequests = await trickleListObjects(`vacation_request:${user.id}`, 1000, true);

        const yearEntries = timeEntries.items.filter(entry => 
          new Date(entry.objectData.date).getFullYear() === currentYear
        );

        const approvedVacations = vacationRequests.items.filter(req => 
          req.objectData.status === 'approved' && 
          new Date(req.objectData.start_date).getFullYear() === currentYear
        );

        const usedVacationDays = approvedVacations.reduce((sum, req) => 
          sum + req.objectData.days_requested, 0
        );

        const totalHours = yearEntries.reduce((sum, entry) => {
          const hours = TimeUtils.calculateHours(
            entry.objectData.start_time, 
            entry.objectData.end_time, 
            entry.objectData.break_minutes || 0
          );
          return sum + hours;
        }, 0);

        const today = new Date().toISOString().split('T')[0];
        const todayEntry = yearEntries.find(entry => 
          entry.objectData.date === today
        );
        
        const todayHours = todayEntry ? TimeUtils.calculateHours(
          todayEntry.objectData.start_time,
          todayEntry.objectData.end_time,
          todayEntry.objectData.break_minutes || 0
        ) : 0;

        setStats({
          workedDays: yearEntries.length,
          remainingVacations: user.vacation_days - usedVacationDays,
          usedVacations: usedVacationDays,
          monthlyAverage: totalHours / 12,
          weeklyAverage: totalHours / 52,
          todayHours: todayHours
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    const statCards = [
      {
        title: 'Días Trabajados',
        value: stats.workedDays,
        icon: 'calendar-check',
        color: 'from-blue-500 to-blue-600',
        suffix: ' días'
      },
      {
        title: 'Vacaciones Restantes',
        value: stats.remainingVacations,
        icon: 'calendar-days',
        color: 'from-green-500 to-green-600',
        suffix: ' días'
      },
      {
        title: 'Vacaciones Usadas',
        value: stats.usedVacations,
        icon: 'plane',
        color: 'from-purple-500 to-purple-600',
        suffix: ' días'
      },
      {
        title: 'Promedio Mensual',
        value: stats.monthlyAverage.toFixed(1),
        icon: 'trending-up',
        color: 'from-orange-500 to-orange-600',
        suffix: ' hrs'
      },
      {
        title: 'Promedio Semanal',
        value: stats.weeklyAverage.toFixed(1),
        icon: 'bar-chart',
        color: 'from-indigo-500 to-indigo-600',
        suffix: ' hrs'
      },
      {
        title: 'Horas Hoy',
        value: stats.todayHours.toFixed(1),
        icon: 'clock',
        color: 'from-teal-500 to-teal-600',
        suffix: ' hrs'
      }
    ];

    return (
      <div data-name="stats-cards" data-file="components/StatsCards.js">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user.name}
          </h2>
          <p className="text-gray-600">Resumen de tu actividad laboral</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className={`stat-card bg-gradient-to-r ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.title}</p>
                  <p className="text-white text-2xl font-bold">
                    {card.value}{card.suffix}
                  </p>
                </div>
                <div className={`icon-${card.icon} text-3xl text-white/80`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('StatsCards component error:', error);
    return null;
  }
}
