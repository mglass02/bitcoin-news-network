document.addEventListener("DOMContentLoaded", function () {
    const priceElement = document.getElementById("btc-price");

    // Binance WebSocket for BTC/USDT price updates
    const socket = new WebSocket("wss://stream.binance.com/ws/btcusdt@trade");

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        const price = Math.round(parseFloat(data.p)).toLocaleString("en-US"); // Remove decimals

        // Update price and add pulse effect
        priceElement.textContent = `$${price}`;
        priceElement.classList.add("pulse");

        // Remove pulse effect after animation
        setTimeout(() => priceElement.classList.remove("pulse"), 1000);
    };
});

