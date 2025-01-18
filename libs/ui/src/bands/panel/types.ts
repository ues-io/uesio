import { ContextFrame } from "../../context/context"
import { DefinitionMap } from "../../definition/definition"

export interface PanelState {
  id: string
  context: ContextFrame[]
  definition?: DefinitionMap
  closed?: boolean
}
