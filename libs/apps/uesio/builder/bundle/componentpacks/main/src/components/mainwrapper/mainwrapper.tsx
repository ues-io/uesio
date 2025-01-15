import { definition, hooks, component, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import { useBuildMode, useBuilderState } from "../../api/stateapi"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import IndexPanel from "./indexpanel"
import { SlotBuilderComponentId } from "../../utilities/slotbuilder/slotbuilder"
import CodePanel from "./codepanel"
import { toggleBuildMode } from "../../helpers/buildmode"
import BuildBar from "./buildbar/buildbar"

const StyleDefaults = Object.freeze({
	root: ["h-full", "grid-cols-[1fr]", "auto-cols-auto", "grid-rows-[100%]"],
	leftpanel: [
		"col-end-[-3]",
		"grid-rows-[1fr_1fr]",
		"gap-2",
		"border-r-8",
		"border-slate-700",
		"bg-slate-700",
	],
	rightpanel: ["col-end-[-2]", "border-r-8", "border-slate-700"],
	canvaswrap: ["grid-rows-1", "auto-rows-auto", "col-end-[-1]"],
	canvaswrapinner: ["relative", "grid", "grid-rows-1", "grid-cols-1"],
})

const MainWrapper: definition.UC<component.ViewComponentDefinition> = (
	props
) => {
	const { context, definition, path } = props
	const Grid = component.getUtility("uesio/io.grid")

	const [buildMode, setBuildMode] = useBuildMode(context)

	// Add a view frame to our builder context so that our component ids work right
	const builderContext = context
		.addThemeFrame("uesio/studio.default")
		.addViewFrame({
			view: context.getViewId(),
			viewDef: context.getViewDefId() || "",
		})
	const canvasContext = context.setCustomSlotLoader(SlotBuilderComponentId)

	const classes = styles.useStyleTokens(StyleDefaults, props)

	hooks.useHotKeyCallback(
		"meta+u",
		() => {
			toggleBuildMode(context, setBuildMode, !!buildMode)
		},
		true,
		[buildMode, setBuildMode]
	)

	hooks.useHotKeyCallback("meta+p", () => {
		const workspace = context.getWorkspace()
		const route = context.getRoute()
		if (!workspace || !route) {
			throw new Error("Not in a Workspace Context")
		}
		const [viewNamespace, viewName] = component.path.parseKey(route.view)
		api.signal.run(
			{
				signal: "route/NAVIGATE",
				path: `/app/${workspace.app}/workspace/${workspace.name}/views/${viewNamespace}/${viewName}`,
				namespace: "uesio/studio",
			},
			context.deleteWorkspace()
		)
	})

	const toggleCode = api.signal.getHandler(
		[
			{
				signal: "component/CALL",
				component: "uesio/builder.mainwrapper",
				componentsignal: "TOGGLE_CODE",
			},
		],
		context
	)

	const toggleIndex = api.signal.getHandler(
		[
			{
				signal: "component/CALL",
				component: "uesio/builder.mainwrapper",
				componentsignal: "TOGGLE_INDEX",
			},
		],
		context
	)

	hooks.useHotKeyCallback("meta+y", () => {
		toggleCode?.()
	})

	hooks.useHotKeyCallback("meta+i", () => {
		toggleIndex?.()
	})

	const [showCode] = useBuilderState<boolean>(context, "codepanel")
	const [showIndex] = useBuilderState<boolean>(context, "indexpanel")

	if (!buildMode) {
		return (
			<>
				<component.ViewArea
					context={context}
					definition={definition}
					path={path}
				/>
				<BuildBar context={builderContext} />
			</>
		)
	}

	return (
		<Grid className={classes.root} context={context}>
			<Grid context={context} className={classes.leftpanel}>
				<PropertiesPanel context={builderContext} />
				<ViewInfoPanel context={builderContext} />
			</Grid>
			{showIndex && (
				<Grid context={context} className={classes.rightpanel}>
					<IndexPanel context={builderContext} />
				</Grid>
			)}
			<Grid className={classes.canvaswrap} context={builderContext}>
				<div className={classes.canvaswrapinner}>
					<Canvas context={builderContext}>
						<component.ViewArea
							context={canvasContext}
							definition={definition}
							path={path}
						/>
					</Canvas>
					<BuildBar context={builderContext} />
				</div>
				{showCode && <CodePanel context={builderContext} />}
			</Grid>
		</Grid>
	)
}

MainWrapper.signals = {
	TOGGLE_CODE: {
		dispatcher: (state) => !state,
		target: "codepanel",
	},
	TOGGLE_INDEX: {
		dispatcher: (state) => !state,
		target: "indexpanel",
	},
	SET_DIMENSIONS: {
		dispatcher: (state, payload) => [payload.width, payload.height],
		target: "dimensions",
	},
}

export default MainWrapper
