import { useState } from 'react';
import { LawIdInput } from '../src';

export function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1>Demo</h1>
      <LawIdInput
        onSelect={(r) => setSelected(`${r.lawTitle} (${r.lawId})`)}
        onSubmit={(id) => setSubmitted(id)}
      />
      <p>select: {selected ?? '(なし)'}</p>
      <p>submit: {submitted ?? '(なし)'}</p>
    </div>
  );
}
