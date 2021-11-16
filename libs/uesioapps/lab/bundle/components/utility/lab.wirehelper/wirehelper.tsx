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

const CollectionPicker: FC<definition.BaseProps> = (props) => {
	const fp = "s"
	return <p>pick a collection</p>
}

interface T extends definition.BaseProps {
	wire?: wire.Wire
}
interface ParentDef extends definition.DefinitionMap {
	wire?: string
}
const wireHelper: FC<T> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const parentDef = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, path)
	) as ParentDef
	const wireId = `${parentDef && parentDef.wire ? parentDef.wire : ""}`
	const wire = uesio.wire.useWire(wireId)
	const defWiresPath = component.path.makeFullPath(
		metadataType,
		metadataItem,
		"wires"
	)
	const wiresInDef =
		uesio.builder.useDefinition<wire.WireDefinitionMap>(defWiresPath)

	React.useEffect(() => {
		console.log({ wire, wiresInDef })
	}, [wire])

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

		// Add wire to parent def
		uesio.builder.addDefinitionPair(
			component.path.makeFullPath(metadataType, metadataItem, path),
			wireName,
			"wire"
		)
		updateWire(wireName)
	}

	const wireHelpMessage = (() => {
		if (!parentDef.wire)
			return "Tables need to be connected to a wire, select one."
		if (
			parentDef.wire &&
			wiresInDef &&
			wiresInDef[parentDef.wire] &&
			!wiresInDef[parentDef.wire]?.collection
		)
			return <CollectionPicker context={context} />
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
