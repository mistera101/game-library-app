let scannerInstance;

function startScanner() {
    const scannerContainer = document.getElementById("scanner-container");
    const statusText = document.getElementById("scan-status");
    const barcodeInput = document.getElementById("barcode");

    scannerContainer.style.display = "block";
    statusText.textContent = "📸 Initializing camera...";

    if (scannerInstance) {
        scannerInstance.stop().then(() => {
            scannerInstance.clear();
        });
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
            });
        },
        (errorMessage) => {
            // Suppress frequent errors
        }
    ).catch(err => {
        console.error("🚫 Camera error:", err);
        statusText.textContent = "❌ Camera error: " + err;
    });
}
