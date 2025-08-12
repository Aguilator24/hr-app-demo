function DocumentManagement({ user }) {
  try {
    const [employees, setEmployees] = React.useState([]);
    const [selectedEmployee, setSelectedEmployee] = React.useState('');
    const [documents, setDocuments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showUploadForm, setShowUploadForm] = React.useState(false);
    const [uploadForm, setUploadForm] = React.useState({
      document_type: 'payroll',
      file_name: '',
      file_url: '',
      month_year: '',
      folder: ''
    });
    const [folders, setFolders] = React.useState([]);
    const [selectedFolder, setSelectedFolder] = React.useState('');
    const [newFolderName, setNewFolderName] = React.useState('');
    const [showNewFolder, setShowNewFolder] = React.useState(false);

    React.useEffect(() => {
      loadEmployees();
    }, []);

    React.useEffect(() => {
      if (selectedEmployee) {
        loadDocuments(selectedEmployee);
      }
    }, [selectedEmployee, selectedFolder]);

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

    const loadDocuments = async (employeeId) => {
      try {
        const result = await trickleListObjects(`document:${employeeId}`, 100, true);
        const docs = result.items;
        
        // Extraer carpetas únicas
        const uniqueFolders = [...new Set(docs.map(doc => doc.objectData.folder).filter(Boolean))];
        setFolders(uniqueFolders);
        
        // Filtrar por carpeta seleccionada
        const filteredDocs = selectedFolder 
          ? docs.filter(doc => doc.objectData.folder === selectedFolder)
          : docs.filter(doc => !doc.objectData.folder);
          
        setDocuments(filteredDocs);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    const createFolder = async () => {
      if (!newFolderName.trim()) return;
      
      // Crear documento dummy para crear la carpeta
      try {
        await trickleCreateObject(`document:${selectedEmployee}`, {
          user_id: selectedEmployee,
          document_type: 'folder',
          file_name: '.folder',
          file_url: '',
          folder: newFolderName.trim(),
          upload_date: new Date().toISOString(),
          uploaded_by: user.id
        });
        
        setNewFolderName('');
        setShowNewFolder(false);
        loadDocuments(selectedEmployee);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Simular subida de archivo generando URL
        const fileUrl = URL.createObjectURL(file);
        setUploadForm({
          ...uploadForm,
          file_name: file.name,
          file_url: fileUrl
        });
      }
    };

    const handleUpload = async (e) => {
      e.preventDefault();
      try {
        await trickleCreateObject(`document:${selectedEmployee}`, {
          user_id: selectedEmployee,
          document_type: uploadForm.document_type,
          file_name: uploadForm.file_name,
          file_url: uploadForm.file_url,
          month_year: uploadForm.month_year,
          folder: uploadForm.folder,
          upload_date: new Date().toISOString(),
          uploaded_by: user.id
        });

        setUploadForm({
          document_type: 'payroll',
          file_name: '',
          file_url: '',
          month_year: '',
          folder: ''
        });
        setShowUploadForm(false);
        loadDocuments(selectedEmployee);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    };

    const handleDelete = async (docId) => {
      if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
        try {
          await trickleDeleteObject(`document:${selectedEmployee}`, docId);
          alert('Documento eliminado correctamente');
          loadDocuments(selectedEmployee);
        } catch (error) {
          console.error('Error deleting document:', error);
          alert('Error al eliminar el documento');
        }
      }
    };

    const getDocumentTypeText = (type) => {
      switch (type) {
        case 'payroll': return 'Nómina';
        case 'contract': return 'Contrato';
        default: return 'Otro';
      }
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
      <div data-name="document-management" data-file="components/DocumentManagement.js">
        <h2 className="text-2xl font-bold mb-6">Gestión de Documentos</h2>
        
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium mb-1">Empleado:</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="input-field max-w-xs"
                >
                  {employees.map((employee) => (
                    <option key={employee.objectId} value={employee.objectId}>
                      {employee.objectData.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carpeta:</label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="input-field max-w-xs"
                >
                  <option value="">Raíz</option>
                  {folders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewFolder(!showNewFolder)}
                className="btn-secondary"
              >
                <div className="icon-folder-plus text-lg mr-2"></div>
                Nueva Carpeta
              </button>
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="btn-primary"
              >
                <div className="icon-upload text-lg mr-2"></div>
                Subir Documento
              </button>
            </div>
          </div>

          {showNewFolder && (
            <div className="border-t pt-4 mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nombre de la carpeta"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="input-field flex-1"
                />
                <button onClick={createFolder} className="btn-primary">Crear</button>
                <button onClick={() => setShowNewFolder(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          )}

          {showUploadForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Subir Nuevo Documento</h3>
              <form onSubmit={handleUpload} className="grid grid-cols-2 gap-4">
                <select
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm({...uploadForm, document_type: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="payroll">Nómina</option>
                  <option value="contract">Contrato</option>
                  <option value="other">Otro</option>
                </select>
                <select
                  value={uploadForm.folder}
                  onChange={(e) => setUploadForm({...uploadForm, folder: e.target.value})}
                  className="input-field"
                >
                  <option value="">Sin carpeta</option>
                  {folders.map((folder) => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleFileUpload}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Nombre del archivo"
                  value={uploadForm.file_name}
                  onChange={(e) => setUploadForm({...uploadForm, file_name: e.target.value})}
                  className="input-field"
                  required
                />
                {uploadForm.document_type === 'payroll' && (
                  <input
                    type="text"
                    placeholder="Mes-Año (MM-YYYY)"
                    value={uploadForm.month_year}
                    onChange={(e) => setUploadForm({...uploadForm, month_year: e.target.value})}
                    className="input-field"
                    pattern="[0-1][0-9]-[0-9]{4}"
                  />
                )}
                <div className="col-span-2 flex space-x-2">
                  <button type="submit" className="btn-primary">Subir</button>
                  <button type="button" onClick={() => setShowUploadForm(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            Documentos de {selectedEmployeeData?.objectData.name}
          </h3>
          <div className="space-y-4">
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay documentos para este empleado
              </p>
            ) : (
              documents.map((doc) => (
                <div key={doc.objectId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getDocumentTypeText(doc.objectData.document_type)}
                        </span>
                        {doc.objectData.month_year && (
                          <span className="text-sm text-gray-600">
                            {doc.objectData.month_year}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {doc.objectData.file_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Subido: {new Date(doc.objectData.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.objectData.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm"
                      >
                        <div className="icon-external-link text-sm"></div>
                      </a>
                      <button
                        onClick={() => handleDelete(doc.objectId)}
                        className="btn-danger text-sm"
                      >
                        <div className="icon-trash text-sm"></div>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('DocumentManagement component error:', error);
    return null;
  }
}