function TimeReports({ user }) {
  try {
    const [employees, setEmployees] = React.useState([]);
    const [selectedEmployee, setSelectedEmployee] = React.useState('');
    const [timeEntries, setTimeEntries] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [dateRange, setDateRange] = React.useState({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });

    React.useEffect(() => {
      loadEmployees();
    }, []);

    React.useEffect(() => {
      if (selectedEmployee) {
        loadTimeEntries(selectedEmployee);
      }
    }, [selectedEmployee, dateRange]);

    const loadEmployees = async () => {
      try {
        const users = await trickleListObjects('user', 1000, true);
        const employeeList = users.items.filter(u => u.objectData.role === 'employee');
        setEmployees(employeeList);
        if (employeeList.length > 0) {
          setSelectedEmployee(employeeList[0].objectId);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadTimeEntries = async (employeeId) => {
      try {
        const entries = await trickleListObjects(`time_entry:${employeeId}`, 1000, true);
        
        const filteredEntries = entries.items.filter(entry => {
          const entryDate = new Date(entry.objectData.date);
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          return entryDate >= startDate && entryDate <= endDate;
        });
        
        setTimeEntries(filteredEntries);
      } catch (error) {
        console.error('Error loading time entries:', error);
      }
    };

    const calculateTotalHours = () => {
      return timeEntries.reduce((total, entry) => {
        return total + TimeUtils.calculateHours(
          entry.objectData.start_time,
          entry.objectData.end_time,
          entry.objectData.break_minutes || 0
        );
      }, 0);
    };

    const exportToExcel = () => {
      const selectedEmployeeData = employees.find(e => e.objectId === selectedEmployee);
      if (!selectedEmployeeData) return;

      // Crear contenido HTML para simular Excel
      const htmlContent = `
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Descanso (min)</th>
              <th>Total Horas</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            ${timeEntries.map(entry => `
              <tr>
                <td>${selectedEmployeeData.objectData.name}</td>
                <td>${new Date(entry.objectData.date).toLocaleDateString()}</td>
                <td>${entry.objectData.start_time}</td>
                <td>${entry.objectData.end_time}</td>
                <td>${entry.objectData.break_minutes || 0}</td>
                <td>${TimeUtils.formatTime(TimeUtils.calculateHours(
                  entry.objectData.start_time,
                  entry.objectData.end_time,
                  entry.objectData.break_minutes || 0
                ))}</td>
                <td>${entry.objectData.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_${selectedEmployeeData.objectData.name}_${dateRange.startDate}_${dateRange.endDate}.xlsx`;
      link.click();
    };

    if (loading) {
      return (
        <div className="card">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      );
    }

    const selectedEmployeeData = employees.find(e => e.objectId === selectedEmployee);

    return (
      <div data-name="time-reports" data-file="components/TimeReports.js">
        <h2 className="text-2xl font-bold mb-6">Reportes de Tiempo</h2>
        
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Empleado:</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input-field"
              >
                {employees.map((employee) => (
                  <option key={employee.objectId} value={employee.objectId}>
                    {employee.objectData.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha inicio:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha fin:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToExcel}
                className="btn-success w-full"
                disabled={timeEntries.length === 0}
              >
                <div className="icon-download text-lg mr-2"></div>
                Exportar XLSX
              </button>
            </div>
          </div>

          {selectedEmployeeData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Horas (Mes)</p>
                <p className="text-2xl font-bold text-blue-800">
                  {TimeUtils.formatTime(calculateTotalHours())}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Días Trabajados</p>
                <p className="text-2xl font-bold text-green-800">{timeEntries.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Promedio Diario</p>
                <p className="text-2xl font-bold text-purple-800">
                  {timeEntries.length > 0 
                    ? TimeUtils.formatTime(calculateTotalHours() / timeEntries.length)
                    : '0h 0m'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Registros del Mes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Fecha</th>
                  <th className="text-left py-3">Entrada</th>
                  <th className="text-left py-3">Salida</th>
                  <th className="text-left py-3">Descanso</th>
                  <th className="text-left py-3">Total</th>
                  <th className="text-left py-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No hay registros para este mes
                    </td>
                  </tr>
                ) : (
                  timeEntries.map((entry) => (
                    <tr key={entry.objectId} className="border-b">
                      <td className="py-3">
                        {new Date(entry.objectData.date).toLocaleDateString()}
                      </td>
                      <td className="py-3">{entry.objectData.start_time}</td>
                      <td className="py-3">{entry.objectData.end_time}</td>
                      <td className="py-3">{entry.objectData.break_minutes || 0} min</td>
                      <td className="py-3">
                        {TimeUtils.formatTime(TimeUtils.calculateHours(
                          entry.objectData.start_time,
                          entry.objectData.end_time,
                          entry.objectData.break_minutes || 0
                        ))}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {entry.objectData.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TimeReports component error:', error);
    return null;
  }
}