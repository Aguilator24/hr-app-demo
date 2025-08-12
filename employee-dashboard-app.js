class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Algo salió mal</h1>
            <p className="text-gray-600 mb-4">Lo sentimos, ocurrió un error inesperado.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function EmployeeDashboard() {
  try {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      if (!AuthService.requireAuth()) return;
      
      const user = AuthService.getCurrentUser();
      if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
        return;
      }
      
      setCurrentUser(user);
      setLoading(false);
    }, []);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="icon-loader-2 text-2xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      );
    }

    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <StatsCards user={currentUser} />;
        case 'time-entry':
          return <TimeEntryForm user={currentUser} />;
        case 'vacation':
          return <VacationRequestForm user={currentUser} />;
        case 'calendar':
          return <Calendar user={currentUser} />;
        case 'documents':
          return <Documents user={currentUser} />;
        default:
          return <StatsCards user={currentUser} />;
      }
    };

    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]" data-name="employee-dashboard" data-file="employee-dashboard-app.js">
        <Header user={currentUser} activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    );
  } catch (error) {
    console.error('EmployeeDashboard component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <EmployeeDashboard />
  </ErrorBoundary>
);