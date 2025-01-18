import { definition, styles } from "@uesio/ui"
import Tile from "../tile/tile"

interface MetricProps {
  onClick?: () => void
  title?: string
  unit?: string
  value: string
}

const StyleDefaults = Object.freeze({
  root: [],
  title: [],
  valuewrapper: [],
  value: [],
  unit: [],
})

const Metric: definition.UtilityComponent<MetricProps> = (props) => {
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.metric",
  )
  return (
    <Tile
      onClick={props.onClick}
      classes={{ root: classes.root }}
      context={props.context}
    >
      <div className={classes.title}>{props.title}</div>
      <div className={classes.valuewrapper}>
        <div className={classes.value}>{props.value}</div>
        <div className={classes.unit}>{props.unit}</div>
      </div>
    </Tile>
  )
}

export default Metric
