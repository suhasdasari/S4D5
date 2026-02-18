import random

class Researcher:
    def __init__(self):
        self.name = "Researcher"

    def fetch_the_graph_data(self, asset):
        # Mocking The Graph API call
        print(f"[{self.name}] Fetching historical data for {asset} from The Graph...")
        return {
            "volume_24h": random.uniform(1000000, 50000000),
            "price_volatility": "High" if random.random() > 0.5 else "Medium"
        }

    def fetch_quicknode_data(self, asset):
        # Mocking QuickNode JSON-RPC call
        print(f"[{self.name}] Fetching live data for {asset} from QuickNode...")
        return {
            "current_price": random.uniform(1500, 3500),
            "order_book_imbalance": random.choice(["bullish", "bearish", "neutral"])
        }

    def process(self, task):
        asset = task.get("asset", "ETH")
        graph_data = self.fetch_the_graph_data(asset)
        live_data = self.fetch_quicknode_data(asset)
        
        risk_assessment = "High Liquidity Risk" if graph_data["price_volatility"] == "High" and random.random() > 0.7 else "Stable"

        return {
            "market_data": {**graph_data, **live_data},
            "risk_assessment": risk_assessment
        }
