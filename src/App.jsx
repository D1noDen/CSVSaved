import React, { useState, useRef } from 'react';
import { Upload, Mail, Settings, LogOut, Plus, BookOpen, Calendar, User, Copy, Check } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef(null);
  const [uploadedData, setUploadedData] = useState([
    { 
      id: 1, 
      type: 'csv',
      filename: 'sales_data.csv',
      uploader: 'john@example.com', 
      date: '2025-10-08',
      content: [
        ['Product', 'Sales', 'Region'],
        ['Widget A', '1500', 'North'],
        ['Widget B', '2300', 'South'],
        ['Gadget X', '890', 'East'],
        ['Gadget Y', '1750', 'West']
      ]
    },
    { 
      id: 2, 
      type: 'text',
      filename: 'meeting_notes.txt',
      uploader: 'sarah@example.com', 
      date: '2025-10-05',
      content: 'Team meeting notes:\n\n- Discussed Q4 roadmap\n- Approved new feature proposals\n- Set deadline for sprint planning\n- Review scheduled for next week\n\nAction items:\n1. Update documentation\n2. Schedule design review\n3. Prepare demo for stakeholders'
    },
    { 
      id: 3, 
      type: 'image',
      filename: 'chart.png',
      uploader: 'mike@example.com', 
      date: '2025-10-03',
      content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxyZWN0IHg9IjUwIiB5PSIyMDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzM2ODhlZiIvPjxyZWN0IHg9IjEzMCIgeT0iMTUwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTMwIiBmaWxsPSIjMzY4OGVmIi8+PHJlY3QgeD0iMjEwIiB5PSIxMDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMzNjg4ZWYiLz48cmVjdCB4PSIyOTAiIHk9IjcwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjEwIiBmaWxsPSIjMzY4OGVmIi8+PHRleHQgeD0iMjAwIiB5PSIzMCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzFmMjkzNyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPlNhbGVzIEdyb3d0aCBDaGFydDwvdGV4dD48L3N2Zz4='
    }
  ]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [users, setUsers] = useState(['john@example.com', 'sarah@example.com']);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [copiedRow, setCopiedRow] = useState(null);
  const [editingText, setEditingText] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Перевірка збереженої сесії при завантаженні
  React.useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('authToken');
      const savedUserId = localStorage.getItem('userId');
      const savedEmail = localStorage.getItem('userEmail');
      
      if (token && savedUserId && savedEmail) {
        setUserData({ 
          userId: savedUserId, 
          token: token 
        });
        setEmail(savedEmail);
        setScreen('main');
      }
    };
    
    checkSession();
  }, []);

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogin = async () => {
    if (email) {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/logincoderequest?email=${encodeURIComponent(email)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (response.ok) {
          setScreen('code');
        } else {
          const errorData = await response.text();
          setError(errorData || 'Failed to send code. Please try again.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
        console.error('Login error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCodeSubmit = async () => {
    if (code.length >= 4) {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/login?email=${email}&code=${code}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Зберігаємо токен і дані користувача
          if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', email);
            setUserData(data);
          }
          setScreen('main');
          setActiveTab('add');
        } else {
          const errorData = await response.text();
          setError(errorData || 'Invalid code. Please try again.');
        }
      } catch (err) {
        setError('Network error. Please check your connection.');
        console.error('Code verification error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setUserData(null);
    setScreen('login');
    setEmail('');
    setCode('');
    setActiveTab('add');
    setError('');
  };

  // Функція для API запитів з автоматичною авторизацією
  // Приклад використання:
  // const response = await fetchWithAuth('https://api.../endpoint', { method: 'POST', body: JSON.stringify(data) });
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Якщо токен недійсний - виходимо з аккаунта
    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      // Визначаємо тип файлу
      let fileType = 'Text';
      if (selectedFile.type.startsWith('image/')) {
        fileType = 'Image';
      } else if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
        fileType = 'CSV';
      }

      // Створюємо FormData
      const formData = new FormData();
      formData.append('File', selectedFile);
      formData.append('FileType', fileType);
      formData.append('Notes', notes); // Використовуємо notes з поля Paste Text
      formData.append('UploadedById', userData?.userId || localStorage.getItem('userId'));

      // Відправляємо на API
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/File/upload',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Додаємо файл до локального списку
        const newData = {
          id: result.id || uploadedData.length + 1,
          type: fileType.toLowerCase(),
          filename: selectedFile.name,
          uploader: email,
          date: new Date().toISOString().split('T')[0],
          content: fileType === 'Image' 
            ? URL.createObjectURL(selectedFile)
            : [['Column 1', 'Column 2', 'Column 3'], ['Data 1', 'Data 2', 'Data 3']]
        };
        
        setUploadedData([newData, ...uploadedData]);
        
        // Очищаємо вибраний файл та input
        setSelectedFile(null);
        setNotes(''); // Очищаємо notes
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to upload file. Please try again.');
      }
    } catch (err) {
      setError('Network error. Failed to upload file.');
      console.error('File upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = () => {
    if (newUserEmail && !users.includes(newUserEmail)) {
      setUsers([...users, newUserEmail]);
      setNewUserEmail('');
    }
  };

  const removeUser = (userEmail) => {
    setUsers(users.filter(u => u !== userEmail));
  };

  const copyRow = (dataId, rowIndex) => {
    const data = uploadedData.find(d => d.id === dataId);
    if (data.type === 'csv') {
      const rowText = data.content[rowIndex].join('\t');
      navigator.clipboard.writeText(rowText);
    } else if (data.type === 'text') {
      navigator.clipboard.writeText(data.content);
    } else if (data.type === 'image') {
      navigator.clipboard.writeText(data.filename);
    }
    setCopiedRow(`${dataId}-${rowIndex}`);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const handleCellEdit = (dataId, rowIdx, cellIdx, newValue) => {
    setUploadedData(uploadedData.map(d => {
      if (d.id === dataId) {
        const newContent = [...d.content];
        newContent[rowIdx][cellIdx] = newValue;
        return { ...d, content: newContent };
      }
      return d;
    }));
  };

  const handleLongPressStart = (dataId, rowIdx, cellIdx) => {
    const timer = setTimeout(() => {
      setEditingCell(`${dataId}-${rowIdx}-${cellIdx}`);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install this app:\n\niOS: Tap Share button, then "Add to Home Screen"\n\nAndroid: Tap menu (⋮) and select "Install app" or "Add to Home Screen"');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleTextEdit = (dataId, newContent) => {
    setUploadedData(uploadedData.map(d => 
      d.id === dataId ? { ...d, content: newContent } : d
    ));
  };

  const handleEmailKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleCodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCodeSubmit();
    }
  };

  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">myknowledge</h1>
          </div>
          <p className="text-center text-gray-600 mb-6">Enter your email to continue</p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleEmailKeyPress}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 disabled:bg-gray-100"
              placeholder="you@example.com"
            />
            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">myknowledge</h1>
          </div>
          <p className="text-center text-gray-600 mb-6">Code sent to {email}</p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleCodeKeyPress}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest mb-4 disabled:bg-gray-100"
              placeholder="000000"
            />
            <button
              onClick={handleCodeSubmit}
              disabled={loading || code.length < 4}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 pb-20">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('add')}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  activeTab === 'add'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                Add
              </button>
              <button
                onClick={() => setActiveTab('view')}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  activeTab === 'view'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                View
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-600"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="px-4 py-4">
        {activeTab === 'add' && (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
                Uploading...
              </div>
            )}
            
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Upload File</h3>
              
              {selectedFile && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-600 text-xs font-medium hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <label className={`cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-blue-600 font-medium">
                    {selectedFile ? 'Choose another file' : 'Tap to upload'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,image/*"
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">CSV, text or image files</p>
              </div>
              
              {selectedFile && (
                <button
                  onClick={handleFileUpload}
                  disabled={loading}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              )}
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm disabled:bg-gray-100"
                placeholder="Add notes for your file (optional)..."
              />
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="space-y-3">
            {uploadedData.map((data) => (
              <div key={data.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                <div
                  className="p-3 cursor-pointer active:bg-gray-50"
                  onClick={() => setExpandedCard(expandedCard === data.id ? null : data.id)}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {data.filename} • {data.uploader} • {data.date}
                  </div>
                </div>
                
                {expandedCard === data.id && (
                  <div className="border-t border-gray-100 p-3">
                    {data.type === 'csv' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="w-6 p-2"></th>
                              {data.content[0].map((header, idx) => (
                                <th key={idx} className="text-left p-2 font-semibold text-gray-700 whitespace-nowrap">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.content.slice(1).map((row, rowIdx) => (
                              <tr 
                                key={rowIdx} 
                                className="border-b border-gray-100"
                              >
                                <td className="w-6 p-2">
                                  {copiedRow === `${data.id}-${rowIdx + 1}` && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                </td>
                                {row.map((cell, cellIdx) => {
                                  const cellKey =` ${data.id}-${rowIdx + 1}-${cellIdx}`;
                                  const isEditing = editingCell === cellKey;
                                  
                                  return (
                                    <td 
                                      key={cellIdx} 
                                      className="p-2 whitespace-nowrap"
                                    >
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={cell}
                                          onChange={(e) => handleCellEdit(data.id, rowIdx + 1, cellIdx, e.target.value)}
                                          onBlur={() => setEditingCell(null)}
                                          autoFocus
                                          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                      ) : (
                                        <div
                                          onClick={() => copyRow(data.id, rowIdx + 1)}
                                          onTouchStart={() => handleLongPressStart(data.id, rowIdx + 1, cellIdx)}
                                          onTouchEnd={handleLongPressEnd}
                                          onMouseDown={() => handleLongPressStart(data.id, rowIdx + 1, cellIdx)}
                                          onMouseUp={handleLongPressEnd}
                                          onMouseLeave={handleLongPressEnd}
                                          className="cursor-pointer active:bg-blue-50 rounded px-1 -mx-1"
                                        >
                                          {cell}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="text-xs text-gray-500 mt-2 px-2">
                          Tap to copy row • Long press cell to edit
                        </div>
                      </div>
                    )}

                    {data.type === 'text' && (
                      <div>
                        <textarea
                          value={editingText[data.id] !== undefined ? editingText[data.id] : data.content}
                          onChange={(e) => setEditingText({ ...editingText, [data.id]: e.target.value })}
                          onBlur={() => {
                            if (editingText[data.id] !== undefined) {
                              handleTextEdit(data.id, editingText[data.id]);
                            }
                          }}
                          onClick={() => copyRow(data.id, 0)}
                          className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono whitespace-pre-wrap"
                        />
                        {copiedRow === `${data.id}-0` && (
                          <div className="flex items-center text-green-600 text-sm mt-2">
                            <Check className="w-4 h-4 mr-1" />
                            Copied
                          </div>
                        )}
                      </div>
                    )}

                    {data.type === 'image' && (
                      <div 
                        className="cursor-pointer active:opacity-75"
                        onClick={() => copyRow(data.id, 0)}
                      >
                        <img 
                          src={data.content} 
                          alt={data.filename}
                          className="w-full rounded-lg"
                        />
                        {copiedRow === `${data.id}-0` && (
                          <div className="flex items-center justify-center text-green-600 text-sm mt-2">
                            <Check className="w-4 h-4 mr-1" />
                            Filename copied
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <button 
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                {showInstallButton ? 'Install on Phone' : 'Install Instructions'}
              </button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Add myknowledge to your home screen
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Add User</h3>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="user@example.com"
                />
                <button
                  onClick={addUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Users</h3>
              <div className="space-y-2">
                {users.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-800">{user}</span>
                    </div>
                    <button
                      onClick={() => removeUser(user)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}