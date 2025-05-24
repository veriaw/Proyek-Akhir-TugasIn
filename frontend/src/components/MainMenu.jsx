import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { BASE_URL } from '../utils/utils';
import { FaBars, FaUserCircle, FaSignOutAlt, FaPlus, FaUserEdit } from 'react-icons/fa';

const MainMenu = () => {
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [user, setUser] = useState({ username: '', gender: '', birthDate: '', picture: ''});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  const axiosJWT = useRef(
    axios.create({ baseURL: BASE_URL, withCredentials: true })
  );

  // Set up Axios interceptor
  useEffect(() => {
    const interceptor = axiosJWT.current.interceptors.request.use(
      async (config) => {
        const now = new Date().getTime();
        if (expire && expire * 1000 < now) {
          const response = await axios.get(`${BASE_URL}/token`, { withCredentials: true });
          const newToken = response.data.accessToken;
          config.headers.Authorization = `Bearer ${newToken}`;
          setToken(newToken);
          const decoded = jwtDecode(newToken);
          setExpire(decoded.exp);
          setUser({
            username: decoded.username,
            gender: decoded.gender,
            birthDate: decoded.birthDate,
            picture: decoded.picture
          });
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        setToken("");
        navigate("/");
        return Promise.reject(error);
      }
    );
    return () => {
      axiosJWT.current.interceptors.request.eject(interceptor);
    };
  }, [expire, token, navigate]);

  // Refresh token saat mount
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/token`, { withCredentials: true });
        const accessToken = response.data.accessToken;
        setToken(accessToken);
        const decoded = jwtDecode(accessToken);
        setExpire(decoded.exp);
        setUser({
          username: decoded.username,
          gender: decoded.gender,
          birthDate: decoded.birthDate,
          picture: decoded.picture
        });
      } catch {
        navigate("/");
      }
    };
    refreshToken();
  }, [navigate]);

  // Fetch tasks hanya jika token sudah tersedia
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
    // eslint-disable-next-lines
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axiosJWT.current.get("/get-all-task");
      setTasks(res.data);
    } catch (error) {
      console.error("❌ Error saat ambil tugas:", error);
    }
  };

  const Logout = async () => {
    await axios.delete(`${BASE_URL}/logout`, { withCredentials: true });
    navigate("/");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus tugas ini?")) return;
    try {
      await axiosJWT.current.delete(`/delete-task?id=${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Gagal menghapus tugas:", error);
      alert("Gagal menghapus tugas");
    }
  };

  const handleEdit = (task) => {
    navigate('/task', { state: { task } });
  };

  // Menuju detail tugas
  const handleDetail = (task) => {
    navigate('/task-detail', { state: { task } });
  };

  // Menuju edit profile
  const handleEditProfile = () => {
    navigate('/edit-profile', { state: { user } });
    setSidebarOpen(false);
  };

  // Sapaan sesuai gender
  const getSalutation = () => {
    if (user.gender?.toLowerCase() === "male" || user.gender?.toLowerCase() === "laki-laki") {
      return `Mr. ${user.username}`;
    } else if (user.gender?.toLowerCase() === "female" || user.gender?.toLowerCase() === "perempuan") {
      return `Mrs. ${user.username}`;
    } else {
      return user.username || "-";
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Hamburger Button */}
      <button
        className="fixed top-4 left-4 z-50 text-3xl text-black bg-white rounded-md p-2 shadow"
        onClick={() => setSidebarOpen(true)}
      >
        <FaBars />
      </button>

      {/* Sidebar Drawer */}
      {sidebarOpen && (
        <div>
          <div className="fixed top-0 left-0 z-50 h-full w-64 bg-blue-800 text-white p-6 shadow-lg transition-transform duration-300">
            <button
              className="absolute top-4 right-4 text-2xl text-white"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Tugasin</h2>
            <div className="flex flex-col items-center gap-2 mb-6">
            <img
                src={user.picture||'https://st4.depositphotos.com/4329009/19956/v/450/depositphotos_199564354-stock-illustration-creative-vector-illustration-default-avatar.jpg'}
                alt="Preview"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://st4.depositphotos.com/4329009/19956/v/450/depositphotos_199564354-stock-illustration-creative-vector-illustration-default-avatar.jpg';
                }}
                className="mt-2 w-32 h-32 object-cover rounded-full"
              />
              <p className="font-semibold text-lg">Profile</p>
              <p>Nama: {user.username || '-'}</p>
              <p>Gender: {user.gender || '-'}</p>
              <p>Tanggal Lahir: {user.birthDate || '-'}</p>
            </div>
            <button
              onClick={handleEditProfile}
              className="flex items-center gap-2 text-white font-semibold hover:text-yellow-300 mb-4"
            >
              <FaUserEdit /> Edit Profile
            </button>
            <button onClick={Logout} className="flex items-center gap-2 text-white font-semibold hover:text-red-300">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`p-6 w-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-64' : ''}`}
        style={{ minHeight: '100vh' }}
      >
        <h1 className="text-3xl font-bold mb-4">Welcome! {getSalutation()}</h1>
        <h2 className="text-xl font-semibold mb-4">Tugas Anda</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => {
            let cardColor = "bg-gray-200";
            if (task.status === "In Progress") cardColor = "bg-yellow-200";
            else if (task.status === "Done") cardColor = "bg-green-200";
            else if (task.status === "To Do") cardColor = "bg-gray-200";
            return (
              <div
                key={index}
                onClick={() => handleDetail(task)}
                className={`${cardColor} p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition`}
              >
                <h3 className="font-bold text-lg mb-1">{task.title}</h3>
                <p className="text-sm text-gray-700">{task.description}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {task.status}</p>
                <p className="text-xs text-gray-500">Mulai: {task.startDate} | Deadline: {task.endDate}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(task); }} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Hapus</button>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => navigate('/task')}
            className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2"
          >
            <FaPlus /> Tambah Tugas
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;