import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix icon mac dinh cua Leaflet khi bundler khong tu tim thay anh marker.
// Dung anh da duoc Vite dong goi san (khong phu thuoc CDN unpkg.com luc runtime).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const HANOI_CENTER = [21.0285, 105.8542];

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function PinMap({ pins, onMapClick, pendingLatLng, onDelete, deletingId }) {
  return (
    <MapContainer center={HANOI_CENTER} zoom={13}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {pendingLatLng && (
        <Marker position={[pendingLatLng.lat, pendingLatLng.lng]}>
          <Popup>Vị trí pin mới (điền form bên cạnh)</Popup>
        </Marker>
      )}

      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]}>
          <Popup>
            <div className="pin-popup">
              <strong className="pin-popup__title">{pin.title}</strong>
              {pin.description && <p className="pin-popup__desc">{pin.description}</p>}
              {pin.photoUrl && (
                <img className="pin-popup__img" src={pin.photoUrl} alt={pin.title} />
              )}
              <button
                className="btn btn-danger"
                onClick={() => onDelete(pin.id)}
                disabled={deletingId === pin.id}
              >
                {deletingId === pin.id ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
