import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function SecretCalculator({ onLogin }) {
  const [display, setDisplay] = useState('0');
  const [secretMode, setSecretMode] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [zeroCount, setZeroCount] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [flashing, setFlashing] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [sendingCode, setSendingCode] = useState(false);

  const handleButtonClick = async (value) => {
    // Лічильник нулів для комбінації
    if (value === '0') {
      setZeroCount(prev => prev + 1);
      if (zeroCount + 1 === 4) {
        if (codeMode) {
          // Вхід в систему з кодом
          setFlashing(true);
          setTimeout(() => {
            onLogin(email, code);
            setFlashing(false);
          }, 300);
          return;
        } else if (secretMode && email.trim()) {
          // Відправка запиту на код перед переходом до режиму вводу коду
          setFlashing(true);
          try {
            const response = await fetch(
              `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/logincoderequest?email=${encodeURIComponent(email)}`,
              { method: 'POST' }
            );
            
            if (response.ok) {
              // Перехід до режиму вводу коду
              setSecretMode(false);
              setCodeMode(true);
              setDisplay('');
              setZeroCount(0);
            } else {
              alert('Failed to send verification code');
            }
          } catch (error) {
            console.error('Error sending code:', error);
            alert('Error sending verification code');
          } finally {
            setFlashing(false);
          }
          return;
        } else if (!secretMode && !codeMode) {
          // Вхід в режим email
          setSecretMode(true);
          setDisplay('');
          setZeroCount(0);
          return;
        }
      }
    } else {
      setZeroCount(0);
    }

    // Режим введення email
    if (secretMode) return;

    // Режим введення коду
    if (codeMode) {
      if (value === 'C') {
        setCode('');
        setDisplay('0');
      } else if (value === '←') {
        setCode(prev => prev.slice(0, -1));
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      } else if (/[0-9]/.test(value)) {
        setCode(prev => prev + value);
        setDisplay(prev => prev === '0' ? value : prev + value);
      }
      return;
    }

    // Звичайний калькулятор
    if (value === 'C') {
      setDisplay('0');
      setZeroCount(0);
    } else if (value === '=') {
      try {
        const result = eval(display);
        setDisplay(String(result));
      } catch {
        setDisplay('Error');
      }
    } else if (value === '←') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setDisplay(prev => prev === '0' ? value : prev + value);
    }
  };

  const handleEmailKeyDown = async (e) => {
    if (e.key === 'Enter' && email.trim()) {
      setFlashing(true);
      try {
        const response = await fetch(
          `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/logincoderequest?email=${encodeURIComponent(email)}`,
          { method: 'POST' }
        );
        
        if (response.ok) {
          setSecretMode(false);
          setCodeMode(true);
          setDisplay('');
        } else {
          alert('Failed to send verification code');
        }
      } catch (error) {
        console.error('Error sending code:', error);
        alert('Error sending verification code');
      } finally {
        setFlashing(false);
      }
    }
  };

  const resendCode = async () => {
    setSendingCode(true);
    try {
      const response = await fetch(
        `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/logincoderequest?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        alert('Code sent to your email!');
      } else {
        alert('Failed to send code');
      }
    } catch (error) {
      console.error('Error sending code:', error);
      alert('Error sending code');
    } finally {
      setSendingCode(false);
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-gray-100 via-blue-50 to-gray-200'
    }`}>
      <div className="w-full max-w-md">
        <div className={`rounded-3xl shadow-2xl p-6 border transition-colors duration-500 ${
          isDark
            ? 'bg-gray-900 border-gray-700'
            : 'bg-white border-gray-300'
        }`}>
          {/* Display Screen */}
          <div className={`rounded-2xl p-6 mb-6 min-h-[100px] flex items-center justify-end shadow-inner border-2 transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-green-900 to-green-950 border-green-800'
              : 'bg-gradient-to-br from-green-100 to-green-200 border-green-300'
          } ${flashing ? 'animate-pulse brightness-150' : ''}`}>
            {secretMode ? (
              <div className="w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="Enter email..."
                  autoFocus
                  className={`w-full bg-transparent text-xl font-mono outline-none ${
                    isDark
                      ? 'text-green-400 placeholder-green-700'
                      : 'text-green-800 placeholder-green-400'
                  }`}
                />
              </div>
            ) : codeMode ? (
              <div className="w-full">
                <div className={`text-sm mb-2 text-center ${isDark ? 'text-green-600' : 'text-green-700'}`}>
                  Enter code for: {email}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    setCode(pastedText);
                  }}
                  placeholder="Paste or enter code"
                  autoFocus
                  className={`w-full bg-transparent text-4xl font-mono font-light text-center outline-none ${
                    isDark ? 'text-green-400 placeholder-green-700' : 'text-green-800 placeholder-green-400'
                  }`}
                />
              </div>
            ) : (
              <div className={`text-4xl font-mono font-light break-all text-right ${
                isDark ? 'text-green-400' : 'text-green-800'
              }`}>
                {display}
              </div>
            )}
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handleButtonClick(btn)}
                className={`
                  h-16 rounded-xl font-semibold text-xl
                  transition-all duration-200 active:scale-95
                  ${btn === '=' 
                    ? isDark
                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg shadow-green-900/50 hover:from-green-500 hover:to-green-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:from-green-400 hover:to-green-500'
                    : btn === 'C'
                    ? isDark
                      ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50 hover:from-red-500 hover:to-red-600'
                      : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:from-red-400 hover:to-red-500'
                    : ['+', '-', '*', '/'].includes(btn)
                    ? isDark
                      ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-green-400 shadow-lg hover:from-gray-600 hover:to-gray-700'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-400 hover:to-blue-500'
                    : isDark
                      ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 shadow-lg hover:from-gray-700 hover:to-gray-800'
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 shadow-md hover:from-gray-300 hover:to-gray-400'
                  }
                `}
              >
                {btn === '←' ? '⌫' : btn}
              </button>
            ))}
          </div>

          {/* Backspace and Theme Toggle */}
          <div className="flex gap-3 mt-3">
            {secretMode ? (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (email.trim()) {
                    setFlashing(true);
                    try {
                      const response = await fetch(
                        `https://acaciamanagement-cec3bwdvf0dtc5cu.centralus-01.azurewebsites.net/api/User/logincoderequest?email=${encodeURIComponent(email)}`,
                        { method: 'POST' }
                      );
                      
                      if (response.ok) {
                        setSecretMode(false);
                        setCodeMode(true);
                        setDisplay('');
                      } else {
                        alert('Failed to send verification code');
                      }
                    } catch (error) {
                      console.error('Error sending code:', error);
                      alert('Error sending verification code');
                    } finally {
                      setFlashing(false);
                    }
                  }
                }}
                disabled={!email.trim()}
                className={`flex-1 h-12 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                  isDark
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500'
                }`}
              >
                Send Code
              </button>
            ) : codeMode ? (
              <>
                <button
                  onClick={resendCode}
                  disabled={sendingCode}
                  className={`flex-1 h-12 rounded-xl font-semibold text-sm shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                    isDark
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500'
                  }`}
                >
                  {sendingCode ? 'Sending...' : 'Resend Code'}
                </button>
                <button
                  onClick={async () => {
                    if (code.trim()) {
                      setFlashing(true);
                      setTimeout(() => {
                        onLogin(email, code);
                        setFlashing(false);
                      }, 300);
                    }
                  }}
                  className={`flex-1 h-12 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 active:scale-95 ${
                    isDark
                      ? 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600'
                      : 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500'
                  }`}
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={() => handleButtonClick('←')}
                className={`flex-1 h-12 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 active:scale-95 ${
                  isDark
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 hover:from-gray-400 hover:to-gray-500'
                }`}
              >
                Delete
              </button>
            )}
            
            <button
              onClick={() => setIsDark(!isDark)}
              className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 ${
                isDark
                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-yellow-400 hover:from-gray-600 hover:to-gray-700'
                  : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 hover:from-gray-400 hover:to-gray-500'
              }`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
