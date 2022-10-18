import { FunctionComponent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"

const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")
const Group = component.getUtility("uesio/io.group")

const BottomActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "absolute",
				bottom: "2px",
				right: "26px",
				left: "26px",
				display: "grid",
				gridTemplateColumns: "1fr 1fr 1fr",
			},
			right: {
				justifyContent: "right",
			},
			left: {
				justifyContent: "left",
			},
			center: {
				justifyContent: "center",
			},
		},
		props
	)

	const toggleCode = uesio.signal.getHandler([
		{
			signal: "component/uesio/builder.runtime/TOGGLE_CODE/codepanel",
		},
	])

	const setDimensions = (height: number, width: number) =>
		uesio.signal.getHandler([
			{
				signal: "component/uesio/builder.runtime/SET_DIMENSIONS/dimensions",
				height,
				width,
			},
		])

	hooks.useHotKeyCallback("command+y", () => {
		toggleCode?.()
	})

	return (
		<div className={classes.root}>
			<Group
				className={classes.left}
				alignItems="left"
				context={context}
			/>
			<Group
				className={classes.center}
				alignItems="center"
				context={context}
			>
				<Button
					context={context}
					label=""
					icon={
						<Icon
							context={context}
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
					icon={<Icon context={context} fill={false} icon="laptop" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={setDimensions(0, 1200)}
				/>
				<Button
					context={context}
					label=""
					icon={<Icon context={context} fill={false} icon="tablet" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={setDimensions(1024, 768)}
				/>
				<Button
					context={context}
					label=""
					icon={
						<Icon
							context={context}
							fill={false}
							icon="smartphone"
						/>
					}
					variant="uesio/builder.minoricontoolbar"
					onClick={setDimensions(667, 375)}
				/>
			</Group>
			<Group
				className={classes.right}
				alignItems="right"
				context={context}
			>
				<Button
					context={props.context}
					label=""
					icon={<Icon context={context} icon="wysiwyg" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={() => {
						uesio.signal.run(
							{ signal: "route/REDIRECT_TO_VIEW_CONFIG" },
							props.context
						)
					}}
				/>
				<Button
					context={props.context}
					label=""
					icon={<Icon context={context} icon="view_quilt" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={() => {
						const workspace = props.context.getWorkspace()
						if (!workspace) {
							return
						}

						uesio.signal.run(
							{
								signal: "route/REDIRECT",
								path: `/app/${workspace.app}/workspace/${workspace.name}/views`,
							},
							props.context
						)
					}}
				/>
				<Button
					context={context}
					label=""
					icon={<Icon context={context} icon="code" />}
					variant="uesio/builder.minoricontoolbar"
					onClick={toggleCode}
				/>
			</Group>
		</div>
	)
}
BottomActions.displayName = "BottomActions"
export default BottomActions
