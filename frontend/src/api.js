// Khi build Docker image, VITE_API_URL duoc truyen qua build-arg (xem frontend/Dockerfile).
// Khi chay `vite dev` truc tiep (khong Docker), mac dinh tro ve backend local port 4000.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function listPins() {
  const res = await fetch(`${API_URL}/pins`);
  if (!res.ok) throw new Error("Khong tai duoc danh sach pin");
  return res.json();
}

export async function createPin({ title, description, lat, lng, photo }) {
  const form = new FormData();
  form.append("title", title);
  form.append("description", description);
  form.append("lat", lat);
  form.append("lng", lng);
  if (photo) form.append("photo", photo);

  const res = await fetch(`${API_URL}/pins`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Tao pin that bai");
  return res.json();
}

export async function deletePin(id) {
  const res = await fetch(`${API_URL}/pins/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xoa pin that bai");
}
