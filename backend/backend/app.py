from typing import Annotated, AsyncGenerator
from fastapi import BackgroundTasks, Depends, FastAPI, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from contextlib import asynccontextmanager
from sqlmodel import SQLModel, Session, create_engine, select, func, delete
from collections import defaultdict
import re
import httpx
import socket
import asyncio
import logging
from urllib import parse
import random
import string

from .models import Entry, FileLine
from .settings import AppConfig

THRESHOLD = 100
semaphore = asyncio.Semaphore(10)
transport = httpx.AsyncHTTPTransport(retries=1)

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.WARN)

def generate_random(length: int) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[dict[str, dict[str, str]]]:
    """
    Initializes a global state that can be shared across requests
    to store the current state of a request. Realistically this should
    live in some kind of Redis cache or another table in the DB

    accessible using the request object: request.state.inner
    """
    create_db_and_tables()
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

engine = create_engine(settings.connection_string)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


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

@app.post("/clear")
async def clear_db():
    with Session(engine) as session:
        session.exec(delete(Entry))  # type: ignore
        session.commit()
    return {"status": "ok"}

@app.get("/count/{file_name}")
async def count(  # type: ignore
    db: SessionDep,
    file_name: str,
    domain: str | None = None,
    ip_address: str | None = None,
    path: str | None = None,
    tags: str | None = None,
    port: int | None = None,
    application: str | None = None,
):
    query = select(func.count(Entry.id)).where(Entry.file_name == file_name)  # type: ignore

    if domain is not None and domain != "":
        query = query.where(Entry.address.like('%' + domain + '%')) # type: ignore
    
    if ip_address is not None and ip_address != "":
        query = query.where(Entry.ip_address == ip_address)  # type: ignore

    if path is not None and path != "":
        query = query.where(Entry.url_path.like('%' + path + '%')) # type: ignore
    
    if tags is not None and tags != "":
        tag_list = tags.split(",")
        query = query.where(Entry.tags.contains(tag_list))  # type: ignore

    if port is not None:
        query = query.where(Entry.port == port)  # type: ignore
    
    if application is not None and application != "":
        query = query.where(Entry.application == application)  # type: ignore


    count: int = db.exec(query).one()  # type: ignore
    return {"count": count}  # type: ignore

@app.get("/search/{file_name}")
async def search(
    db: SessionDep,
    file_name: str,
    offset: int = 0,
    limit: Annotated[int, Query(le=100, ge=1)] = 100,
    domain: str | None = None,
    ip_address: str | None = None,
    path: str | None = None,
    tags: str | None = None,
    port: int | None = None,
    application: str | None = None,
):
    query = select(Entry).where(Entry.file_name == file_name).offset(offset).limit(limit)

    if domain is not None and domain != "":
        query = query.where(Entry.address.like('%' + domain + '%')) # type: ignore
    
    if ip_address is not None and ip_address != "":
        query = query.where(Entry.ip_address == ip_address)

    if path is not None and path != "":
        query = query.where(Entry.url_path.like('%' + path + '%')) # type: ignore
    
    if tags is not None and tags != "":
        tag_list = tags.split(",")
        query = query.where(Entry.tags.contains(tag_list))  # type: ignore

    if port is not None:
        query = query.where(Entry.port == port)
    
    if application is not None and application != "":
        query = query.where(Entry.application == application)
    
    entries = db.exec(query).all() # type: ignore

    return entries

def starts_with_known_protocol(line: str) -> bool:
    known_protocols = ["http://", "https://"]
    for protocol in known_protocols:
        if line.startswith(protocol):
            return True
    return False

async def convert_to_entries(domain: str, items: list[FileLine], client: httpx.AsyncClient) -> list[Entry]:
    entries: list[Entry] = []
    tags: list[str] = []

    url = parse.urlparse(domain)

    if not starts_with_known_protocol(domain):
        logger.info(f"Domain {domain} does not start with a known protocol. Assuming http")
        domain = f"http://{domain}"

    try:
        _, _, addresses = socket.gethostbyname_ex(url.hostname) # type: ignore
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
                address=url.hostname,  # type: ignore
                url_path = url.path,
                file_name=item.file_name if item.file_name else "",
                line_number=item.line_number,
                tags=tags,
            )
            entries.append(entry)
            return entries

    try:
        async with semaphore:
            response = await client.get(domain, follow_redirects=True, timeout=10)
    except httpx.ReadError:
        response = None
    except httpx.RemoteProtocolError:
        response = None
    except httpx.ReadTimeout:
        response = None
    except httpx.ConnectTimeout:
        response = None
    except Exception as e:
        logger.error(f"Failed to get {domain}: {e}")
        raise

    if response is not None and response.is_success:
        title_split = response.text.split("<title>")
        if len(title_split) < 2:
            title = None
        else:
            title = response.text.split("<title>")[1].split("</title>")[0]
        port = 80 if response.url.scheme == "http" else 443
        scheme = response.url.scheme
        path = response.url.path
        tags = ["resolved"]

        if len(response.content) == 0:
            tags.append("inactive")
        else:
            tags.append("active")
        
        if response.text.find("type=\"password\"") or response.text.find("type='password'"):
            tags.append("login")
    else:
        logger.error(f"Failed to resolve {domain}: {response}")
        title = None
        port = None
        scheme = None
        path = None
        tags = ["unresolved"]

    for item in items:
        entry = Entry(
            username=item.username,
            password=item.password,
            address=url.hostname,  # type: ignore
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

def commit_entries(entries: list[Entry]):
    with Session(engine) as session:
        session.add_all(entries)
        session.commit()

async def handle_domain(domain: str, items: list[FileLine], client: httpx.AsyncClient):
    entries = await convert_to_entries(domain, items, client)

    logger.info(f"Adding {len(entries)} entries for {domain}")
    
    await run_in_threadpool(lambda: commit_entries(entries))

    logger.info(f"Finished adding {len(entries)} entries for {domain}")

def convert_to_file_items(file_name: str | None, contents: str) -> dict[str, list[FileLine]]:  
    original_lines = contents.split("\n")
    multiple_colon = re.compile("::+")
    has_ipv4_address = re.compile(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}")
    lines = [(i, line) for i, line in enumerate(original_lines)]
    lines = [(i, line) for i, line in lines if re.search(multiple_colon, line) is None]
    lines = [(i, line) for i, line in lines if starts_with_known_protocol(line)]
    lines = [(i, line) for i, line in lines if line.count(":") <= 3]
    lines = [(i, line) for i, line in lines if re.search(has_ipv4_address, line) is None]
    
    items: dict[str, list[FileLine]] = defaultdict(lambda: list()) # type: ignore
    for i, line in lines:
        scheme, domain, *creds = line.split(":")
        if len(creds) == 1:
            username, password = creds[0], ""
        elif len(creds) == 2:
            username, password = creds
        else:
            logger.error(f"Invalid line: {line}")
            username, password = "", ""

        if username == "" or len(set(username)) == 1 and username[0] == "*":
            username = generate_random(8)
        if password == "" or len(set(password)) == 1 and password[0] == "*":
            password = generate_random(16)

        address = f"{scheme}:{domain}"

        item = FileLine(
            file_name=file_name,
            line_number=i,
            domain=address,
            username=username,
            password=password,
        )

        items[address].append(item)
    return items

async def process_file(file_name: str | None, contents: str):
    items = await run_in_threadpool(lambda: convert_to_file_items(file_name, contents))

    # Ignore all items that have less than THRESHOLD occurrences
    counted = [(k, v, len(v)) for k, v in items.items() if len(v) > THRESHOLD]
    counted.sort(key=lambda x: x[2], reverse=True)

    async with httpx.AsyncClient(transport=transport) as client:
        while len(counted) > 0:
            batch = counted[:10]
            await asyncio.gather(*[handle_domain(domain, entries, client) for domain, entries, _ in batch]) # type: ignore
            counted = counted[10:]
