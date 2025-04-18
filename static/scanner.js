let scannerInstance;

function startScanner() {
    const scannerContainer = document.getElementById("scanner-container");
    const statusText = document.getElementById("scan-status");
    const barcodeInput = document.getElementById("barcode");

    // Make scanner visible
    scannerContainer.style.display = "block";
    statusText.textContent = "📸 Initializing camera...";

    // Stop any previous scanner instance before starting new
    if (scannerInstance) {
        scannerInstance.stop()
            .then(() => scannerInstance.clear())
            .catch(e => console.warn("Scanner cleanup issue:", e));
    }

    scannerInstance = new Html5Qrcode("reader");

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
    };

    scannerInstance.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
            console.log("✅ Barcode detected:", decodedText);
            barcodeInput.value = decodedText;
            statusText.textContent = "✅ Barcode scanned: " + decodedText;

            scannerInstance.stop().then(() => {
                scannerContainer.style.display = "none";
                return scannerInstance.clear();
            }).catch(e => console.warn("Stop error:", e));
        },
        (errorMessage) => {
            // Optional: log only meaningful scan errors
            if (errorMessage && !errorMessage.includes("No barcode found")) {
                console.warn("🔍 Scan error:", errorMessage);
            }
        }
    ).catch(err => {
        console.error("🚫 Failed to start camera:", err);
        statusText.textContent = "❌ Camera error: " + err;
    });
}
