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
    <MapContainer center={HANOI_CENTER} zoom={13} style={{ height: "70vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {pendingLatLng && (
        <Marker position={[pendingLatLng.lat, pendingLatLng.lng]}>
          <Popup>Vi tri pin moi (dien form ben canh)</Popup>
        </Marker>
      )}

      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]}>
          <Popup>
            <strong>{pin.title}</strong>
            <p>{pin.description}</p>
            {pin.photoUrl && (
              <img src={pin.photoUrl} alt={pin.title} style={{ maxWidth: 200 }} />
            )}
            <br />
            <button onClick={() => onDelete(pin.id)} disabled={deletingId === pin.id}>
              {deletingId === pin.id ? "Dang xoa..." : "Xoa"}
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
