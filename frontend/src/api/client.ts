import type { SessionInfo, PlacedAsset, SimulationResult, ParetoPoint } from '@/types'

// In production, call the backend API directly via its full URL.
// In development, the Vite proxy handles /api/* → localhost:8001.
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

let sessionToken: string | null = null

export function setSessionToken(token: string) {
  sessionToken = token
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sessionToken) h['Authorization'] = `Bearer ${sessionToken}`
  return h
}

export async function createSession(name: string, maxPlayers: number = 10): Promise<SessionInfo> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, max_players: maxPlayers }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getSession(id: string): Promise<SessionInfo> {
  const res = await fetch(`${BASE_URL}/sessions/${id}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listSessions(): Promise<SessionInfo[]> {
  const res = await fetch(`${BASE_URL}/sessions`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function joinSession(sessionId: string, username: string): Promise<{ player_id: string; session_token: string; session: SessionInfo }> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/join`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function submitDesign(sessionId: string, gridState: PlacedAsset[]): Promise<{ id: string; plan_number: number; total_cost: number; asset_cost: number; installation_cost: number }> {
  const res = await fetch(`${BASE_URL}/designs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ session_id: sessionId, grid_state: gridState }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function triggerSimulation(designId: string): Promise<{ simulation_id: string; status: string }> {
  const res = await fetch(`${BASE_URL}/designs/${designId}/simulate`, {
    method: 'POST',
    headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getSimulationResult(designId: string): Promise<SimulationResult> {
  const res = await fetch(`${BASE_URL}/designs/${designId}/result`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getParetoData(sessionId: string): Promise<{ designs: ParetoPoint[]; pareto_frontier: { total_cost: number; hydraulic_penalty: number }[] }> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/pareto`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
