import { component, definition, api, styles } from "@uesio/ui"
import { default as IOGroup } from "../../utilities/group/group"

type ToolbarDefinition = {
  left?: definition.DefinitionList
  right?: definition.DefinitionList
  linkedComponentType?: string
  linkedComponentId?: string
}

const StyleDefaults = Object.freeze({
  root: ["justify-between"],
})

const Toolbar: definition.UC<ToolbarDefinition> = (props) => {
  const { context, definition, path, componentType } = props
  const { linkedComponentType = "", linkedComponentId = "" } = definition

  const classes = styles.useStyleTokens(StyleDefaults, props)

  api.component.useExternalState(
    api.component.makeComponentId(
      context,
      linkedComponentType,
      linkedComponentId,
    ),
  )
  return (
    <IOGroup
      classes={{
        root: classes.root,
      }}
      context={context}
    >
      {definition.left && (
        <IOGroup context={context}>
          <component.Slot
            definition={definition}
            listName="left"
            path={path}
            context={context}
            componentType={componentType}
          />
        </IOGroup>
      )}
      {definition.right && (
        <IOGroup context={context}>
          <component.Slot
            definition={definition}
            listName="right"
            path={path}
            context={context}
            componentType={componentType}
          />
        </IOGroup>
      )}
    </IOGroup>
  )
}

export default Toolbar
