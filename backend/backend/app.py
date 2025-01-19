from typing import AsyncGenerator
from fastapi import BackgroundTasks, FastAPI, UploadFile
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from collections import defaultdict
import re
import httpx
import socket
import asyncio

from .models import Entry, FileLine
from .settings import AppConfig

THRESHOLD = 100


def create_db_and_tables():
    pass


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

@app.post("/upload")
async def upload_file(file: UploadFile, background_tasks: BackgroundTasks):
    file_name = file.filename
    body = await file.read()
    contents = body.decode()

    background_tasks.add_task(process_file, file_name, contents)

    return {"status": "ok"}

def starts_with_known_protocol(line: str) -> bool:
    known_protocols = ["http://", "https://"]
    for protocol in known_protocols:
        if line.startswith(protocol):
            return True
    return False

async def convert_to_entries(domain: str, items: list[FileLine], client: httpx.AsyncClient) -> list[Entry]:
    entries: list[Entry] = []
    tags: list[str] = []

    try:
        _, _, addresses = socket.gethostbyname_ex(domain)[2][0] # type: ignore
        ip_address = addresses[0]  # type: ignore
        tags.append("resolved")
    except socket.error:
        ip_address = None
        tags.append("unresolved")

    if ip_address is None:
        for item in items:
            entry = Entry(
                username=item.username,
                password=item.password,
                address=item.domain,
                file_name=item.file_name if item.file_name else "",
                line_number=item.line_number,
                tags=tags,
            )
            entries.append(entry)
            return entries

    response = await client.get(domain)

    if response.is_success:
        title = response.text.split("<title>")[1].split("</title>")[0]
        port = response.url.port
        scheme = response.url.scheme
        path = response.url.path
        tags = ["success"]
    else:
        title = None
        port = None
        scheme = None
        path = None
        tags = ["failure"]

    for item in items:
        entry = Entry(
            username=item.username,
            password=item.password,
            address=item.domain,
            file_name=item.file_name if item.file_name else "",
            line_number=item.line_number,
            tags=tags,
            title=title,
            port=port,
            scheme=scheme,
            url_path=path,
            ip_address=ip_address,
        )
        entries.append(entry)

    return entries

async def handle_domain(domain: str, items: list[FileLine], client: httpx.AsyncClient):
    entries = await convert_to_entries(domain, items, client)
    
    # add to database

async def process_file(file_name: str | None, contents: str):
    original_lines = contents.split("\n")
    multiple_colon = re.compile("::+")
    has_ipv4_address = re.compile(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}")
    lines = [(i, line) for i, line in enumerate(original_lines)]
    lines = [(i, line) for i, line in lines if re.search(multiple_colon, line) is None]
    lines = [(i, line) for i, line in lines if starts_with_known_protocol(line)]
    lines = [(i, line) for i, line in lines if re.search(has_ipv4_address, line) is None]
    
    items: dict[str, list[FileLine]] = defaultdict(lambda: list()) # type: ignore
    for i, line in lines:
        scheme, domain, *creds = line.split(":")
        if len(creds) == 1:
            username, password = creds[0], ""
        else:
            username, password = creds

        address = f"{scheme}:{domain}"

        item = FileLine(
            file_name=file_name,
            line_number=i,
            domain=address,
            username=username,
            password=password,
        )

        items[domain].append(item)

    # Ignore all items that have less than THRESHOLD occurrences
    counted = [(k, v, len(v)) for k, v in items.items() if len(v) > THRESHOLD]
    counted.sort(key=lambda x: x[2], reverse=True)

    futures = []
    async with httpx.AsyncClient() as client:
        for domain, entries, _ in counted:
            future = handle_domain(domain, entries, client)
            futures.append(future) # type: ignore

        await asyncio.gather(*futures)  # type: ignore
