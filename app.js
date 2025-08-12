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
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  try {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    }, []);

    const handleLogin = (userData) => {
      setUser(userData);
      if (userData.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'employee-dashboard.html';
      }
    };

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="icon-loader-2 text-2xl text-[var(--primary-color)] animate-spin mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" data-name="app" data-file="app.js">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="icon-clock text-4xl text-[var(--primary-color)] mb-4"></div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Control Horario</h1>
              <p className="text-gray-600">Sistema de gestión de tiempo y vacaciones</p>
            </div>
            <LoginForm onLogin={handleLogin} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);