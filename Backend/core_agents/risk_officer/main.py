class RiskOfficer:
    def __init__(self):
        self.role = "Risk Officer"
    
    def evaluate(self, proposal):
        print(f"[{self.role}] Evaluating Proposal {proposal['prop_id']}...")
        # Placeholder logic
        return {"status": "Approved", "risk_score": 0.1}

if __name__ == "__main__":
    ro = RiskOfficer()
    print(ro.evaluate({"prop_id": "TEST-1"}))
