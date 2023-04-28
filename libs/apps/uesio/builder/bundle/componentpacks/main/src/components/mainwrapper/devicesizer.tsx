import { definition, component, api } from "@uesio/ui"

const DeviceSizer: definition.UtilityComponent = (props) => {
	const { context } = props
	const Group = component.getUtility("uesio/io.group")
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const setDimensions = (height: number, width: number) =>
		api.signal.getHandler(
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
		)

	return (
		<Group className="ml-4" context={context}>
			<Button
				context={context}
				label=""
				icon={
					<Icon
						context={context}
						weight={300}
						fill={false}
						icon="desktop_windows"
					/>
				}
				variant="uesio/builder.minoricontoolbar"
				onClick={setDimensions(0, 0)}
			/>
			<Button
				context={context}
				label=""
				icon={
					<Icon
						context={context}
						weight={300}
						fill={false}
						icon="laptop"
					/>
				}
				variant="uesio/builder.minoricontoolbar"
				onClick={setDimensions(0, 1200)}
			/>
			<Button
				context={context}
				label=""
				icon={
					<Icon
						context={context}
						weight={300}
						fill={false}
						icon="tablet"
					/>
				}
				variant="uesio/builder.minoricontoolbar"
				onClick={setDimensions(1024, 768)}
			/>
			<Button
				context={context}
				label=""
				icon={
					<Icon
						context={context}
						weight={300}
						fill={false}
						icon="smartphone"
					/>
				}
				variant="uesio/builder.minoricontoolbar"
				onClick={setDimensions(667, 375)}
			/>
		</Group>
	)
}

export default DeviceSizer
