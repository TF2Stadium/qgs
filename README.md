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
