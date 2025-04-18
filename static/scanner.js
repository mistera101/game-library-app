let html5QrcodeScanner;

function startScanner() {
    const scannerContainer = document.getElementById("scanner-container");
    const statusText = document.getElementById("scan-status");
    const barcodeInput = document.getElementById("barcode");

    scannerContainer.style.display = "block";
    statusText.innerText = "📸 Initializing camera...";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        statusText.innerText = "❌ Camera not supported by your browser.";
        alert("⚠️ Sorry, your browser doesn't support camera access.");
        return;
    }

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.7778,
        facingMode: "environment"
    };

    html5QrcodeScanner = new Html5Qrcode("reader");

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
            console.log("✅ Barcode Scanned:", decodedText);
            barcodeInput.value = decodedText;
            statusText.innerText = `✅ Scanned: ${decodedText}`;

            html5QrcodeScanner.stop().then(() => {
                document.getElementById("scanner-container").style.display = "none";
                console.log("🛑 Scanner stopped.");
            }).catch(err => {
                console.error("Failed to stop scanner:", err);
            });
        },
        (errorMessage) => {
            console.warn("📭 No barcode detected:", errorMessage);
        }
    ).catch(err => {
        console.error("🚫 Scanner failed to start:", err);
        statusText.innerText = "❌ Scanner failed to start.";
    });
}
