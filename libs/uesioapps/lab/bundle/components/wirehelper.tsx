import React, { FC } from "react"
import {
	definition,
	hooks,
	component,
	context as ctx,
	styles,
	wire,
} from "@uesio/ui"

const Button = component.registry.getUtility("io.button")
const Icon = component.registry.getUtility("io.icon")

const wireHelper: FC<definition.BaseProps> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)

	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const formDef = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, path)
	) as definition.DefinitionMap

	const defWiresPath = component.path.makeFullPath(
		metadataType,
		metadataItem,
		"wires"
	)
	const wiresInDef = uesio.builder.useDefinition(
		defWiresPath
	) as definition.DefinitionMap

	const updateWire = (w: string) => {
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
			uesio.builder.addDefinitionPair(
				defWiresPath,
				{
					type: "",
					fields: null,
				},
				wireName,
				"wire"
			)
			uesio.builder.setSelectedNode(
				metadataType,
				metadataItem,
				`["wires"]["${wireName}"]`
			)

			uesio.setContext(new ctx.Context([{ view: "$root" }]))

			const showWires = uesio.signal.getHandler([
				{
					signal: "component/uesio.runtime/SHOW_WIRES",
				},
			])

			showWires && showWires()
		}

		uesio.builder.addDefinitionPair(
			component.path.makeFullPath(metadataType, metadataItem, path),
			wireName,
			"wire"
		)
		updateWire(wireName)
	}

	const wireHelpMessage = (() => {
		if (!formDef.wire)
			return "Tables need to be connected to a wire, select one."
		if (formDef.wire && !wire)
			return `Wire "${formDef.wire}" does not exist`
		return "Something went wrong"
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
					padding: "0 2em 2em 2em",
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
				<p>
					<Icon icon="power" context={props.context} />
				</p>
				<p>{wireHelpMessage}</p>
				<div className={classes.wireButtonGroup}>
					{Object.keys(wiresInDef).map((wire) => (
						<Button
							icon={<Icon icon="power" context={props.context} />}
							onClick={(e: React.MouseEvent<HTMLElement>) =>
								onWireClick(e, wire)
							}
							context={context}
							label={wire}
						/>
					))}
					<Button
						icon={<Icon icon="power" context={props.context} />}
						onClick={(e: React.MouseEvent<HTMLElement>) =>
							onWireClick(e, null)
						}
						context={context}
						label={"Create new Wire"}
					/>
				</div>
			</div>
		</div>
	)
}

export default wireHelper
