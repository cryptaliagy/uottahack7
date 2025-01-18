from typing import AsyncGenerator
from fastapi import FastAPI
from contextlib import asynccontextmanager


from .models import Entry
from .settings import AppConfig

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[dict[str, dict[str, str]]]:
    """
    Initializes a global state that can be shared across requests
    to store the current state of a request. Realistically this should
    live in some kind of Redis cache or another table in the DB

    accessible using the request object: request.state.inner
    """
    shared_state: dict[str, str] = {}

    yield {"inner": shared_state}

app = FastAPI(root_path="/api", lifespan=lifespan)
settings = AppConfig()  # type: ignore
protocol_map = {
    "http": 80,
    "https": 443,
    "ftp": 21,
    "sftp": 22,
    "ssh": 22,
    "android": -1,
}

@app.get("/health")
def health():
    return {"status": "ok"}
