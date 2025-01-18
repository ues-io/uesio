import { usePanels } from "../bands/panel/selectors"
import { Component } from "../component/component"
import { DefinitionMap, UtilityComponent } from "../definition/definition"
import { useViewDef } from "../bands/viewdef"

type PanelProps = {
  panelId: string
  closed: boolean
}

const Panel: UtilityComponent<PanelProps> = ({ panelId, context, closed }) => {
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
      definition={{ ...panelDef, id: panelId, closed }}
      path={`["panels"]["${panelId}"]`}
      context={context}
      componentType={componentType}
    />
  )
}

type DynamicPanelProps = {
  panelId: string
  definition: DefinitionMap
  closed: boolean
}

const DynamicPanel: UtilityComponent<DynamicPanelProps> = ({
  panelId,
  definition,
  closed,
  context,
}) => {
  if (!definition) return null
  const componentType = definition["uesio.type"] as string
  if (!componentType) return null
  return (
    <Component
      definition={{ ...definition, id: panelId, closed }}
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
          const newContext = props.context.clone(panel.context)
          if (panel.definition) {
            return (
              <DynamicPanel
                key={panel.id}
                context={newContext}
                panelId={panel.id}
                definition={panel.definition}
                closed={!!panel.closed}
              />
            )
          }
          return (
            <Panel
              key={panel.id}
              context={newContext}
              panelId={panel.id}
              closed={!!panel.closed}
            />
          )
        })}
    </>
  )
}

export default PanelArea
