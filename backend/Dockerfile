FROM python:3.13-slim

WORKDIR /app

RUN python -m pip install --upgrade pip && \
    pip install pipx && \
    pipx install poetry && \
    pipx inject poetry poetry-plugin-export && \
    /root/.local/bin/poetry --version && \
    cp /root/.local/bin/poetry /usr/local/bin/poetry && \
    poetry config virtualenvs.create false

ADD README.md pyproject.toml poetry.lock /app/

RUN poetry install --no-root

ADD . /app

RUN poetry install

CMD ["poetry", "run", "fastapi", "run", "backend/app.py"]

