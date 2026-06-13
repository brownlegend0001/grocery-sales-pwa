import { useEffect, useState } from 'react'
import { subscribe, initAuth, snapshot } from '../auth/googleAuth.js'

export function useAuth() {
  const [state, setState] = useState(snapshot)
  useEffect(() => {
    const off = subscribe(setState)
    initAuth()
    return off
  }, [])
  return state
}
