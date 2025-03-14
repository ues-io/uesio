import { component, styles, definition } from "@uesio/ui"

type GridItemDefinition = {
  components?: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
  root: [],
})

const GridItem: definition.UC<GridItemDefinition> = (props) => {
  const { definition, context, path, componentType } = props
  if (!definition) return <div />
  const classes = styles.useStyleTokens(StyleDefaults, props)
  return (
    <div className={classes.root}>
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

export default GridItem
