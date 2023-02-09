import { usePanels } from "../bands/panel/selectors"
import { Component } from "../component/component"
import { PanelDefinitionMap } from "../definition/panel"
import { FC, RefObject, useRef } from "react"
import { FloatingPortal } from "@floating-ui/react"
import { context } from ".."

let portalsDomNode: RefObject<HTMLDivElement> | undefined = undefined

type T = {
	createPanelContext: (stack: context.ContextFrame[]) => context.Context
}
const PanelArea: FC<T> = ({ createPanelContext }) => {
	const panels = usePanels()

	portalsDomNode = useRef<HTMLDivElement>(null)

	return (
		<div ref={portalsDomNode}>
			<FloatingPortal root={portalsDomNode.current}>
				{panels &&
					panels.map((panel) => {
						const panelContext = createPanelContext(
							panel.context || []
						)
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
