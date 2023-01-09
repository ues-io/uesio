import { definition, component, hooks, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import PropertiesPanel from "../../shared/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import CodeArea from "./codearea/codearea"
import { useBuildMode } from "../../api/stateapi"

const Grid = component.getUtility("uesio/io.grid")

const MainWrapper: definition.UesioComponent = (props) => {
	const { context } = props
	const [buildMode, setBuildMode] = useBuildMode(context)

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
			propertiespanel: {
				gridRow: 1,
				gridColumn: 1,
				width: "300px",
			},
			viewinfopanel: {
				gridRow: 2,
				gridColumn: 1,
				width: "300px",
			},
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
			api.builder.getBuilderDeps(context).then(() => {
				setBuildMode(!buildMode)
			})
		},
		true,
		[buildMode]
	)

	hooks.useHotKeyCallback("meta+p", () => {
		api.signal.run({ signal: "route/REDIRECT_TO_VIEW_CONFIG" }, context)
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

export default MainWrapper
