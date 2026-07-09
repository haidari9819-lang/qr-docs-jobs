/**
 * Minimaler MilanSQL-Client für Next.js API-Routen.
 * Muster: agent/milansql_client.py — Login + JWT-Cache + Query.
 */

const MILANSQL_URL = process.env.MILANSQL_URL || 'http://178.105.206.36:8080'
const MILANSQL_USER = process.env.MILANSQL_USER || 'qrdocs.job'
const MILANSQL_PASSWORD = process.env.MILANSQL_PASSWORD || ''

let cachedToken: string | null = null
let tokenExpires = 0
const TOKEN_TTL = 20 * 60 * 1000 // 20 min

async function login(): Promise<string> {
  const res = await fetch(`${MILANSQL_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: MILANSQL_USER, password: MILANSQL_PASSWORD }),
  })
  if (!res.ok) throw new Error(`MilanSQL login failed: ${res.status}`)
  const data = await res.json()
  if (!data.token) throw new Error(`MilanSQL login: kein Token`)
  return data.token
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpires) return cachedToken
  cachedToken = await login()
  tokenExpires = Date.now() + TOKEN_TTL
  return cachedToken
}

export interface MilanRow {
  [key: string]: string | number | null
}

export async function milansqlQuery(sql: string, params: (string | number)[] = []): Promise<MilanRow[]> {
  let token = await getToken()

  const doFetch = async (t: string) => {
    const res = await fetch(`${MILANSQL_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t}`,
      },
      body: JSON.stringify({ sql, params }),
    })
    return res
  }

  let res = await doFetch(token)

  // Retry on 401
  if (res.status === 401) {
    cachedToken = null
    tokenExpires = 0
    token = await getToken()
    res = await doFetch(token)
  }

  if (!res.ok) throw new Error(`MilanSQL query failed: ${res.status}`)
  const data = await res.json()
  const cols: string[] = data.columns || []
  const rows: unknown[][] = data.rows || []
  return rows.map(row => {
    const obj: MilanRow = {}
    cols.forEach((col, i) => { obj[col] = row[i] as string | number | null })
    return obj
  })
}
