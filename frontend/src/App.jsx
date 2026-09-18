import { useEffect, useState } from "react";
import PinMap from "./components/PinMap.jsx";
import PinForm from "./components/PinForm.jsx";
import { listPins, createPin, deletePin } from "./api.js";

export default function App() {
  const [pins, setPins] = useState([]);
  const [pendingLatLng, setPendingLatLng] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function refresh() {
    try {
      setPins(await listPins());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(values) {
    setCreating(true);
    try {
      await createPin(values);
      setPendingLatLng(null);
      setError(null);
      await refresh();
    } catch (err) {
      setError(err.message);
      throw err; // de PinForm biet tao pin that bai va giu nguyen du lieu da nhap
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (deletingId) return; // tranh bam xoa nhieu lan chong cheo
    setDeletingId(id);
    try {
      await deletePin(id);
      setError(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header__logo" aria-hidden="true">📍</span>
        <div>
          <h1 className="app-header__title">PinsLocal</h1>
          <p className="app-header__subtitle">Ghim địa điểm yêu thích kèm ảnh</p>
        </div>
      </header>

      {error && <p className="error-banner">{error}</p>}

      <div className="app-body">
        <div className="map-panel">
          <PinMap
            pins={pins}
            pendingLatLng={pendingLatLng}
            onMapClick={setPendingLatLng}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
        <div className="sidebar-panel">
          <div className="sidebar-card">
            <h2>Thêm pin mới</h2>
            <PinForm
              latLng={pendingLatLng}
              onSubmit={handleCreate}
              onCancel={() => setPendingLatLng(null)}
              submitting={creating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
