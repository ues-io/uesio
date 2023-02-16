import { usePanels } from "../bands/panel/selectors"
import { Component } from "../component/component"
import { PanelDefinitionMap } from "../definition/panel"
import { UtilityComponent } from "../definition/definition"
import { useViewDef } from "../bands/viewdef"

const PanelArea: UtilityComponent = (props) => {
	const panels = usePanels()
	useViewDef(props.context.getViewDefId())

	return (
		<>
			{panels &&
				panels.map((panel) => {
					if (!panel.context) return null
					const panelContext = props.context.clone(panel.context)
					const panelId = panel.id
					const viewDef = panelContext.getViewDef()
					const panels: PanelDefinitionMap | undefined =
						viewDef?.panels
					if (!panels || !panelId) return null

					const panelDef = panels[panelId]
					if (!panelDef) return null
					const componentType = panelDef["uesio.type"]

					if (!componentType) return null

					return [
						<Component
							key={panelId}
							definition={{ ...panelDef, id: panelId }}
							path={`["panels"]["${panelId}"]`}
							context={panelContext}
							componentType={componentType}
						/>,
					]
				})}
		</>
	)
}

export default PanelArea
