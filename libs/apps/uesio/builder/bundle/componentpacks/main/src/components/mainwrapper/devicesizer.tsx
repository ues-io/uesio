import { definition, component, api } from "@uesio/ui"

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
			icon={
				<Icon context={context} weight={300} fill={false} icon={icon} />
			}
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
				context
			)}
			tooltip={tooltip}
			tooltipPlacement="left"
		/>
	)
}

const DeviceSizer: definition.UtilityComponent = (props) => {
	const { context } = props
	const Grid = component.getUtility("uesio/io.grid")

	return (
		<Grid className="grid-rows-auto" context={context}>
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
				width={375}
				context={context}
				tooltip="Phone Size"
			/>
		</Grid>
	)
}

export default DeviceSizer
