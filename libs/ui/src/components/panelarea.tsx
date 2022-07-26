import { FC, RefObject, useRef } from "react"
import { usePanels } from "../bands/panel/selectors"
import { ComponentInternal } from "../component/component"
import { BaseProps } from "../definition/definition"
import { PanelDefinitionMap } from "../definition/panel"
import { Context } from "../context/context"

let panelsDomNode: RefObject<HTMLDivElement> | undefined = undefined

const PanelArea: FC<BaseProps> = () => {
	const panels = usePanels()
	const newPanelsNode = useRef<HTMLDivElement>(null)
	panelsDomNode = newPanelsNode

	return (
		<div ref={newPanelsNode}>
			{panels &&
				panels.map((panel) => {
					const panelContext = new Context(panel.context || [])

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
						<ComponentInternal
							key={panelId}
							definition={{ ...panelDef, id: panelId }}
							path={`["panels"]["${panelId}"]`}
							context={panelContext}
							componentType={componentType}
						/>,
					]
				})}
		</div>
	)
}

export default PanelArea
export { panelsDomNode }
