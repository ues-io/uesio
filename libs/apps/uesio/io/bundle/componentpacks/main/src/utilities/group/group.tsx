import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"
import Grid from "../grid/grid"

const StyleDefaults = Object.freeze({
  root: [],
})

const Group: FunctionComponent<definition.UtilityProps> = (props) => {
  const { context, children } = props
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.group",
  )
  return (
    <Grid classes={classes} context={context}>
      {children}
    </Grid>
  )
}

export default Group
