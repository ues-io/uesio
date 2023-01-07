import {
	definition,
	component,
	hooks,
	styles,
	metadata,
	context as ctx,
} from "@uesio/ui"
import Canvas from "./canvas"
import PropertiesPanel from "../../shared/propertiespanel"
import ViewInfoPanel from "../../shared/viewinfopanel"
import CodeArea from "./codearea"

const Grid = component.getUtility("uesio/io.grid")

const getBuilderState = <T extends definition.Definition>(
	context: ctx.Context,
	id: string
) => {
	const uesio = hooks.useUesio()
	return uesio.component.getExternalState<T>(
		uesio.component.makeComponentId(
			context,
			"uesio/builder.buildwrapper",
			id
		)
	)
}

const getBuilderNamespaces = (context: ctx.Context) =>
	getBuilderState<Record<string, metadata.MetadataInfo>>(
		context,
		"namespaces"
	) || {}

const getBuildMode = (context: ctx.Context) =>
	getBuilderState<boolean>(context, "buildmode") || {}

const MainWrapper: definition.UesioComponent = (props) => {
	const uesio = hooks.useUesio(props)

	const [buildMode, setBuildMode] = uesio.component.useState<boolean>(
		uesio.component.getComponentIdFromProps("buildmode", props)
	)
	const { context } = props

	const builderContext = context.addFrame({
		theme: "uesio/studio.default",
	})

	const classes = styles.useStyles(
		{
			root: {
				height: "100vh",
				gridTemplateColumns: `auto 1fr auto`,
				gridTemplateRows: "1fr 1fr",
				...styles.getBackgroundStyles(
					{
						image: "uesio/core.whitesplash",
					},
					builderContext
				),
				padding: "6px",
				rowGap: "6px",
			},
			propertiespanel: { gridRow: 1, gridColumn: 1 },
			viewinfopanel: { gridRow: 2, gridColumn: 1 },
			canvas: {
				gridRow: "1 / 3",
				gridColumn: "2",
			},
			codearea: {
				gridRow: "1 / 3",
				gridColumn: 3,
				position: "relative",
				display: "grid",
			},
		},
		props
	)

	hooks.useHotKeyCallback(
		"meta+u",
		() => {
			uesio.builder.getBuilderDeps(context).then(() => {
				setBuildMode(!buildMode)
			})
		},
		true,
		[buildMode]
	)

	hooks.useHotKeyCallback("meta+p", () => {
		uesio.signal.run({ signal: "route/REDIRECT_TO_VIEW_CONFIG" }, context)
	})

	if (!buildMode) {
		return <>{props.children}</>
	}

	return (
		<Grid context={context} className={classes.root}>
			<PropertiesPanel
				context={builderContext}
				className={classes.propertiespanel}
			/>
			<ViewInfoPanel
				context={builderContext}
				className={classes.viewinfopanel}
			/>
			<Canvas
				className={classes.canvas}
				context={context}
				children={props.children}
			/>
			<CodeArea className={classes.codearea} context={builderContext} />
		</Grid>
	)
}

MainWrapper.signals = {
	TOGGLE_CODE: {
		dispatcher: (state) => !state,
		target: "codepanel",
	},
	SET_DIMENSIONS: {
		dispatcher: (state, payload) => [payload.width, payload.height],
		target: "dimensions",
	},
}

export { getBuildMode, getBuilderNamespaces }

export default MainWrapper
