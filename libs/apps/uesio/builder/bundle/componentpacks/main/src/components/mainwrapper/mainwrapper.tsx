import { definition, hooks, component, api, styles } from "@uesio/ui"
import Canvas from "./canvas"
import { useBuildMode, useBuilderState } from "../../api/stateapi"
import PropertiesPanel from "./propertiespanel/propertiespanel"
import ViewInfoPanel from "./viewinfopanel/viewinfopanel"
import IndexPanel from "./indexpanel"
import { SlotBuilderComponentId } from "../../utilities/slotbuilder/slotbuilder"
import MainHeader from "./mainheader"
import ProfileTag from "./profiletag"
import CodePanel from "./codepanel"
import RightToolbar from "./righttoolbar"
import SaveCancelArea from "./savecancelarea"
import { toggleBuildMode } from "../../helpers/buildmode"

const StyleDefaults = Object.freeze({
	root: [
		"bg-slate-50",
		"h-full",
		"grid-cols-[auto_1fr]",
		"auto-cols-auto",
		"grid-rows-[100%]",
	],
	leftpanel: ["grid-rows-[auto_auto_1fr_1fr_auto]", "gap-3", "p-3"],
	rightpanel: ["col-start-3", "p-3"],
	canvaswrap: ["grid-rows-1", "auto-rows-auto", "gap-3"],
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
			</>
		)
	}

	return (
		<Grid className={classes.root} context={context}>
			<Grid context={context} className={classes.leftpanel}>
				<MainHeader context={builderContext} />
				<PropertiesPanel context={builderContext} />
				<ViewInfoPanel context={builderContext} />
				<ProfileTag context={builderContext} />
			</Grid>
			<Grid className={classes.canvaswrap} context={builderContext}>
				<div className={classes.canvaswrapinner}>
					<Canvas context={builderContext}>
						<component.ViewArea
							context={canvasContext}
							definition={definition}
							path={path}
						/>
					</Canvas>
					<SaveCancelArea context={context} />
					<RightToolbar context={context} />
				</div>
				{showCode && <CodePanel context={builderContext} />}
			</Grid>
			{showIndex && (
				<Grid context={context} className={classes.rightpanel}>
					<IndexPanel context={builderContext} />
				</Grid>
			)}
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
