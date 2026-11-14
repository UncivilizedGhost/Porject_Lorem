"""Demo-day engine (ADR-0004): the only scheduling mechanism. Owner: person 3.

advance_day(): increments clock_state.current_demo_day, advances every Patient's
pathway_clock.current_demo_day, sets fired_at on every unconfirmed step whose due day has been
reached; a fired message_sms / auto_call rung writes a simulated event through
services.messaging. Returns { current_demo_day, fired }.

identities(): Coordinator id, most recent Contact id, most recent Patient id.
reset(): drops runtime collections, reseeds clock_state and the Coordinator.
"""
