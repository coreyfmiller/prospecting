"use client"

import { useState, useEffect } from "react"
import { getServiceTags, getPipelineStages, type CustomServiceTag, type CustomPipelineStage } from "@/lib/db"

export function useCustomTags() {
  const [customServiceTags, setCustomServiceTags] = useState<CustomServiceTag[]>([])
  const [customPipelineStages, setCustomPipelineStages] = useState<CustomPipelineStage[]>([])

  useEffect(() => {
    getServiceTags().then(setCustomServiceTags)
    getPipelineStages().then(setCustomPipelineStages)
  }, [])

  return { customServiceTags, customPipelineStages }
}
