# QuickPark Agent Service

The **Agent Service** is the core AI orchestration layer for the QuickPark ecosystem. It is a FastAPI-based microservice responsible for interpreting complex user objectives, breaking them down into structured execution plans, and delegating sub-tasks to specialized AI agents.

This service utilizes a Multi-Agent architecture built with **LangChain**, **LangGraph**, and **Google GenAI**.

## 🧠 Multi-Agent Orchestration

The orchestration relies on a **Deterministic Planning Agent** that operates as the "brain" of the operation.

1. **User Objective**: The user provides a natural language goal (e.g., "Find an available parking space near Colombo and reserve it for 2 hours").
2. **Planning Agent**: The Planning Agent parses the objective and constructs a structured, ordered `AgentWorkflow`.
3. **Step Delegation**: The workflow is broken down into discrete `AgentStep`s. Each step is delegated to a specialized downstream agent (e.g., a Reservation Agent, Navigation Agent, or Search Agent).
4. **Tool Execution**: The planning agent determines which tools are needed, whether human-in-the-loop approval is required (like confirming a payment or reservation), and sequences them deterministically.
5. **Execution (LangGraph)**: The generated workflow is executed as a state graph, allowing state to be passed smoothly between distinct agents.

## 📁 Project Structure

```
agent-service/
├── app/
│   ├── agents/          # Individual specialized agents (e.g., PlanningAgent)
│   ├── api/             # FastAPI routes and endpoints
│   ├── config/          # Pydantic settings and environment config
│   ├── models/          # Pydantic data models (AgentStep, AgentWorkflow)
│   ├── services/        # External service integrations
│   ├── tools/           # Custom tools and function calling schemas
│   ├── workflows/       # LangGraph state graphs and workflow logic
│   └── main.py          # FastAPI application entrypoint
├── tests/               # Pytest suite for API, agents, and workflows
├── requirements.txt     # Python dependencies
└── .env.example         # Template for environment variables
```

## 🚀 Setup Instructions

### 1. Prerequisites

- Python 3.10+
- `pip` package manager

### 2. Create a Virtual Environment

It is highly recommended to use a virtual environment to manage dependencies.

```powershell
# Create the virtual environment
python -m venv .venv

# Activate the virtual environment (Windows)
.\.venv\Scripts\Activate.ps1

# Activate the virtual environment (Mac/Linux)
source .venv/bin/activate
```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Environment Configuration

Copy the sample environment file and configure your local variables.

```powershell
cp .env.example .env
```

Ensure you fill in your `GOOGLE_API_KEY` and verify the `BACKEND_API_URL` inside the newly created `.env` file.

## 🛠️ Running the Service

### Start the Development Server

Run the FastAPI application with live-reloading enabled:

```powershell
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

- **Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Run the Test Suite

The service maintains a comprehensive suite of `pytest` unit and integration tests.

```powershell
pytest tests/
```

To check test coverage:

```powershell
pytest --cov=app tests/
```
