import { definition, component, api } from "@uesio/ui"

type SizerProps = {
	icon: string
	height: number
	width: number
}

const SizerButton: definition.UtilityComponent<SizerProps> = ({
	context,
	icon,
	height,
	width,
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
			/>

			<SizerButton
				icon="laptop"
				height={0}
				width={1200}
				context={context}
			/>
			<SizerButton
				icon="tablet"
				height={1024}
				width={768}
				context={context}
			/>
			<SizerButton
				icon="smartphone"
				height={667}
				width={375}
				context={context}
			/>
		</Grid>
	)
}

export default DeviceSizer
