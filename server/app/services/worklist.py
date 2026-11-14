"""Worklist merge and Alert bookkeeping. Owner: person 3.

Merges alerts + fired unconfirmed escalation_steps + callback-pending contacts into rows of
one shape, bands 1..4 (red Alerts, call-backs, overdue Confirmations, yellow/green Alerts),
oldest first within a band. Closed and handled rows drop off. delivery_status from sms_sent
events and step state (digital vs paper read-status rule, plan 4.2). Workload line derived
from today's Alerts.

Also: create-or-append an Alert for a graded Check-in / Symptom Report / warning-sign tap
(same subject + symptom while open → append to trigger_event_ids), acknowledge, actions.
"""
