# uOttaHack 7 Project

## Getting Started

### Prerequisites (for running project)

- [Docker](https://docs.docker.com/engine/install/)
- [Docker-Compose](https://docs.docker.com/engine/install/) - Comes with Docker Desktop

### Prerequisites (development)

See the specific README.md in the `frontend` and `backend` directories.

### Quickstart

1. Clone the repository
1. Build all containers with the `docker compose build` command
1. Setup the `.env` file in the top-level directory (see below)
1. Start the containers with the `docker compose up` command


### Environment Variables

To connect to the database, some environment variables are required. To set these up, create a black file called `.env` in your top-level directory, and add the following:

```env
MYSQL_ROOT_PASSWORD=<PASSWORD>
MYSQL_DATABASE=database
CONNECTION_STRING=mysql+pymysql://root:<PASSWORD>@db:3306/database
```

> Note: replace `<PASSWORD>` with your desired password. You may also change the value of `MYSQL_DATABASE` if you wish, but ensure that the `CONNECTION_STRING` is updated accordingly.

> IMPORTANT: This is not a secure setup and is assumed for development purposes only. It is highly encouraged to not use `root` as the database user in a production environment.

This file will then be read by the `docker-compose.yml` file to set the environment variables for the database container.