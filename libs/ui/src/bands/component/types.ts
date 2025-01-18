import { Definition } from "../../definition/definition"

export type PlainComponentState = Definition

export type ComponentState = {
  id: string
  state: PlainComponentState
}
