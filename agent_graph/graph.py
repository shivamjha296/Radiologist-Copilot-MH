from langgraph.graph import StateGraph, END
from agent_graph.state import AgentState
from agent_graph.agents.analyzer import analyzer_agent
from agent_graph.agents.retriever import retriever_agent
from agent_graph.agents.comparator import comparator_agent
from agent_graph.agents.ner import ner_agent
from agent_graph.agents.pdf_generator import pdf_agent
from agent_graph.agents.visualizer import visualizer_agent
from langgraph.checkpoint.memory import MemorySaver

def create_graph():
    workflow = StateGraph(AgentState)
    checkpointer = MemorySaver()

    # Add nodes
    workflow.add_node("retriever", retriever_agent)
    workflow.add_node("analyzer", analyzer_agent)
    workflow.add_node("visualizer", visualizer_agent)
    workflow.add_node("comparator", comparator_agent)
    workflow.add_node("ner", ner_agent)
    workflow.add_node("pdf_generator", pdf_agent)

    # Define edges
    # Flow: Retriever -> Analyzer -> Visualizer -> Comparator -> NER -> (Interrupt) -> PDF -> End
    workflow.set_entry_point("retriever")
    workflow.add_edge("retriever", "analyzer")
    workflow.add_edge("analyzer", "visualizer")
    workflow.add_edge("visualizer", "comparator")
    workflow.add_edge("comparator", "ner")
    workflow.add_edge("ner", "pdf_generator")
    workflow.add_edge("pdf_generator", END)

    # Compile with interrupt before PDF generation and checkpointer
    app = workflow.compile(interrupt_before=["pdf_generator"], checkpointer=checkpointer)
    return app
