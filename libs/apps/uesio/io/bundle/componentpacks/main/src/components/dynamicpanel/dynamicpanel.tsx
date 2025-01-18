import { original } from "@reduxjs/toolkit"
import { api, definition, signal } from "@uesio/ui"
import { useEffect } from "react"

type DynamicPanelState = {
  definition: definition.DefinitionMap
}

const toggle: signal.ComponentSignalDescriptor<DynamicPanelState> = {
  dispatcher: async (state, signal, context, platform, id) => {
    const originalState = original(state)
    if (!originalState) return context
    await api.signal.run(
      {
        signal: "panel/TOGGLE",
        panel: "dynamic_panel_" + id,
        definition: originalState.definition,
      },
      context,
    )
    return context
  },
}

const open: signal.ComponentSignalDescriptor<DynamicPanelState> = {
  dispatcher: async (state, signal, context, platform, id) => {
    const originalState = original(state)
    if (!originalState) return context
    await api.signal.run(
      {
        signal: "panel/OPEN",
        panel: "dynamic_panel_" + id,
        definition: originalState.definition,
      },
      context,
    )
    return context
  },
}

const close: signal.ComponentSignalDescriptor<DynamicPanelState> = {
  dispatcher: async (state, signal, context, platform, id) => {
    await api.signal.run(
      {
        signal: "panel/CLOSE",
        panel: "dynamic_panel_" + id,
      },
      context,
    )
    return context
  },
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
  TOGGLE: toggle,
  OPEN: open,
  CLOSE: close,
}

const DynamicPanel: definition.UC = (props) => {
  const { definition } = props
  const componentId = api.component.getComponentIdFromProps(props)
  useEffect(() => {
    api.component.setState(componentId, { definition })
  }, [definition, componentId])

  return null
}

DynamicPanel.signals = signals

export default DynamicPanel
