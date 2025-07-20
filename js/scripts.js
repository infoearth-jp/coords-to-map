let mode = "2D";
let drawnLayer;

// 地図の初期化
const map = L.map('map').setView([35.6895, 139.6917], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function switchTab(selectedMode) {
    mode = selectedMode;
    document.getElementById("tab2D").classList.toggle("active", mode === "2D");
    document.getElementById("tab3D").classList.toggle("active", mode === "3D");
    // プレースホルダーを変更
    document.getElementById("coordsInput").placeholder = mode === "2D" 
        ? "[ [lon,lat], [lon,lat], [lon,lat] ]" 
        : "[ [lon,lat,alt], [lon,lat,alt], [lon,lat,alt] ]";
    
    document.getElementById("coordsInput").value = "";
}

function drawShape() {
    const input = document.getElementById("coordsInput").value.trim();
    if (!input) return alert("座標を入力してください！");

    try {
        let coordArray;

        // 📌 JSONとして正しくパースする（そのまま or 手動で配列化）
        if (input.startsWith("[") && input.endsWith("]")) {
            coordArray = JSON.parse(input);
        } else {
            return alert("⚠️ JSON形式で入力してください！例: [139.7,35.6],[139.8,35.7] ");
        }

        // 📌 データが正しく配列になっているかチェック
        if (!Array.isArray(coordArray) || coordArray.length === 0) {
            return alert("⚠️ 座標データが空です！");
        }

        let coords = [];
        if (mode === "2D") {
            if (!coordArray.every(point => Array.isArray(point) && point.length === 2 && point.every(num => typeof num === "number"))) {
                return alert("⚠️ 2D座標は [lon, lat] のペアで入力してください！");
            }
            coords = coordArray.map(point => [point[1], point[0]]); // [lon, lat] → [lat, lon]
        } else { // 3Dモード
            if (!coordArray.every(point => Array.isArray(point) && point.length === 3 && point.every(num => typeof num === "number"))) {
                return alert("⚠️ 3D座標は [lon, lat, alt] のセットで入力してください！");
            }
            coords = coordArray.map(point => [point[1], point[0]]); // [lon, lat, alt] → [lat, lon]
        }

        if (coords.length < 2) return alert(" 2点以上の座標を入力してください！");

        // 🔄 既存の図形を削除
        if (drawnLayer) map.removeLayer(drawnLayer);

        // 🟢 ポリゴン or 🔵 ラインを判定して描画
        if (JSON.stringify(coords[0]) === JSON.stringify(coords[coords.length - 1])) {
            drawnLayer = L.polygon(coords, { color: "#ff1493" }).addTo(map);
        } else {
            drawnLayer = L.polyline(coords, { color: "#007bff" }).addTo(map);
        }

        // 🗺️ 表示範囲を自動調整
        map.fitBounds(drawnLayer.getBounds());

    } catch (e) {
        alert("⚠️ JSON形式が不正です！エラー内容：" + e.message);
    }
}