import { useEffect, useState } from "react";
import PinMap from "./components/PinMap.jsx";
import PinForm from "./components/PinForm.jsx";
import { listPins, createPin, deletePin } from "./api.js";

export default function App() {
  const [pins, setPins] = useState([]);
  const [pendingLatLng, setPendingLatLng] = useState(null);
  const [error, setError] = useState(null);

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
    try {
      await createPin(values);
      setPendingLatLng(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deletePin(id);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ flex: 3 }}>
        <h1 style={{ padding: "0 1rem" }}>PinsLocal</h1>
        {error && <p style={{ color: "red", padding: "0 1rem" }}>{error}</p>}
        <PinMap
          pins={pins}
          pendingLatLng={pendingLatLng}
          onMapClick={setPendingLatLng}
          onDelete={handleDelete}
        />
      </div>
      <div style={{ flex: 1, padding: "1rem", borderLeft: "1px solid #ddd" }}>
        <h2>Them pin moi</h2>
        <PinForm
          latLng={pendingLatLng}
          onSubmit={handleCreate}
          onCancel={() => setPendingLatLng(null)}
        />
      </div>
    </div>
  );
}
