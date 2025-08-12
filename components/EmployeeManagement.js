function EmployeeManagement({ user }) {
  try {
    const [employees, setEmployees] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [formData, setFormData] = React.useState({
      name: '',
      email: '',
      password: '',
      department: '',
      vacation_days: 22
    });

    React.useEffect(() => {
      loadEmployees();
    }, []);

    const loadEmployees = async () => {
      try {
        const users = await trickleListObjects('user', 1000, true);
        const employeeList = users.items.filter(u => u.objectData.role === 'employee');
        setEmployees(employeeList);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await trickleCreateObject('user', {
          ...formData,
          role: 'employee',
          hire_date: new Date().toISOString()
        });
        
        setFormData({ name: '', email: '', password: '', department: '', vacation_days: 22 });
        setShowForm(false);
        loadEmployees();
      } catch (error) {
        console.error('Error creating employee:', error);
      }
    };

    const handleDeleteEmployee = async (employeeId) => {
      if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
        try {
          await trickleDeleteObject('user', employeeId);
          loadEmployees();
        } catch (error) {
          console.error('Error deleting employee:', error);
        }
      }
    };

    if (loading) {
      return (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div data-name="employee-management" data-file="components/EmployeeManagement.js">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestión de Empleados</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            <div className="icon-plus text-lg mr-2"></div>
            Nuevo Empleado
          </button>
        </div>

        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Empleado</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Departamento"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Días de vacaciones"
                value={formData.vacation_days}
                onChange={(e) => setFormData({...formData, vacation_days: parseInt(e.target.value)})}
                className="input-field"
                min="0"
                max="50"
              />
              <div className="flex space-x-2">
                <button type="submit" className="btn-primary">Crear</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Nombre</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Departamento</th>
                  <th className="text-left py-3">Vacaciones</th>
                  <th className="text-left py-3">Fecha Ingreso</th>
                  <th className="text-left py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.objectId} className="border-b">
                    <td className="py-3">{employee.objectData.name}</td>
                    <td className="py-3">{employee.objectData.email}</td>
                    <td className="py-3">{employee.objectData.department}</td>
                    <td className="py-3">{employee.objectData.vacation_days} días</td>
                    <td className="py-3">
                      {new Date(employee.objectData.hire_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleDeleteEmployee(employee.objectId)}
                        className="btn-danger text-sm"
                      >
                        <div className="icon-trash text-sm"></div>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('EmployeeManagement component error:', error);
    return null;
  }
}