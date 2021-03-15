import { FunctionComponent } from "react"

import { definition, component, hooks, context, signal } from "@uesio/ui"
import Canvas from "../../shared/canvas"
import TopLeftNav from "../../shared/topleftnav"
import BottomLeftNav from "../../shared/bottomleftnav"
import RightNav from "../../shared/rightnav"
import PropertiesPanel from "../../shared/propertiespanel"
import ComponentsPanel from "../../shared/componentspanel"
import WiresPanel from "../../shared/wirespanel"
import CodePanel from "../../shared/codepanel"
import { BuilderState } from "./runtimebuilderdefinition"

const Grid = component.registry.getUtility("io.grid")

component.registry.registerSignals("uesio.runtime", {
	TOGGLE_CODE: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: BuilderState) => void,
			getState: () => BuilderState
		) => {
			const state = getState()
			setState({
				...state,
				showCode: !state.showCode,
			})
			return ctx
		},
	},
	SHOW_COMPS: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: BuilderState) => void,
			getState: () => BuilderState
		) => {
			const state = getState()
			setState({
				...state,
				showComps: true,
				showWires: false,
			})
			return ctx
		},
	},
	SHOW_WIRES: {
		dispatcher: (signal: signal.SignalDefinition, ctx: context.Context) => (
			setState: (state: BuilderState) => void,
			getState: () => BuilderState
		) => {
			const state = getState()
			setState({
				...state,
				showComps: false,
				showWires: true,
			})
			return ctx
		},
	},
})

const Buildtime: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const def = uesio.view.useDefinitionLocal(props.path)

	const state = uesio.component.useState("buildtime", {
		showCode: false,
		showComps: true,
		showWires: false,
	}) as BuilderState

	const builderTheme = uesio.theme.useTheme(
		"studio.default",
		new context.Context()
	)
	if (!def || !builderTheme || !state) return <Canvas {...props} />
	const builderProps = {
		...props,
		context: props.context.addFrame({
			theme: "studio.default",
		}),
	}
	return (
		<Grid
			{...props}
			styles={{
				root: {
					height: "100vh",
					gridTemplateColumns: "50px 300px 1fr 300px 50px",
					gridTemplateRows: "1fr 1fr",
				},
			}}
		>
			<TopLeftNav
				{...builderProps}
				style={{ gridRow: 1, gridColumn: 1 }}
			/>
			<BottomLeftNav
				{...builderProps}
				style={{ gridRow: 2, gridColumn: 1 }}
			/>
			<PropertiesPanel
				{...builderProps}
				style={{ gridRow: 1, gridColumn: 2 }}
			/>
			{state.showWires && (
				<WiresPanel
					{...builderProps}
					style={{ gridRow: 2, gridColumn: 2 }}
				/>
			)}
			{state.showComps && (
				<ComponentsPanel
					{...builderProps}
					style={{ gridRow: 2, gridColumn: 2 }}
				/>
			)}
			<Canvas
				{...props}
				style={{
					gridRow: "1 / 3",
					gridColumn: state.showCode ? "3" : "3 / 5",
				}}
			/>
			{state.showCode && (
				<CodePanel
					{...builderProps}
					style={{ gridRow: "1 / 3", gridColumn: 4 }}
				/>
			)}
			<RightNav
				{...builderProps}
				style={{ gridRow: "1 / 3", gridColumn: 5 }}
			/>
		</Grid>
	)
}

export default Buildtime
