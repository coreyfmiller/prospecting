"use client"

import { useState, useEffect, useCallback } from "react"
import { getCredits } from "@/lib/db"

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    const c = await getCredits()
    setCredits(c)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { credits, refresh }
}
