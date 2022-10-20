import React, { FC } from "react"
import {
	definition,
	hooks,
	component,
	context as ctx,
	styles,
	wire,
} from "@uesio/ui"

const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

interface ParentDef extends definition.DefinitionMap {
	wire?: string
}
interface T extends definition.BaseProps {
	wire?: wire.Wire
}
const wireHelper: FC<T> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const parentDef = uesio.builder.useDefinition(
		metadataType,
		metadataItem,
		path
	) as ParentDef
	const wireId = `${parentDef && parentDef.wire ? parentDef.wire : ""}`

	// const defWiresPath = component.path.makeFullPath(
	// 	metadataType,
	// 	metadataItem,
	// 	"wires"
	// )
	const wiresInDef = uesio.builder.useDefinition(
		metadataType,
		metadataItem,
		"wires"
	) as wire.WireDefinitionMap

	const selectWire = (wireName: string) =>
		uesio.builder.setSelectedNode(
			metadataType,
			metadataItem,
			`["wires"]["${wireName}"]`
		)

	const refreshWire = (w: string) => {
		uesio.builder.setDefinition(
			component.path.makeFullPath(
				metadataType,
				metadataItem,
				component.path.fromPath([
					...component.path.toPath(path),
					"wire",
				])
			),
			w
		)
		const wireUpdate = uesio.signal.getHandler([
			{
				signal: "wire/LOAD",
				wires: [w],
			},
		])

		wireUpdate && wireUpdate()
	}

	const onWireClick = (
		e: React.MouseEvent<HTMLElement>,
		wireId: string | null
	) => {
		e.stopPropagation() // prevent builder from selecting the node
		const wireName =
			wireId || "newwire" + (Math.floor(Math.random() * 60) + 1)

		// Create new wire
		if (!wireId) {
			selectWire(wireName)

			uesio.setContext(new ctx.Context([{ view: "$root" }]))

			const showWires = uesio.signal.getHandler([
				{
					signal: "component/uesio/builder.runtime/SHOW_WIRES",
				},
			])

			showWires && showWires()
		}

		refreshWire(wireName)
	}

	const wireHelpMessage = (() => {
		const copy = {
			wire: "Tables need to be connected to a wire, select one.",
			fields: "Add fields",
			collection: "Choose a collection",
			fallback: "Refresh the wire",
		}
		const collectionState = (str: string) => {
			if (!str) return "missing"
			if (str.endsWith(".")) return "incomplete"
			return "correct"
		}
		if (!parentDef.wire)
			return "Tables need to be connected to a wire, select one."
		const wireDef = wiresInDef && wiresInDef[parentDef.wire]
		const collection = collectionState(
			(wiresInDef &&
				wireDef &&
				!wireDef.viewOnly &&
				wireDef?.collection) ||
				""
		)
		if (collection === "missing" || collection === "incomplete")
			return copy.collection

		if (!wireDef?.fields || !Object.keys(wireDef.fields).length)
			return copy.fields

		return copy.fallback
	})()

	const classes = styles.useStyles(
		{
			root: {},
			wireButtonGroup: {
				display: "inline-flex",
				justifyContent: "center",
				gap: "5px",
			},
			wireHelp: {
				textAlign: "center",
				marginBottom: "2em",
				margin: "1em auto",

				".box": {
					display: "inline-block",
					border: "2px dashed #74a5f0",
					borderRadius: "0.25em",
					padding: "2em",
				},
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<div className={classes.wireHelp}>
			<div className="box">
				<div>
					<Icon icon="power" context={props.context} />{" "}
					{wireId && (
						<span role="button" onClick={() => selectWire(wireId)}>
							{wireId}
						</span>
					)}
				</div>
				<p>{wireHelpMessage}</p>
				{!parentDef.wire && (
					<div className={classes.wireButtonGroup}>
						{/* Show wires in page def */}
						{Object.keys(wiresInDef || {}).map((wireId) => (
							<Button
								key={wireId}
								icon={
									<Icon
										icon="power"
										context={props.context}
									/>
								}
								onClick={(e: React.MouseEvent<HTMLElement>) =>
									onWireClick(e, wireId)
								}
								context={context}
								label={wireId}
							/>
						))}
						{/* New wire */}
						<Button
							icon={<Icon icon="power" context={props.context} />}
							onClick={(e: React.MouseEvent<HTMLElement>) =>
								onWireClick(e, null)
							}
							context={context}
							label={"Create new Wire"}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

export default wireHelper
