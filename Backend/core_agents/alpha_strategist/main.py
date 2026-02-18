from typing import TypedDict, List, Annotated
import operator
import json
import time

from langgraph.graph import StateGraph, END

# Import Sub-Agents
# Note: These paths will need the directory in PYTHONPATH or relative imports
try:
    from backend.sub_agents.researcher.logic import Researcher
    from backend.sub_agents.bull_analyst.logic import Bull
    from backend.sub_agents.bear_analyst.logic import Bear
    from backend.sub_agents.judge.logic import Judge
except ImportError:
    # Fallback for now until sub_agents are moved/refactored
    # We will need to fix this once the sub-agent split happens in the next step
    pass 


# Define State
class AgentState(TypedDict):
    goal: str
    plan: list
    research_data: dict
    risk_assessment: str
    bull_thesis: dict
    bear_thesis: dict
    consensus_score: float
    trade_proposal: dict
    audit_log: List[dict]

# Initialize Agents
researcher = Researcher()
bull = Bull()
bear = Bear()
judge = Judge() # We'll use the logic directly for consensus, but keep the instance

# --- Nodes ---

def goal_decomposition(state: AgentState):
    print("--- GOAL DECOMPOSITION ---")
    goal = state["goal"]
    # Simple mocked decomposition
    plan = [
        "Fetch market data",
        "Assess liquidity risk",
        "Generate Bull/Bear thesis",
        "Calculate consensus",
        "Finalize proposal"
    ]
    
    log_entry = {
        "timestamp": time.time(),
        "step": "Goal Decomposition",
        "details": {"goal": goal, "generated_plan": plan}
    }
    
    return {
        "plan": plan, 
        "audit_log": [log_entry]
    }

def research_node(state: AgentState):
    print("--- RESEARCHER ---")
    # For simplicity, extract asset from goal string (dumb parsing)
    asset = "ETH" # Default
    if "BTC" in state["goal"]: asset = "BTC"
    
    research_result = researcher.process({"asset": asset})
    
    log_entry = {
        "timestamp": time.time(),
        "step": "Research",
        "details": research_result
    }
    
    return {
        "research_data": research_result["market_data"],
        "risk_assessment": research_result["risk_assessment"],
        "audit_log": [log_entry] # LangGraph concatenates lists by default if configured? No, TypedDict overwrites usually, unless using Annotated with operator.add
        # For simplicity in this non-Annotated version, we'll just append manually in memory if needed, but here we return updates.
        # Wait, standard TypedDict overwrites. We need to handle list appending.
    }
    
# To handle list appending properly in LangGraph, we should use Annotated[List, operator.add].
# Rewriting State definition usage slightly later or just managing it carefully. 
# For now, let's assume we return the NEW log entry and the graph handles it if we used Annotated.
# But since I didn't import Annotated/operator properly for the TypedDict definition above (it's just TypedDict),
# `audit_log` will be overwritten. I will fix this by reading the current state in the node if I could, 
# but nodes receive state. 
# actually, let's just make the logs cumulative by passing the old log + new log?
# Or better: Just use a list update in the return and rely on the fact that for now we just want to see the logs at the end.
# I will fix the TypedDict to use Annotated for list appending to be robust.

def bull_thesis_node(state: AgentState):
    print("--- BULL AGENT ---")
    result = bull.process(state["research_data"])
    return {
        "bull_thesis": result,
        "audit_log": [{"step": "Bull Analysis", "details": result}]
    }

def bear_thesis_node(state: AgentState):
    print("--- BEAR AGENT ---")
    result = bear.process(state["research_data"])
    return {
        "bear_thesis": result,
        "audit_log": [{"step": "Bear Analysis", "details": result}]
    }

def weighted_consensus(state: AgentState):
    print("--- WEIGHTED CONSENSUS ---")
    bull_score = state["bull_thesis"]["conviction"]
    bear_score = state["bear_thesis"]["doubt"]
    
    # Formula: (Bull * 0.6) - (Bear * 0.4)
    consensus = (bull_score * 0.6) - (bear_score * 0.4)
    
    proposal = {
        "prop_id": f"PROP-{int(time.time())}",
        "asset": "BTC" if "BTC" in state["goal"] else "ETH",
        "direction": "Long" if consensus > 0 else "Short",
        "consensus_score": round(consensus, 2),
        "entry_range": "Market" if consensus > 0.3 else "Limit",
        "stop_loss": "-5%"
    }
    
    log_entry = {
        "step": "Consensus",
        "details": {
            "bull_score": bull_score,
            "bear_score": bear_score,
            "final_consensus": consensus,
            "proposal": proposal
        }
    }
    
    return {
        "consensus_score": consensus,
        "trade_proposal": proposal,
        "audit_log": [log_entry]
    }

def audit_logger(state: AgentState):
    print("--- AUDIT LOGGING (0G Labs Mock) ---")
    # In a real app, we'd send `state["audit_log"]` to 0G Labs SDK
    # Here we just dump to a file
    with open("audit_trail.json", "w") as f:
        json.dump(state["audit_log"], f, indent=2)
    return {}

# --- Conditional Logic ---

def check_risk(state: AgentState):
    if state["risk_assessment"] == "High Liquidity Risk":
        print("!!! HIGH RISK DETECTED - ABORTING/REPLANNING !!!")
        return "high_risk"
    return "pass"

# --- Graph Construction ---

# Redefine State with Reducers for appending logs
class AgentState(TypedDict):
    goal: str
    plan: List[str]
    research_data: dict
    risk_assessment: str
    bull_thesis: dict
    bear_thesis: dict
    consensus_score: float
    trade_proposal: dict
    audit_log: Annotated[List[dict], operator.add]

workflow = StateGraph(AgentState)

workflow.add_node("Planner", goal_decomposition)
workflow.add_node("Researcher", research_node)
workflow.add_node("Bull", bull_thesis_node)
workflow.add_node("Bear", bear_thesis_node)
workflow.add_node("Consensus", weighted_consensus)
workflow.add_node("Auditor", audit_logger)

# Edges
workflow.set_entry_point("Planner")
workflow.add_edge("Planner", "Researcher")

workflow.add_conditional_edges(
    "Researcher",
    check_risk,
    {
        "high_risk": END, # In a real looped agent, this would go back to Planner with metadata
        "pass": "Bull"
    }
)

# Parallel execution of Bull and Bear could be done, 
# but for simplicity we'll do sequential or check LangGraph parallel support.
# LangGraph supports parallel if multiple nodes start from same parent.
# Let's run Bull and Bear then Conditional Wait? 
# Simplest: Researcher -> Bull -> Bear -> Consensus
workflow.add_edge("Bull", "Bear")
workflow.add_edge("Bear", "Consensus")
workflow.add_edge("Consensus", "Auditor")
workflow.add_edge("Auditor", END)

app = workflow.compile()

# Execution Helper
if __name__ == "__main__":
    inputs = {"goal": "Analyze the 10% ETH drop and propose a recovery trade", "audit_log": []}
    print("Starting Alpha Strategist...")
    output = app.invoke(inputs)
    print("\nFinal Proposal:")
    print(json.dumps(output.get("trade_proposal", "No Proposal Generated"), indent=2))
    print("\nAudit Log saved to audit_trail.json")
