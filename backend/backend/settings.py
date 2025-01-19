from typing import Annotated
from pydantic_settings import BaseSettings
from pydantic import MySQLDsn

class AppConfig(BaseSettings):
    connection_string: Annotated[str, MySQLDsn]