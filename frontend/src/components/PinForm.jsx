import { useState } from "react";

export default function PinForm({ latLng, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  if (!latLng) {
    return <p>Nhap chuot vao ban do de chon vi tri ghim pin moi.</p>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await onSubmit({ title, description, lat: latLng.lat, lng: latLng.lng, photo });
      // Chi xoa trang form sau khi tao pin THANH CONG - neu that bai, giu nguyen
      // du lieu da nhap de nguoi dung sua/gui lai thay vi phai go lai tu dau.
      setTitle("");
      setDescription("");
      setPhoto(null);
    } catch {
      // Loi da duoc hien thi o App.jsx (state error) - o day chi can khong reset form.
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        Vi tri: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
      </p>
      <div>
        <label>Ten dia diem</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={submitting}
        />
      </div>
      <div>
        <label>Mo ta</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </div>
      <div>
        <label>Anh</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setPhoto(e.target.files[0])}
          disabled={submitting}
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Dang luu..." : "Luu pin"}
      </button>
      <button type="button" onClick={onCancel} disabled={submitting}>
        Huy
      </button>
    </form>
  );
}
