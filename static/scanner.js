function startScanner() {
    const container = document.getElementById("scanner-container");
    const videoElement = document.getElementById("scanner");

    // Show the scanner container
    container.style.display = "block";

    console.log("🟡 Attempting to start Quagga scanner...");

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        alert("⚠️ Your browser does not support camera access via getUserMedia.");
        console.error("❌ navigator.mediaDevices.getUserMedia is not available.");
        return;
    }

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,
            constraints: {
                facingMode: "environment" // Use rear camera on mobile
            }
        },
        locator: {
            patchSize: "medium",
            halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
            readers: [
                "ean_reader",         // EAN-8
                "ean_13_reader",      // EAN-13
                "code_128_reader"     // Code 128
            ]
        },
        locate: true
    }, function (err) {
        if (err) {
            console.error("🔴 Quagga.init error:", err);
            alert("⚠️ Failed to start the scanner. Please allow camera access and try again.");
            container.style.display = "none";
            return;
        }

        console.log("🟢 Quagga started successfully.");
        Quagga.start();
    });

    // Avoid multiple triggers
    let scanHandled = false;

    Quagga.onDetected((data) => {
        if (scanHandled) return;

        const code = data.codeResult.code;
        console.log("✅ Barcode detected:", code);

        // Auto-fill input and stop scanner
        document.getElementById("barcode").value = code;
        scanHandled = true;

        Quagga.stop();
        container.style.display = "none";
        Quagga.offDetected(); // Remove handler to avoid memory leaks
    });
}
