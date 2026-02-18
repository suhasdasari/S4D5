class Bear:
    def __init__(self):
        self.name = "Bear"

    def process(self, market_data):
        print(f"[{self.name}] Analyzing for bearish thesis...")
        # Simple logic: higher vol + bearish imbalance = high doubt
        base_doubt = 0.3
        if market_data.get("order_book_imbalance") == "bearish":
            base_doubt += 0.4
        if market_data.get("price_volatility") == "High":
            base_doubt += 0.2
            
        return {
            "thesis": "Volatility suggests potential downside breakout.",
            "doubt": min(base_doubt, 1.0)
        }
