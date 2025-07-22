let mode = "2D";
let drawnLayer;
let map;

function initMap(){
    // 地図の初期化
    map = L.map('map').setView([35.6895, 139.6917], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function switchTab(selectedMode) {
    mode = selectedMode;
    document.getElementById("tab2D").classList.toggle("active", mode === "2D");
    document.getElementById("tab3D").classList.toggle("active", mode === "3D");
    document.getElementById("tabGeoJSON").classList.toggle("active", mode === "GeoJSON");
    // プレースホルダーを変更
    if (mode === "2D") {
        document.getElementById("coordsInput").placeholder = "[ [lon,lat], [lon,lat], [lon,lat] ]";
    } else if (mode === "3D") {
        document.getElementById("coordsInput").placeholder = "[ [lon,lat,alt], [lon,lat,alt], [lon,lat,alt] ]";
    } else {
        document.getElementById("coordsInput").placeholder = "GeoJSON形式で入力してください";
    }
    
    document.getElementById("coordsInput").value = "";
}

function drawShape() {
    if (mode === "2D") {
        drawShapeFrom2dCoods();
    } else if (mode === "3D") {
        drawShapeFrom3dCoods();
    } else {
        drawShapeFromGeojson();
    }
}

function drawShapeFromGeojson(){
    const tmpInput = document.getElementById("coordsInput").value.trim();
    let input = sanitizeGeojson(tmpInput);
    // "type": "Feature"なら"type": "FeatureCollection"に変換
    input.replace(/"type":\s*"Feature"/g, '"type": "FeatureCollection"');
    // "properties":{}なら"properties": {"color": "#ff1493"}に変換
    input = input.replace(/"properties":\{\}/g, '"properties": {"color": "#ff1493"}');
    if (!input) return alert("座標を入力してください！");

    try {
        let geojsonData = JSON.parse(input);
        if (!geojsonData) {
            return alert("⚠️ 有効なGeoJSONデータを入力してください！");
        }

        if (!geojsonData.features && geojsonData.geometry) {
            // GeoJSONが単一のジオメトリの場合、FeatureCollectionに変換
            geojsonData = {
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    geometry: geojsonData.geometry,
                    properties: geojsonData.properties || { color: "#ff1493" }
                }]
            };
        }

        // 🔄 既存の図形を削除
        if (drawnLayer) map.removeLayer(drawnLayer);

        // 🗺️ GeoJSONを地図に追加
        drawnLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                return { color: feature.properties.color || "#007bff" };
            }
        }).addTo(map);

        // 🗺️ 表示範囲を自動調整
        map.fitBounds(drawnLayer.getBounds());

    } catch (e) {
        alert("⚠️ GeoJSON形式が不正です！エラー内容：" + e.message);
    }
}

function drawShapeFrom2dCoods(){
    const tmpInput = document.getElementById("coordsInput").value.trim();
    const input = sanitizeLonLat(tmpInput);
    if (!input) return alert("座標を入力してください！");
    try {
        let coordArray = JSON.parse(input);
        if (!Array.isArray(coordArray) || coordArray.length === 0) {
            return alert("⚠️ 座標データが空です！");
        }

        let coords = [];
        if (coordArray.every(point => Array.isArray(point) && point.length === 2 && point.every(num => typeof num === "number"))) {
            coords = coordArray.map(point => [point[1], point[0]]); // [lon, lat] → [lat, lon]
        } else {
            return alert("⚠️ 2D座標は [lon, lat] のペアで入力してください！");
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

function drawShapeFrom3dCoods(){
    const tmpInput = document.getElementById("coordsInput").value.trim();
    const input = sanitizeLonLat(tmpInput);
    if (!input) return alert("座標を入力してください！");
    try {
        let coordArray = JSON.parse(input);
        if (!Array.isArray(coordArray) || coordArray.length === 0) {
            return alert("⚠️ 座標データが空です！");
        }

        let coords = [];
        if (coordArray.every(point => Array.isArray(point) && point.length === 3 && point.every(num => typeof num === "number"))) {
            coords = coordArray.map(point => [point[1], point[0]]); // [lon, lat, alt] → [lat, lon]
        } else {
            return alert("⚠️ 3D座標は [lon, lat, alt] のセットで入力してください！");
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

function sanitizeLonLat(lonlat){
    const pattern = /[^[.,0-9\]]/g;
    return lonlat.replaceAll(pattern, "");
}

function sanitizeGeojson(geojson){
    // allow only valid GeoJSON characters
    // This regex allows alphabet, numbers, spaces, commas, brackets, and dots
    const pattern = /[^a-zA-Z0-9\{\}\"\'\[\]\:\#\,\.\s]/g;
    return geojson.replaceAll(pattern, "");
    // return geojson;
}
