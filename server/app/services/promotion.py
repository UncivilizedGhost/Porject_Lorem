"""Contact → Patient promotion (ADR-0002) and the Confirmation. Owner: person 3.

promote(contact_id, coordinator_id):
  copies county, trusted_people, accessibility; sets referral, phase suspected_cancer,
  pathway_clock.started_demo_day = current demo day; sets promoted_patient_id on the Contact;
  creates the five escalation_steps (models.escalation_steps.LADDER); sends the day-0 SMS via
  services.messaging.send_sms. Idempotent: an already-promoted Contact returns its Patient.

confirm(step_id, actor, trusted_person_name, input):
  sets confirmed_at on the step and on every later unfired rung; writes a confirmation event.
"""
