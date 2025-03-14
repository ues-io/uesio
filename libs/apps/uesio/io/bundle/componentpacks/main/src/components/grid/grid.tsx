import { component, definition } from "@uesio/ui"
import { default as IOGrid } from "../../utilities/grid/grid"

type GridDefinition = {
  items: definition.DefinitionList | undefined
}

const Grid: definition.UC<GridDefinition> = (props) => {
  const { definition, context, componentType } = props

  return (
    <IOGrid
      variant={definition[component.STYLE_VARIANT]}
      styleTokens={definition[component.STYLE_TOKENS]}
      context={props.context}
    >
      <component.Slot
        definition={definition}
        listName="items"
        path={props.path}
        context={context}
        componentType={componentType}
      />
    </IOGrid>
  )
}

Grid.displayName = "Grid"

export default Grid
