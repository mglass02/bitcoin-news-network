document.addEventListener("DOMContentLoaded", function () {
        // Fetch the 24h price data from Binance API
        async function fetch24hPriceData() {
            try {
                // Fetch 24h data from Binance API
                const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
                const data = await response.json();

                const currentPrice = parseFloat(data.last); // Current price
                const price24hAgo = parseFloat(data.prevClosePrice); // Price 24h ago
                const priceChangePercent = parseFloat(data.priceChangePercent); // 24h change percentage

                // Update current price
                const priceElement = document.getElementById("btc-price");
                priceElement.textContent = `$${currentPrice.toLocaleString("en-US")}`;

                // Update 24h change
                const changeElement = document.getElementById("btc-change");
                changeElement.textContent = `${priceChangePercent}%`;

                // Style the change based on positive or negative
                if (priceChangePercent > 0) {
                    changeElement.style.color = "#4CAF50"; // Green for positive change
                } else {
                    changeElement.style.color = "#F44336"; // Red for negative change
                }

            } catch (error) {
                console.error('Error fetching 24h data:', error);
            }
        }

        // Fetch the 24h price data when the page loads
        fetch24hPriceData();

        // WebSocket for real-time Bitcoin price updates
        const socket = new WebSocket("wss://stream.binance.com/ws/btcusdt@trade");

        socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            const price = Math.round(parseFloat(data.p)).toLocaleString("en-US");

            // Update the real-time price
            const priceElement = document.getElementById("btc-price");
            priceElement.textContent = `$${price}`;

            // Optionally add a "pulse" effect to the price update
            priceElement.classList.add("pulse");

            // Remove pulse effect after animation
            setTimeout(() => priceElement.classList.remove("pulse"), 1000);
        };
});

