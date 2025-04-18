function startScanner() {
    const container = document.getElementById("scanner-container");
    const videoElement = document.getElementById("scanner");
    const statusText = document.getElementById("scan-status");

    // Make sure it's visible
    container.style.display = "block";

    if (statusText) {
        statusText.innerText = "📸 Attempting to open camera...";
    }

    console.log("🟡 Attempting to start Quagga scanner...");

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        alert("⚠️ Your browser does not support camera access.");
        console.error("❌ navigator.mediaDevices.getUserMedia is not available.");
        if (statusText) statusText.innerText = "❌ Camera not supported on this browser.";
        return;
    }

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,
            constraints: {
                facingMode: "environment"
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
            readers: [
                "ean_reader",
                "ean_13_reader",
                "code_128_reader"
            ]
        },
        locate: true
    }, function (err) {
        if (err) {
            console.error("🔴 Quagga.init error:", err);
            alert("⚠️ Failed to start the scanner. Please allow camera access.");
            container.style.display = "none";
            if (statusText) statusText.innerText = "❌ Failed to start camera.";
            return;
        }

        console.log("🟢 Quagga started successfully.");
        if (statusText) statusText.innerText = "✅ Camera active. Point it at a barcode.";
        Quagga.start();
    });

    // Avoid multiple detections
    let scanHandled = false;

    Quagga.onDetected((data) => {
        if (scanHandled) return;

        const code = data.codeResult.code;
        console.log("✅ Detected barcode:", code);

        document.getElementById("barcode").value = code;
        scanHandled = true;

        Quagga.stop();
        if (statusText) statusText.innerText = "✅ Scanned successfully!";
        container.style.display = "none";
        Quagga.offDetected();
    });
}
