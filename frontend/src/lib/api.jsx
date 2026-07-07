import axios from "axios";

// عدّل الـ baseURL حسب عنوان الباك اند بتاعك وقت التشغيل الفعلي
const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
});

// إرفاق التوكن تلقائيًا مع كل request لو المستخدم مسجل دخول
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// لو التوكن انتهت صلاحيته، ارجع لصفحة تسجيل الدخول
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
