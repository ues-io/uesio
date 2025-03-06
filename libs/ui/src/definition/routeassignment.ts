import { BundleableBase } from "../metadata/types"

export type RouteTokens = Record<string, string>
export type RouteAssignmentState = {
  type: string
  namespace: string
  collection: string
  path: string
  label: string
  icon?: string
  tokens?: RouteTokens // TODO: Server side equivalent?
} & BundleableBase
