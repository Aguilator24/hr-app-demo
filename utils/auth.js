const AuthService = {
  async login(email, password) {
    try {
      const users = await trickleListObjects('user', 100, true);
      const user = users.items.find(u => 
        u.objectData.email === email && u.objectData.password === password
      );

      if (!user) {
        throw new Error('Credenciales incorrectas');
      }

      const userData = {
        id: user.objectId,
        email: user.objectData.email,
        name: user.objectData.name,
        role: user.objectData.role,
        department: user.objectData.department,
        vacation_days: user.objectData.vacation_days,
        hire_date: user.objectData.hire_date
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw new Error('Error al iniciar sesión: ' + error.message);
    }
  },

  logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
  },

  getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = 'employee-dashboard.html';
      return false;
    }
    return true;
  }
};