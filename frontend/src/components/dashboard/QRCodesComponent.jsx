import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  X,
  Save,
  BarChart3
} from 'lucide-react';
import apiService from '../../lib/api';

const QRCodesComponent = ({ resID }) => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQR, setEditingQR] = useState(null);
  const [qrDetails, setQrDetails] = useState({});
  const [previewQR, setPreviewQR] = useState(null);

  const [newQR, setNewQR] = useState({
    type: '',
    description: ''
  });

  useEffect(() => {
    fetchQRCodes();
  }, [resID]);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQRCodes(resID);
      // Backend returns { success, data: [...], totalCodes }
      const list = response?.data?.data ?? response?.data ?? [];
      setQrCodes(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createQRCode = async () => {
    try {
      if (!newQR.type || !newQR.description) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await apiService.createQRCode(resID, newQR);
      // Map backend field qrCodeImage -> qrCodeData for UI consistency
      const createdPayload = response?.data || {};
      const created = {
        qrID: createdPayload.qrID,
        resID: createdPayload.resID ?? resID,
        type: createdPayload.type ?? newQR.type,
        description: createdPayload.description ?? newQR.description,
        qrCodeData: createdPayload.qrCodeImage || createdPayload.qrCodeData,
        // New items should be live by default for immediate verification
        isActive: true,
        // Include menu URL for quick testing/opening
        menuURL: createdPayload.menuURL || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/menu/${resID}/${createdPayload.qrID}`,
        createdAt: createdPayload.createdAt || new Date().toISOString(),
      };
      // Prepend so it appears at the top immediately
      setQrCodes(prev => [created, ...prev]);
      resetForm();
      setShowAddModal(false);
      // Auto open preview so owner can verify quickly
      setPreviewQR(created);
    } catch (err) {
      console.error('Error creating QR code:', err);
      alert('Failed to create QR code: ' + err.message);
    }
  };

  const updateQRCode = async () => {
    try {
      if (!editingQR.type || !editingQR.description) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await apiService.updateQRCode(resID, editingQR.qrID, {
        type: editingQR.type,
        description: editingQR.description
      });
      
      setQrCodes(prev =>
        prev.map(qr =>
          qr.qrID === editingQR.qrID ? response.data : qr
        )
      );
      setEditingQR(null);
    } catch (err) {
      console.error('Error updating QR code:', err);
      alert('Failed to update QR code: ' + err.message);
    }
  };

  const toggleQRStatus = async (qrID) => {
    try {
      await apiService.toggleQRCodeStatus(resID, qrID);
      setQrCodes(prev =>
        prev.map(qr =>
          qr.qrID === qrID ? { ...qr, isActive: !qr.isActive } : qr
        )
      );
    } catch (err) {
      console.error('Error toggling QR status:', err);
      alert('Failed to update QR status: ' + err.message);
    }
  };

  const deleteQRCode = async (qrID) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    try {
      await apiService.deleteQRCode(resID, qrID);
      setQrCodes(prev => prev.filter(qr => qr.qrID !== qrID));
    } catch (err) {
      console.error('Error deleting QR code:', err);
      alert('Failed to delete QR code: ' + err.message);
    }
  };

  const regenerateQRCode = async (qrID) => {
    try {
      const response = await apiService.regenerateQRCode(resID, qrID);
      const image = response?.data?.data?.qrCodeImage || response?.data?.qrCodeImage;
      if (image) {
        setQrCodes(prev =>
          prev.map(qr => (qr.qrID === qrID ? { ...qr, qrCodeData: image } : qr))
        );
      }
    } catch (err) {
      console.error('Error regenerating QR code:', err);
      alert('Failed to regenerate QR code: ' + err.message);
    }
  };

  const fetchQRDetails = async (qrID) => {
    try {
      const response = await apiService.getQRCodeDetails(resID, qrID);
      setQrDetails(prev => ({ ...prev, [qrID]: response.data }));
    } catch (err) {
      console.error('Error fetching QR details:', err);
    }
  };

  const downloadQRCode = (qrCode) => {
    if (qrCode.qrCodeData) {
      // If we have base64 image data (branded QR code)
      const link = document.createElement('a');
      link.href = qrCode.qrCodeData;
      link.download = `qruzine-qr-${qrCode.type.replace(/\s+/g, '-').toLowerCase()}-${qrCode.qrID}.png`;
      link.click();
    } else {
      // Fallback: create a simple text file with QR info
      const qrContent = `
QR Code: ${qrCode.qrID}
Type: ${qrCode.type}
Description: ${qrCode.description}
Menu URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/menu/${resID}/${qrCode.qrID}


      `;
      
      const blob = new Blob([qrContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qruzine-qr-${qrCode.qrID}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadQRCodePDF = async (qrCode) => {
    try {
      const blob = await apiService.downloadQRCodePDF(resID, qrCode.qrID);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qruzine-qr-${qrCode.type.replace(/\s+/g, '-').toLowerCase()}-${qrCode.qrID}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading QR PDF:', err);
      alert('Failed to download QR as PDF: ' + err.message);
    }
  };

  const resetForm = () => {
    setNewQR({
      type: '',
      description: ''
    });
  };

  if (loading && qrCodes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">QR Code Management</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchQRCodes}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Generate QR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <div key={qr.qrID} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{qr.type}</h3>
                  <p className="text-sm text-gray-600">{qr.description}</p>
                  <p className="text-xs text-gray-500">ID: {qr.qrID}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleQRStatus(qr.qrID)}
                    className={`p-1 rounded ${(qr.isActive ?? true) ? 'text-green-600' : 'text-gray-400'}`}
                    title={(qr.isActive ?? true) ? 'Active' : 'Inactive'}
                  >
                    {(qr.isActive ?? true) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => fetchQRDetails(qr.qrID)}
                    className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                    title="View Details"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <span className={`inline-block px-2 py-1 rounded-full text-xs mb-4 ${
                (qr.isActive ?? true)
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {(qr.isActive ?? true) ? 'Active' : 'Inactive'}
              </span>
              
              {/* QR Code Display */}
              <div className="bg-gray-50 border border-gray-200 h-40 rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-100"
                   onClick={() => qr.qrCodeData && setPreviewQR(qr)}
                   title="Click to preview large, scannable QR">
                {qr.qrCodeData ? (
                  <img 
                    src={qr.qrCodeData} 
                    alt={`QR Code for ${qr.type}`}
                    className="h-36 w-36 object-contain"
                  />
                ) : (
                  <QrCode className="h-16 w-16 text-gray-400" />
                )}
              </div>

              {/* Statistics */}
              {qrDetails[qr.qrID] && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Scans:</span>
                      <span className="ml-1 font-medium">{qrDetails[qr.qrID].statistics?.scanCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Orders:</span>
                      <span className="ml-1 font-medium">{qrDetails[qr.qrID].statistics?.totalOrders || 0}</span>
                    </div>
                  </div>
                  {qrDetails[qr.qrID].statistics?.lastScanned && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last scanned: {new Date(qrDetails[qr.qrID].statistics.lastScanned).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadQRCodePDF(qr)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => downloadQRCode(qr)}
                  className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  title="Download PNG"
                >
                  PNG
                </button>
                
                <button
                  onClick={() => setEditingQR(qr)}
                  className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => regenerateQRCode(qr.qrID)}
                  className="px-3 py-2 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                  title="Regenerate QR Code"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteQRCode(qr.qrID)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add QR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Generate QR Code</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="QR Type (e.g., Table 1, Room 101) *"
                value={newQR.type}
                onChange={(e) => setNewQR({...newQR, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description *"
                value={newQR.description}
                onChange={(e) => setNewQR({...newQR, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              <p className="text-sm text-gray-600">
                This will create a beautifully branded QR code with your restaurant name that links customers to your menu.
              </p>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={createQRCode}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Generate QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit QR Modal */}
      {editingQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit QR Code</h3>
              <button
                onClick={() => setEditingQR(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QR ID</label>
                <input
                  type="text"
                  value={editingQR.qrID}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>
              
              <input
                type="text"
                placeholder="QR Type *"
                value={editingQR.type}
                onChange={(e) => setEditingQR({...editingQR, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description *"
                value={editingQR.description}
                onChange={(e) => setEditingQR({...editingQR, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingQR(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={updateQRCode}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Update QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Test Modal */}
      {previewQR && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preview QR - {previewQR.type}</h3>
              <button onClick={() => setPreviewQR(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              {previewQR.qrCodeData ? (
                <img
                  src={previewQR.qrCodeData}
                  alt={`QR for ${previewQR.type}`}
                  className="w-72 h-72 object-contain bg-white border border-gray-200 rounded-md"
                />
              ) : (
                <div className="w-72 h-72 flex items-center justify-center bg-gray-100 rounded-md">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="mt-4 w-full">
                <p className="text-sm text-gray-600 mb-2">Scan with your phone or open the menu link to verify it is live:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={previewQR.menuURL || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/menu/${resID}/${previewQR.qrID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Open Menu
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        const url = previewQR.menuURL || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/menu/${resID}/${previewQR.qrID}`;
                        await navigator.clipboard.writeText(url);
                        alert('Menu link copied to clipboard');
                      } catch (e) {
                        alert('Failed to copy link');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Copy Link
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">
                  {previewQR.menuURL || `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/menu/${resID}/${previewQR.qrID}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodesComponent;
