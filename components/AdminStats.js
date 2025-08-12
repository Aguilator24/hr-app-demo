const ChartJS = window.Chart;

function AdminStats({ user }) {
  try {
    const [stats, setStats] = React.useState({
      totalEmployees: 0,
      pendingVacations: 0,
      totalHoursMonth: 0,
      averageHoursEmployee: 0
    });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadStats();
    }, []);

    const loadStats = async () => {
      try {
        const users = await trickleListObjects('user', 1000, true);
        const employees = users.items.filter(u => u.objectData.role === 'employee');
        
        const allVacationRequests = await trickleListObjects('vacation_request', 1000, true);
        const pendingRequests = allVacationRequests.items.filter(r => r.objectData.status === 'pending');
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let totalHours = 0;
        
        for (const employee of employees) {
          const timeEntries = await trickleListObjects(`time_entry:${employee.objectId}`, 1000, true);
          const monthEntries = timeEntries.items.filter(entry => {
            const entryDate = new Date(entry.objectData.date);
            return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
          });
          
          totalHours += monthEntries.reduce((sum, entry) => {
            return sum + TimeUtils.calculateHours(
              entry.objectData.start_time,
              entry.objectData.end_time,
              entry.objectData.break_minutes || 0
            );
          }, 0);
        }

        setStats({
          totalEmployees: employees.length,
          pendingVacations: pendingRequests.length,
          totalHoursMonth: totalHours,
          averageHoursEmployee: employees.length > 0 ? totalHours / employees.length : 0
        });
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
        title: 'Total Empleados',
        value: stats.totalEmployees,
        icon: 'users',
        color: 'from-blue-500 to-blue-600'
      },
      {
        title: 'Vacaciones Pendientes',
        value: stats.pendingVacations,
        icon: 'calendar-clock',
        color: 'from-yellow-500 to-yellow-600'
      },
      {
        title: 'Horas Totales (Mes)',
        value: stats.totalHoursMonth.toFixed(0),
        icon: 'clock',
        color: 'from-green-500 to-green-600'
      },
      {
        title: 'Promedio por Empleado',
        value: stats.averageHoursEmployee.toFixed(1),
        icon: 'trending-up',
        color: 'from-purple-500 to-purple-600'
      }
    ];

    return (
      <div data-name="admin-stats" data-file="components/AdminStats.js">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h2>
          <p className="text-gray-600">Resumen general de la empresa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className={`stat-card bg-gradient-to-r ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{card.title}</p>
                  <p className="text-white text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`icon-${card.icon} text-3xl text-white/80`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('AdminStats component error:', error);
    return null;
  }
}