import { FC } from "react"
import { usePanels } from "../bands/panel/selectors"
import { ComponentInternal } from "../component/component"
import { BaseProps } from "../definition/definition"
import { PanelDefinitionMap } from "../definition/panel"
import { Context } from "../context/context"

const PanelArea: FC<BaseProps> = () => {
	const panels = usePanels()

	return (
		<>
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
		</>
	)
}

export default PanelArea
