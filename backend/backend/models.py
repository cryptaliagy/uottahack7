from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Column, JSON  # type: ignore

class Entry(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str | None = None
    password: str | None = None
    address: str
    scheme: str | None = None
    port: int | None = None
    url_path: str | None = None
    ip_address: str | None = None
    title: str | None = None
    file_name: str
    line_number: int
    application: str | None = None
    tags: list[str] = Field(sa_column=Column(JSON))

    # Needed for Column(JSON)
    class Config:  # type: ignore
        arbitrary_types_allowed = True



class FileLine(BaseModel):
    file_name: str | None
    line_number: int
    domain: str
    username: str | None = None
    password: str | None = None