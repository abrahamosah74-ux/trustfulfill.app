export async function fetchTrustMetric() {
  const response = await fetch('/api/metrics/trust', {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch trust metric');
  }
  
  return response.json();
}

export async function fetchInterventions() {
  const response = await fetch('/api/metrics/interventions', {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch interventions');
  }
  
  return response.json();
}
