import { definition, component, api, styles } from "@uesio/ui"

type SizerProps = {
  icon: string
  height: number
  width: number
  tooltip: string
}

const SizerButton: definition.UtilityComponent<SizerProps> = ({
  context,
  icon,
  height,
  width,
  tooltip,
}) => {
  const Button = component.getUtility("uesio/io.button")
  const Icon = component.getUtility("uesio/io.icon")
  return (
    <Button
      context={context}
      label=""
      icon={<Icon context={context} weight={300} fill={false} icon={icon} />}
      variant="uesio/builder.minoricontoolbar"
      onClick={api.signal.getHandler(
        [
          {
            signal: "component/CALL",
            component: "uesio/builder.mainwrapper",
            componentsignal: "SET_DIMENSIONS",
            height,
            width,
          },
        ],
        context,
      )}
      tooltip={tooltip}
      tooltipPlacement="left"
    />
  )
}

const StyleDefaults = Object.freeze({
  root: ["grid-cols-auto", "grid-flow-col"],
})

const DeviceSizer: definition.UtilityComponent = (props) => {
  const { context } = props
  const Grid = component.getUtility("uesio/io.grid")
  const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

  return (
    <Grid className={classes.root} context={context}>
      <SizerButton
        icon="desktop_windows"
        height={0}
        width={0}
        context={context}
        tooltip="Default Size"
      />

      <SizerButton
        icon="laptop"
        height={0}
        width={1200}
        context={context}
        tooltip="Laptop Size"
      />
      <SizerButton
        icon="tablet"
        height={1024}
        width={768}
        context={context}
        tooltip="Tablet Size"
      />
      <SizerButton
        icon="smartphone"
        height={667}
        width={412}
        context={context}
        tooltip="Phone Size"
      />
    </Grid>
  )
}

export default DeviceSizer
