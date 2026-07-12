import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// ====== إعدادات الـ API ======
const API_BASE_URL = "http://localhost:5000/api/v1";
const LOGIN_ENDPOINT = `${API_BASE_URL}/users/login_user`;

function Login() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    let valid = true;

    if (!code.trim()) {
      setCodeError('من فضلك أدخل الكود');
      valid = false;
    } else {
      setCodeError('');
    }

    if (!password) {
      setPasswordError('من فضلك أدخل كلمة المرور');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: '' });

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/v1/users/login_user", {
        code: code.trim(),
        password,
      });

      const token = response.data.token;

      if (!token) {
        setAlert({ message: 'حدث خطأ غير متوقع، حاول مرة أخرى', type: 'error' });
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      setAlert({ message: 'تم تسجيل الدخول بنجاح', type: 'success' });

      // TODO: التوجيه للصفحة الرئيسية بعد إنشائها
       navigate('/dashboard');

    } catch (err) {
      let message = 'تعذر الاتصال بالسيرفر، تأكد إن السيرفر شغال';

      if (err.response) {
        // السيرفر رد برسالة خطأ
        message = err.response.data?.message || err.response.data?.error || 'الكود أو كلمة المرور غير صحيحة';
      }

      setAlert({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center p-5 font-sans">
      <div className="bg-white w-full max-w-[400px] p-10 rounded-2xl shadow-lg">

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <img src="/logo.png" alt="" />
          </div>
          <h1 className="text-xl text-slate-800 font-bold">مكتب الشروق للعقارات</h1>
        </div>

        {alert.message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 border ${
              alert.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm text-slate-700 font-semibold mb-1.5">
              الكود
            </label>
            <input
              type="text"
              id="code"
              placeholder="أدخل الكود الخاص بك"
              autoComplete="username"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (codeError) setCodeError('');
              }}
              className={`w-full px-3.5 py-3 rounded-lg border text-[15px] outline-none transition-colors ${
                codeError ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
              }`}
            />
            {codeError && <div className="text-red-500 text-xs mt-1.5">{codeError}</div>}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm text-slate-700 font-semibold mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              className={`w-full px-3.5 py-3 rounded-lg border text-[15px] outline-none transition-colors ${
                passwordError ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
              }`}
            />
            {passwordError && <div className="text-red-500 text-xs mt-1.5">{passwordError}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 transition-colors"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
            )}
            <span>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
