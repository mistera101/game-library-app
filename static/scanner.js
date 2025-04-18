function startScanner() {
    const container = document.getElementById("scanner-container");
    const statusText = document.getElementById("scan-status");
    const barcodeInput = document.getElementById("barcode");

    // Show the scanner container
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
            target: "#scanner", // Must match ID of video element
            constraints: {
                facingMode: "environment" // Use back-facing camera
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        decoder: {
            readers: [
                "ean_reader",
                "ean_13_reader",
                "code_128_reader"
            ]
        },
        locate: true
    }, function(err) {
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

        // Confirm if a stream is really attached
        setTimeout(() => {
            try {
                const activeTrack = Quagga.cameraAccess.getActiveTrack();
                console.log("🎥 Active camera track:", activeTrack);
                if (!activeTrack) {
                    console.warn("⚠️ Camera stream did not attach.");
                    if (statusText) statusText.innerText = "⚠️ Camera started but no video detected.";
                }
            } catch (e) {
                console.warn("⚠️ Could not check active camera track:", e);
            }
        }, 1000);
    });

    // Only handle first detection
    let scanHandled = false;

    Quagga.onDetected((result) => {
        if (scanHandled) return;

        const code = result.codeResult.code;
        console.log("📦 Barcode detected:", code);
        scanHandled = true;

        barcodeInput.value = code;
        if (statusText) statusText.innerText = "✅ Barcode scanned: " + code;

        Quagga.stop();
        Quagga.offDetected();
        container.style.display = "none";
    });
}
