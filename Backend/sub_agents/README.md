# S4D5 Data Exchange Protocol

This document defines how Sub-Agents communicate.

## Protocol

1.  **Researcher -> Analysts (Bull/Bear)**
    - **Format**: JSON
    - **Schema**:
        ```json
        {
          "market_data": {
            "volume_24h": "float",
            "price_volatility": "High|Medium|Low",
            "current_price": "float",
            "order_book_imbalance": "bullish|bearish|neutral"
          },
          "risk_assessment": "string"
        }
        ```

2.  **Analysts -> Judge/Orchestrator**
    - **Format**: JSON
    - **Schema (Bull)**:
        ```json
        {
          "thesis": "string",
          "conviction": "float (0.0 - 1.0)"
        }
        ```
    - **Schema (Bear)**:
        ```json
        {
          "thesis": "string",
          "doubt": "float (0.0 - 1.0)"
        }
        ```
