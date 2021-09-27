import { FC, useState, useEffect } from "react"
import { definition, styles, component, util, hooks, wire } from "@uesio/ui"
import { Transition } from "react-transition-group"
import { FormDefinition } from "../io.form/formdefinition"

interface Props extends definition.BaseProps {
	wire: wire.Wire
}

type FieldHint = {
	used: boolean
	id: string
}

const duration = 250
const defaultStyle = {
	transition: `opacity ${duration}ms ease-in-out`,
	opacity: 0,
}
const transitionStyles = {
	entering: { opacity: 1 },
	entered: { opacity: 1 },
	exiting: { opacity: 0 },
	exited: { opacity: 0 },
	unmounted: { opacity: 0 },
}

const {
	fromPath,
	toPath,
	makeFullPath,
	getNearestAncestorPathByKey,
	findAllByKey,
	parseKey,
} = component.path

const FieldHints: FC<Props> = (props) => {
	const [open, setOpen] = useState<boolean>(false)
	const { wire, path, context } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const [fieldSuggestions, setFieldSuggestions] = useState<
		FieldHint[] | null
	>(null)
	const formPath = getNearestAncestorPathByKey(toPath(path), "io.form")
	const formDef = uesio.builder.useDefinition(
		makeFullPath(metadataType, metadataItem, fromPath(formPath))
	) as FormDefinition
	const collectionKey = wire.getCollection().getFullName() || ""
	const wireId = context.getWire()?.getId()
	const [namespace] = parseKey(collectionKey)
	const fieldsInWire = Object.keys(
		uesio.builder.useMetadataList(
			context,
			"FIELD",
			namespace,
			collectionKey
		) || {}
	)

	// We only want the code for fieldsuggestions to run when fieldsInWire has data
	useEffect(() => {
		if (!fieldsInWire.length) return
		const usedFields = findAllByKey(formDef, "fieldId")

		const fields: FieldHint[] = fieldsInWire.map((el) => ({
			used: usedFields.includes(el), // Used for sorting and greying out
			id: el,
		}))

		const sortedFields = fields.sort(({ used }) => (used ? 1 : -1))
		setFieldSuggestions(sortedFields)
	}, [fieldsInWire.length, formDef])

	const handleAddField = (fieldId: string) => {
		if (!wireId) return
		// 1. Add field to wire
		uesio.builder.addDefinitionPair(
			makeFullPath(
				metadataType,
				metadataItem,
				fromPath(["wires", wireId, "fields"])
			),
			null,
			fieldId
		)

		// 3. Add field to column definition
		uesio.builder.addDefinition(
			makeFullPath(
				metadataType,
				metadataItem,
				fromPath([...toPath(path), "components"])
			),
			{
				"io.field": {
					fieldId,
				},
			}
		)

		uesio.builder.setSelectedNode(
			metadataType,
			metadataItem,
			fromPath([...toPath(path), "components"])
		)

		// 4. Refresh the wire definition
		const wireUpdate = uesio.signal.getHandler([
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		])

		wireUpdate && wireUpdate()
	}

	const classes = styles.useStyles(
		{
			root: {
				position: "relative",
				"&:hover .fieldHint": {
					opacity: 0.7,
				},

				".fieldHint": {
					border: "2px dashed #74a5f0",
					borderRadius: "0.25em",
					height: "2em",
					padding: "5px",
					margin: "1em 0",
					position: "relative",
					display: "flex",
					alignItems: "center",
					opacity: 1,
					// opacity: open ? 1 : 0,
					optionsContainer: {},
					fontSize: "0.8em",
					option: {},
					transition: "all 0.125s ease",
				},
			},
			header: {
				display: "none",
			},

			fieldHintWrapper: {
				position: "relative",
			},
			fieldOptions: {
				position: "absolute",
				top: "26px",
				left: 1,
				zIndex: 1,
				right: 1,
				background: "#fff",
				boxShadow: "0px 0px 19px -7px rgb(0 0 0 / 20%)",
				borderBottomLeftRadius: "1em",
				borderBottomRightRadius: "1em",
				fontSize: "0.8em",
				overflow: "hidden",
			},
			fieldOptionslist: {
				maxHeight: "300px",
				overflow: "scroll",
			},
			fieldOption: {
				padding: "7px",
				"&:hover": {
					backgroundColor: "#74a5f0",
					color: "#fff",
				},
			},
		},
		{
			context,
		}
	)

	return fieldSuggestions ? (
		<div onMouseLeave={() => setOpen(false)} className={classes.root}>
			<div
				role="button"
				tabIndex={0}
				onClick={() => setOpen(!open)}
				className="fieldHint"
			>
				<span>Add field</span>
			</div>
			<Transition in={open} timeout={duration}>
				{(state) => (
					<div
						style={{
							...defaultStyle,
							...transitionStyles[state],
						}}
					>
						{open && (
							<div className={classes.fieldOptions}>
								<div
									role="list"
									className={classes.fieldOptionslist}
								>
									{fieldSuggestions.map((field, index) => (
										<div
											key={field.id}
											onClick={() =>
												handleAddField(field.id)
											}
											className={classes.fieldOption}
											style={{
												opacity: field.used ? "0.6" : 1,
											}}
											role="listitem"
										>
											{field.id}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</Transition>
		</div>
	) : (
		<span />
	)
}

export default FieldHints
