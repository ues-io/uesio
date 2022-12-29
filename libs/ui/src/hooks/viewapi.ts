import { useConfigValue as useCV } from "../bands/configvalue"
import { getViewDef, useViewDef } from "../bands/viewdef"

const useConfigValue = (key: string) => useCV(key)?.value || ""

export { useViewDef, getViewDef, useConfigValue }
