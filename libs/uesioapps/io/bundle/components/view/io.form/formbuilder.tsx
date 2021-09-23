import { FC } from "react"
import { definition, styles, component, hooks, context as ctx } from "@uesio/ui"
import Form from "./form"
import { FormProps } from "./formdefinition"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const Button = component.registry.getUtility("io.button")
const Icon = component.registry.getUtility("io.icon")

const { makeFullPath } = component.path

const FormBuilder: FC<FormProps> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const defWiresPath = component.path.makeFullPath(
		metadataType,
		metadataItem,
		"wires"
	)
	const wiresInDef = uesio.builder.useDefinition(
		defWiresPath
	) as definition.DefinitionMap
	const availableWires = wiresInDef && Object.keys(wiresInDef)

	const formDef = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, path)
	) as definition.DefinitionMap
	const wire = formDef.wire || context.getWire()?.source.name

	const onWireClick = (
		e: React.MouseEvent<HTMLElement>,
		wireId: string | null
	) => {
		e.stopPropagation() // prevent builder from selecting the node
		const wireName =
			wireId || "newwire" + (Math.floor(Math.random() * 60) + 1)

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
			console.log({ uesio })
			const showWires = uesio.signal.getHandler([
				{
					signal: "component/uesio.runtime/SHOW_WIRES",
				},
			])

			showWires && showWires()
		}

		uesio.builder.addDefinitionPair(
			makeFullPath(metadataType, metadataItem, path),
			wireName,
			"wire"
		)
	}

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
		<BuildWrapper
			{...props}
			classes={classes}
			subtitle={
				formDef.wire ? (
					<WireLink
						context={context}
						wire={formDef.wire as string}
						onClick={(e: React.MouseEvent<HTMLElement>) => {
							e.stopPropagation()
							uesio.builder.setSelectedNode(
								metadataType,
								metadataItem,
								`["wires"]["${formDef.wire}"]`
							)
						}}
					/>
				) : null
			}
		>
			{!wire && (
				<div className={classes.wireHelp}>
					<div className="box">
						<p>
							<Icon icon="power" context={props.context} />
						</p>
						<p>Forms need to be connected to a wire, select one.</p>
						<div className={classes.wireButtonGroup}>
							{availableWires.map((wire) => (
								<Button
									icon="power"
									onClick={(
										e: React.MouseEvent<HTMLElement>
									) => onWireClick(e, wire)}
									context={context}
									label={wire}
								/>
							))}
							<Button
								icon="power"
								onClick={(e: React.MouseEvent<HTMLElement>) =>
									onWireClick(e, null)
								}
								context={context}
								label={"Create new Wire"}
							/>
						</div>
					</div>
				</div>
			)}
			<Form {...props} />
		</BuildWrapper>
	)
}

const WireLink: FC<{
	context: ctx.Context
	wire: string
	onClick: (e: React.MouseEvent<HTMLElement>) => void
}> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				opacity: 0.7,
				textTransform: "none",
				fontWeight: "normal",
				fontSize: "1.1em",
				"&:hover": {
					color: props.context.getTheme().definition.palette
						.secondary,
				},
			},
			text: {},
		},
		{
			context: props.context,
		}
	)
	return (
		<span
			role="button"
			tabIndex={0}
			title="Some title"
			className={classes.root}
			onClick={(e: React.MouseEvent<HTMLElement>) => props.onClick(e)}
		>
			<Icon size="small" icon="power" context={props.context} />
			{props.wire}
		</span>
	)
}

export default FormBuilder
