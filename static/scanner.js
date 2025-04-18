function startScanner() {
    const container = document.getElementById("scanner-container");
    const videoElement = document.getElementById("scanner");
    const statusText = document.getElementById("scan-status");
    const barcodeInput = document.getElementById("barcode");

    container.style.display = "block";
    if (statusText) statusText.innerText = "📸 Initializing camera...";

    console.log("🔄 Quagga scanner setup starting...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ getUserMedia not available.");
        alert("❌ This browser does not support camera access.");
        if (statusText) statusText.innerText = "❌ Camera access not supported.";
        return;
    }

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,  // ✅ FIX: use actual DOM element
            constraints: {
                facingMode: "environment"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        decoder: {
            readers: ["ean_reader", "ean_13_reader", "code_128_reader"]
        },
        locate: true,
        debug: true  // 🔍 Optional: can remove later
    }, function (err) {
        if (err) {
            console.error("🚫 Quagga.init error:", err);
            alert("⚠️ Failed to access the camera. " + err.message);
            if (statusText) statusText.innerText = "❌ Camera error: " + err.message;
            container.style.display = "none";
            return;
        }

        console.log("✅ Quagga initialized successfully.");
        if (statusText) statusText.innerText = "✅ Camera is active. Scan a barcode.";
        Quagga.start();

        setTimeout(() => {
            try {
                const track = Quagga.cameraAccess.getActiveTrack();
                console.log("🎥 Camera active:", track);
                if (!track) {
                    console.warn("⚠️ No active camera stream detected.");
                    if (statusText) statusText.innerText = "⚠️ No video stream found.";
                }
            } catch (e) {
                console.warn("⚠️ Could not verify active track:", e);
            }
        }, 1000);
    });

    let scanHandled = false;

    Quagga.onDetected(function (result) {
        if (scanHandled) return;

        const code = result.codeResult.code;
        console.log("📦 Barcode detected:", code);
        barcodeInput.value = code;
        if (statusText) statusText.innerText = "✅ Scanned: " + code;

        scanHandled = true;
        Quagga.stop();
        Quagga.offDetected();
        container.style.display = "none";
    });
}
