import { usePanels } from "../bands/panel/selectors"
import { Component } from "../component/component"
import { PanelDefinitionMap } from "../definition/panel"
import { RefObject, useRef } from "react"
import { FloatingPortal } from "@floating-ui/react"
import { UtilityComponent } from "../definition/definition"

let portalsDomNode: RefObject<HTMLDivElement> | undefined = undefined

const PanelArea: UtilityComponent = (props) => {
	const panels = usePanels()

	portalsDomNode = useRef<HTMLDivElement>(null)

	return (
		<div ref={portalsDomNode}>
			<FloatingPortal root={portalsDomNode.current}>
				{panels &&
					panels.map((panel) => {
						const panelContext = props.context.clone([])

						const panelId = panel.id
						if (!panelContext) return <></>
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
			</FloatingPortal>
		</div>
	)
}

export default PanelArea
