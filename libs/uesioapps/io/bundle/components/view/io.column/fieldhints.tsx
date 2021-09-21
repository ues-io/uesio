import React, { FC, useState } from "react"
import { definition, styles, component, util, hooks } from "@uesio/ui"
import { Transition } from "react-transition-group"

interface T extends definition.BaseProps {
	wire: any // TODO
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

const FieldHints: FC<T> = (props) => {
	const [open, setOpen] = useState<boolean>(false)
	const { wire, path, context } = props
	const uesio = hooks.useUesio(props)
	const { fromPath, toPath, makeFullPath } = component.path
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()

	const formPath = toPath(path).slice(0, -3)
	const formDef = uesio.builder.useDefinition(
		makeFullPath(metadataType, metadataItem, fromPath(formPath))
	) as any
	const getFieldSuggestions = (): FieldHint[] => {
		// Idenitfy used fields in context
		const getUsedFields = (): string[] =>
			formDef?.columns.reduce((acc: string[], col: any) => {
				const columnData = Object.values(col)[0] as any
				if (!columnData.components) return []
				const fields = columnData.components.filter(
					(el: any) => Object.keys(el)[0] === "io.field"
				)
				const fieldNames = fields.map(
					(el: any) => el["io.field"].fieldId
				)
				return [...acc, ...fieldNames]
			}, [])

		const fieldHints = (): FieldHint[] => {
			const collectionKey = wire.getCollection().getFullName() || ""
			const [namespace] = component.path.parseKey(collectionKey)
			const usedFields = getUsedFields()
			const fieldsInWire = Object.keys(
				uesio.builder.useMetadataList(
					context,
					"FIELD",
					namespace,
					collectionKey
				) || {}
			)

			const fields = fieldsInWire.map((el) => ({
				used: getUsedFields().includes(el), // Used for sorting and greying out
				id: el,
			}))

			return fields.sort((a) => (a.used ? 1 : -1))
		}
		return fieldHints()
	}

	const fieldSuggestions = getFieldSuggestions()

	const handleAddField = (fieldId: string) => {
		const wireId = context.getWire()?.getId()
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

		// 3. Add field to column
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

		// 4. Refresh the wire
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
					opacity: open ? 1 : 0,
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

	return (
		<div onMouseLeave={() => setOpen(false)} className={classes.root}>
			<div
				onMouseEnter={() => setOpen(true)}
				onClick={() => setOpen(!open)}
				className={"fieldHint"}
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
								<div className={classes.fieldOptionslist}>
									{fieldSuggestions &&
										fieldSuggestions.map((field, index) => (
											<div
												onClick={() =>
													handleAddField(field.id)
												}
												className={classes.fieldOption}
												style={{
													opacity: field.used
														? "0.6"
														: 1,
												}}
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
	)
}

export default FieldHints
