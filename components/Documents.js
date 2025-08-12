function Documents({ user }) {
  try {
    const [documents, setDocuments] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      loadDocuments();
    }, []);

    const loadDocuments = async () => {
      try {
        const result = await trickleListObjects(`document:${user.id}`, 100, true);
        setDocuments(result.items);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };

    const getDocumentTypeText = (type) => {
      switch (type) {
        case 'payroll': return 'Nómina';
        case 'contract': return 'Contrato';
        default: return 'Otro';
      }
    };

    const getDocumentTypeColor = (type) => {
      switch (type) {
        case 'payroll': return 'bg-green-100 text-green-800';
        case 'contract': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    if (loading) {
      return (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div data-name="documents" data-file="components/Documents.js">
        <h2 className="text-2xl font-bold mb-6">Mis Documentos</h2>
        
        <div className="card">
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="icon-file-text text-4xl text-gray-300 mb-4"></div>
                <p className="text-gray-500">No tienes documentos disponibles</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.objectId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocumentTypeColor(doc.objectData.document_type)}`}>
                          {getDocumentTypeText(doc.objectData.document_type)}
                        </span>
                        {doc.objectData.month_year && (
                          <span className="text-sm text-gray-600">
                            {doc.objectData.month_year}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        {doc.objectData.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Subido: {new Date(doc.objectData.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.objectData.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm"
                      >
                        <div className="icon-download text-sm mr-1"></div>
                        Descargar
                      </a>
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
    console.error('Documents component error:', error);
    return null;
  }
}