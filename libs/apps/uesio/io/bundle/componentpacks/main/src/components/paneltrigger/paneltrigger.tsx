import { component, api, definition, signal } from "@uesio/ui"
import { useEffect } from "react"

type PanelTriggerDefinition = {
	trigger?: definition.DefinitionList
	panel?: definition.DefinitionMap
}

const toggle: signal.ComponentSignalDescriptor<number> = {
	dispatcher: (state) => state + 1,
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	TOGGLE: toggle,
}

const PanelTrigger: definition.UC<PanelTriggerDefinition> = (props) => {
	const { definition, context, path, componentType } = props
	const componentId = api.component.getComponentIdFromProps(props)
	const [isOpen] = api.component.useState<number>(componentId, 0)

	useEffect(() => {
		if (!isOpen) return
		api.signal.run(
			{
				signal: "panel/TOGGLE",
				panel: "dynamic_panel_" + componentId,
				definition: definition.panel,
			},
			context
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen])

	return (
		<div id={api.component.getComponentIdFromProps(props)}>
			<component.Slot
				definition={definition}
				listName="trigger"
				path={path}
				context={context}
				componentType={componentType}
			/>
		</div>
	)
}

PanelTrigger.signals = signals

export default PanelTrigger
