class Judge:
    def __init__(self):
        self.name = "Judge"

    def evaluate(self, bull_result, bear_result):
        # This logic is also implemented in the orchestrator's Weighted Consensus,
        # but the Judge can provide a qualitative summary.
        score = (bull_result["conviction"] * 0.6) - (bear_result["doubt"] * 0.4)
        decision = "Execute" if score > 0.2 else "Reject"
        return {
            "final_score": score,
            "decision": decision,
            "rationale": f"Bull conviction {bull_result['conviction']} vs Bear doubt {bear_result['doubt']}"
        }

    def process(self, inputs):
        return self.evaluate(inputs["bull"], inputs["bear"])
