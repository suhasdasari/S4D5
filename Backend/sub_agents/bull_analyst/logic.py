class Bull:
    def __init__(self):
        self.name = "Bull"

    def process(self, market_data):
        print(f"[{self.name}] Analyzing for bullish thesis...")
        # Simple logic: higher volume + bullish imbalance = high conviction
        base_conviction = 0.5
        if market_data.get("order_book_imbalance") == "bullish":
            base_conviction += 0.3
        if market_data.get("volume_24h", 0) > 10000000:
            base_conviction += 0.1
        
        return {
            "thesis": "Market structure shows strong support levels.",
            "conviction": min(base_conviction, 1.0)
        }
