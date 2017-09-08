# Quick Game Servers

A project for quickly spinning up (and discarding) game servers on an
as-needed basis.

Goals:
  - Launch game servers anywhere in the world via AWS, GCE, or
    others. Pay only for what you use (probably <$5 per month)
  - Both a friendly web UI and a reasonable REST API
  - Quality. Every part of the system should either be, or at least
    feel, fast and reliable.
  - Network measurement framework for ensuring QoS

## Setup

Running this project requires nodejs with `yarn` and optionally `pm2`:

```
npm i -g yarn pm2
```

Then run yarn to install all the dependencies:

```
yarn
```

You can now run the entire system in dev mode with the following:

```
pm2 start dev.json
```

The actual functionality requires a PostgreSQL server. When you have
one available, you need to load the schema with `db-migrate`
(via `npm run up` and `npm run down`)

Then copy the `.env` files in `backend` and `frontend` to `.env.local`
and setup each of the env variables
