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
  const [uploadedData, setUploadedData] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [users, setUsers] = useState(['john@example.com', 'sarah@example.com']);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [copiedRow, setCopiedRow] = useState(null);
  const [editingText, setEditingText] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [visibleRows, setVisibleRows] = useState({}); // Кількість видимих рядків для кожного CSV

  // Перевірка збереженої сесії при завантаженні
  React.useEffect(() => {
    const checkSession = async () => {
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
        
        // Завантажуємо файли користувача
        await fetchUserFiles(savedUserId);
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

  // Функція для завантаження файлів користувача
  const fetchUserFiles = async (userId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/File/getallfiles?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Response from server:', result);
        
        // Отримуємо масив файлів з поля data
        const files = result.data || [];
        console.log('Files array:', files);
        
        // Конвертуємо отримані файли в наш формат
        const formattedData = files.map(file => {
          let content;
          
          // Обробляємо різні типи файлів
          if (file.fileType?.toLowerCase() === 'image') {
            // Для зображень використовуємо base64 з data
            content = file.data ? `data:image/png;base64,${file.data}` : '';
          } else if (file.fileType?.toLowerCase() === 'csv') {
            // Для CSV парсимо дані
            if (file.data) {
              try {
                // Якщо data це base64, декодуємо
                const csvText = atob(file.data);
                const rows = csvText.split('\n').map(row => row.split(','));
                content = rows;
              } catch {
                // Якщо не base64, просто розбиваємо на рядки
                content = file.data.split('\n').map(row => row.split(','));
              }
            } else {
              content = [['No data']];
            }
          } else {
            // Для текстових файлів
            if (file.data) {
              try {
                content = atob(file.data); // Декодуємо base64
              } catch {
                content = file.data; // Якщо не base64, використовуємо як є
              }
            } else {
              content = 'No data';
            }
          }
          
          return {
            id: file.fileId,
            type: file.fileType?.toLowerCase() || 'text',
            filename: file.fileName || 'Unknown',
            uploader: localStorage.getItem('userEmail') || email || 'Unknown',
            date: file.uploadDate ? new Date(file.uploadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: file.notes || '',
            content: content
          };
        });
        
        console.log('Formatted data:', formattedData);
        setUploadedData(formattedData);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

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
          
          // Завантажуємо файли користувача
          await fetchUserFiles(data.userId);
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
        
        // Оновлюємо список файлів з сервера
        await fetchUserFiles(userData?.userId || localStorage.getItem('userId'));
        
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

  const handleFileDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/File/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Оновлюємо список файлів після видалення
        await fetchUserFiles(userData?.userId || localStorage.getItem('userId'));
        
        // Закриваємо розгорнуту картку якщо вона була видалена
        if (expandedCard === fileId) {
          setExpandedCard(null);
        }
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to delete file. Please try again.');
      }
    } catch (err) {
      setError('Network error. Failed to delete file.');
      console.error('File delete error:', err);
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-800">Your Files</h3>
              <button
                onClick={() => fetchUserFiles(userData?.userId || localStorage.getItem('userId'))}
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {console.log('Current uploadedData:', uploadedData)}
            {console.log('uploadedData.length:', uploadedData.length)}
            
            {uploadedData.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No files uploaded yet</p>
                <p className="text-xs text-gray-500 mt-2">Go to Add tab to upload your first file</p>
              </div>
            ) : (
              uploadedData.map((data) => (
                <div key={data.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer active:bg-gray-50 -m-3 p-3"
                        onClick={() => setExpandedCard(expandedCard === data.id ? null : data.id)}
                      >
                        <div className="text-xs text-gray-500 mb-1">
                          {data.filename} • {data.uploader} • {data.date}
                        </div>
                        {data.notes && (
                          <div className="text-xs text-gray-600 mt-1 italic">
                            📝 {data.notes}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(data.id);
                        }}
                        disabled={loading}
                        className="ml-2 text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {expandedCard === data.id && (
                  <div className="border-t border-gray-100 p-3">
                    {data.type === 'csv' && (
                      <div className="overflow-x-auto max-w-full -mx-3 px-3">
                        <div className="mb-2 text-xs text-gray-600">
                          Total rows: {data.content.length - 1} | Showing: {Math.min(visibleRows[data.id] || 50, data.content.length - 1)}
                        </div>
                        <table className="w-full text-sm min-w-max">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="w-6 p-2 sticky left-0 bg-white z-10"></th>
                              {data.content[0].map((header, idx) => (
                                <th key={idx} className="text-left p-2 font-semibold text-gray-700 whitespace-nowrap">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.content.slice(1, (visibleRows[data.id] || 50) + 1).map((row, rowIdx) => (
                              <tr 
                                key={rowIdx} 
                                className="border-b border-gray-100"
                              >
                                <td className="w-6 p-2 sticky left-0 bg-white z-10">
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
                        {(visibleRows[data.id] || 50) < data.content.length - 1 && (
                          <button
                            onClick={() => setVisibleRows({ 
                              ...visibleRows, 
                              [data.id]: Math.min((visibleRows[data.id] || 50) + 100, data.content.length - 1)
                            })}
                            className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Load More ({Math.min(100, data.content.length - 1 - (visibleRows[data.id] || 50))} rows)
                          </button>
                        )}
                        {(visibleRows[data.id] || 50) >= 100 && (
                          <button
                            onClick={() => setVisibleRows({ ...visibleRows, [data.id]: 50 })}
                            className="mt-2 w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                          >
                            Show Less (Reset to 50 rows)
                          </button>
                        )}
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
            ))
            )}
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