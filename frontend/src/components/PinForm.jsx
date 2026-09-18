import { useState } from "react";

export default function PinForm({ latLng, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  if (!latLng) {
    return <p>Nhap chuot vao ban do de chon vi tri ghim pin moi.</p>;
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ title, description, lat: latLng.lat, lng: latLng.lng, photo });
    setTitle("");
    setDescription("");
    setPhoto(null);
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        Vi tri: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
      </p>
      <div>
        <label>Ten dia diem</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label>Mo ta</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Anh</label>
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
      </div>
      <button type="submit">Luu pin</button>
      <button type="button" onClick={onCancel}>
        Huy
      </button>
    </form>
  );
}
