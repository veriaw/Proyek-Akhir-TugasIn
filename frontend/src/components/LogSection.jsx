import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/utils";

const LogSection = ({ taskId }) => {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ description: "" });
  const [editingId, setEditingId] = useState(null);
  const [notif, setNotif] = useState("");

  const axiosJWT = useRef(
    axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
    })
  );

  useEffect(() => {
    const interceptor = axiosJWT.current.interceptors.request.use(
      async (config) => {
        const res = await axios.get(`${BASE_URL}/token`, {
          withCredentials: true,
        });
        const newToken = res.data.accessToken;
        config.headers.Authorization = `Bearer ${newToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    return () => {
      axiosJWT.current.interceptors.request.eject(interceptor);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axiosJWT.current.get(`/get-all-log?taskId=${taskId}`);
      setLogs(res.data);
    } catch (err) {
      console.error("❌ Gagal ambil log:", err);
    }
  };

  useEffect(() => {
    if (taskId) fetchLogs();
  }, [taskId]);

  const getGMTDateTimeString = () => {
    // Cukup gunakan waktu lokal, tidak perlu tambah 7 jam
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta', // WIB
      timeZoneName: 'short',
    }).format(new Date());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        description: form.description,
        date: getGMTDateTimeString(),
        taskId,
      };

      if (editingId) {
        await axiosJWT.current.post("/update-log", { ...payload, id: editingId });
        setNotif("Catatan berhasil diupdate!");
      } else {
        await axiosJWT.current.post("/add-log", payload);
        setNotif("Catatan berhasil ditambahkan!");
      }

      setForm({ description: "" });
      setEditingId(null);
      fetchLogs();
      setTimeout(() => setNotif(""), 2000);
    } catch (err) {
      console.error("❌ Gagal simpan log:", err);
    }
  };

  const handleEdit = (log) => {
    setForm({ description: log.description });
    setEditingId(log.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus log ini?")) return;
    try {
      await axiosJWT.current.delete(`/delete-log?id=${id}`);
      fetchLogs();
    } catch (err) {
      console.error("❌ Gagal hapus log:", err);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Catatan Aktivitas</h3>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4 flex-wrap">
        <input
          type="text"
          value={form.description}
          placeholder="Deskripsi aktivitas"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          className="border p-2 rounded flex-grow"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          {editingId ? "Update" : "Tambah"}
        </button>
      </form>

      {notif && (
        <div className="mb-2 px-4 py-2 bg-green-100 text-green-700 rounded">
          {notif}
        </div>
      )}

      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="bg-gray-100 p-3 rounded flex justify-between items-start">
            <div>
              <p className="font-medium">{log.description}</p>
              <p className="text-sm text-gray-600">Waktu: {log.logDate || log.date || "-"}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded"
                onClick={() => handleEdit(log)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => handleDelete(log.id)}
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LogSection;