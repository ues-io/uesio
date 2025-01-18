import { component, api, definition, signal } from "@uesio/ui"
import { default as IOTile } from "../../utilities/tile/tile"

type TileDefinition = {
  signals?: signal.SignalDefinition[]
  avatar?: definition.DefinitionList
  content?: definition.DefinitionList
}

const Tile: definition.UC<TileDefinition> = (props) => {
  const { definition, context, path, componentType } = props

  const isSelected = component.shouldHaveClass(context, "selected", definition)

  const [link, handler] = api.signal.useLinkHandler(definition.signals, context)

  return (
    <IOTile
      id={api.component.getComponentIdFromProps(props)}
      variant={definition[component.STYLE_VARIANT]}
      styleTokens={definition[component.STYLE_TOKENS]}
      context={context}
      onClick={handler}
      isSelected={isSelected}
      link={link}
      avatar={
        definition.avatar && (
          <component.Slot
            definition={definition}
            listName="avatar"
            path={path}
            context={context}
            componentType={componentType}
          />
        )
      }
    >
      <component.Slot
        definition={definition}
        listName="content"
        path={path}
        context={context}
        componentType={componentType}
      />
    </IOTile>
  )
}

export default Tile
