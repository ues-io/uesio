import { usePanels } from "../bands/panel/selectors"
import { Component } from "../component/component"
import { UtilityComponent } from "../definition/definition"
import { useViewDef } from "../bands/viewdef"

type Props = {
	panelId: string
}

const Panel: UtilityComponent<Props> = ({ panelId, context }) => {
	const viewDef = useViewDef(context.getViewDefId())
	if (!viewDef) return null
	const panels = viewDef?.panels
	if (!panels) return null
	const panelDef = panels[panelId]
	if (!panelDef) return null
	const componentType = panelDef["uesio.type"]
	if (!componentType) return null
	return (
		<Component
			key={panelId}
			definition={{ ...panelDef, id: panelId }}
			path={`["panels"]["${panelId}"]`}
			context={context}
			componentType={componentType}
		/>
	)
}

const PanelArea: UtilityComponent = (props) => {
	const panels = usePanels()
	return (
		<>
			{panels &&
				panels.map((panel) => {
					if (!panel.context) return null
					return (
						<Panel
							key={panel.id}
							context={props.context.clone(panel.context)}
							panelId={panel.id}
						/>
					)
				})}
		</>
	)
}

export default PanelArea
