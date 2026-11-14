// Shown on Patient-only screens while the signed-in person is still a Contact: no pathway until
// the nurse's call-back (or the Coordinator) starts one.
export function NoPathwayYet() {
  return (
    <section>
      <h1>No pathway yet</h1>
      <p>The nurse will call you about your symptom. After the call, your appointments and next steps show here.</p>
    </section>
  );
}
