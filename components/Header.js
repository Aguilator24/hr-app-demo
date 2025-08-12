function Header({ user, activeTab, onTabChange }) {
  try {
    const isAdmin = user?.role === 'admin';

    const navigationItems = isAdmin ? [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'employees', label: 'Empleados', icon: 'users' },
      { id: 'time-reports', label: 'Reportes', icon: 'chart-bar' },
      { id: 'vacation-management', label: 'Vacaciones', icon: 'calendar-days' },
      { id: 'document-management', label: 'Documentos', icon: 'file-text' }
    ] : [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'time-entry', label: 'Registro Horario', icon: 'clock' },
      { id: 'vacation', label: 'Vacaciones', icon: 'calendar-days' },
      { id: 'calendar', label: 'Calendario', icon: 'calendar' },
      { id: 'documents', label: 'Documentos', icon: 'file-text' }
    ];

    return (
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] shadow-sm" data-name="header" data-file="components/Header.js">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="icon-clock text-2xl text-[var(--primary-color)] mr-3"></div>
              <h1 className="text-xl font-bold text-gray-900">Control Horario</h1>
            </div>

            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-[var(--primary-color)] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={`icon-${item.icon} text-lg mr-2`}></div>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-right">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={AuthService.logout}
                className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="icon-log-out text-lg"></div>
              </button>
            </div>
          </div>

          <nav className="md:hidden border-t border-gray-200 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === item.id
                      ? 'bg-[var(--primary-color)] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={`icon-${item.icon} text-lg mr-2`}></div>
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}