import { useState } from "react";

export default function PinForm({ latLng, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  if (!latLng) {
    return <p className="empty-hint">Nhấp chuột vào bản đồ để chọn vị trí ghim pin mới.</p>;
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
    <form className="pin-form" onSubmit={handleSubmit}>
      <p className="pin-form__location">
        📍 Vị trí: {latLng.lat.toFixed(5)}, {latLng.lng.toFixed(5)}
      </p>

      <div className="field">
        <label htmlFor="pin-title">Tên địa điểm</label>
        <input
          id="pin-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={submitting}
        />
      </div>

      <div className="field">
        <label htmlFor="pin-description">Mô tả</label>
        <textarea
          id="pin-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="field">
        <label htmlFor="pin-photo">Ảnh</label>
        <input
          id="pin-photo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setPhoto(e.target.files[0])}
          disabled={submitting}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Lưu pin"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Hủy
        </button>
      </div>
    </form>
  );
}
