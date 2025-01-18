import { component, styles, api, signal, definition } from "@uesio/ui"

type BoxDefinition = {
  signals?: signal.SignalDefinition[]
}

const StyleDefaults = Object.freeze({
  root: [],
})

const Box: definition.UC<BoxDefinition> = (props) => {
  const classes = styles.useStyleTokens(StyleDefaults, props)

  const { definition, context, path, componentType } = props
  return (
    <div
      id={api.component.getComponentIdFromProps(props)}
      className={classes.root}
      onClick={api.signal.getHandler(definition.signals, context)}
    >
      <component.Slot
        definition={definition}
        listName="components"
        path={path}
        context={context}
        componentType={componentType}
      />
    </div>
  )
}

export default Box
