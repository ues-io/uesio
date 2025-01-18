import { styles, definition } from "@uesio/ui"

type ComponentDefinition = {
  text: string
}

const Component: definition.UC<ComponentDefinition> = (props) => {
  const { text } = props.definition
  const classes = styles.useStyleTokens(
    {
      root: ["text-green-600"],
    },
    props,
  )
  return <div className={classes.root}>{props.context.mergeString(text)}</div>
}

export default Component
