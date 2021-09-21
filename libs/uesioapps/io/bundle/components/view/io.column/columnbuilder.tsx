import { FC, useState } from "react"
import { definition, styles, component, util, hooks } from "@uesio/ui"
import Column, { getColumnFlexStyles } from "./column"
import { usePopper } from "react-popper"
import { Transition } from "react-transition-group"

import type { Placement } from "@popperjs/core"
import { updateWith } from "lodash"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
const Icon = component.registry.getUtility("io.icon")
const ColumnBuilder: FC<definition.BaseProps> = (props) => {
	const { path = "", context } = props
	const uesio = hooks.useUesio(props)
	const [metadataType, metadataItem, selectedPath] =
		uesio.builder.useSelectedNode()

	const { fromPath, toPath, makeFullPath } = component.path

	const collectionKey = context.getWire()?.getCollection().getFullName() || ""
	const [namespace] = component.path.parseKey(collectionKey)
	const [fieldHints, setFieldHints] = useState(false)

	const getUsedFields = (): string[] => {
		const formPath = toPath(path).slice(0, -3)
		const formDef = uesio.builder.useDefinition(
			makeFullPath(metadataType, metadataItem, fromPath(formPath))
		) as any

		// components filter
		return formDef?.columns.reduce((acc: string[], col: any) => {
			const columnData = Object.values(col)[0] as any
			const fields = columnData.components.filter(
				(el: any) => Object.keys(el)[0] === "io.field"
			)
			const fieldNames = fields.map((el: any) => el["io.field"].fieldId)
			return [...acc, ...fieldNames]
		}, [])
		// console.log({
		// 	fields,
		// })
	}
	const usedFields = getUsedFields()

	const wireFields = Object.keys(
		uesio.builder.useMetadataList(
			context,
			"FIELD",
			namespace,
			collectionKey
		) || {}
	)
	const fields1 = wireFields.map((el) => ({
		used: usedFields.includes(el),
		id: el,
	}))
	const fields = fields1.sort((a, b) => (a.used ? 1 : -1))

	// Transiion
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

	// Popper
	// const [referenceEl, setReferenceEl] = useState<HTMLDivElement | null>(null)
	// const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null)
	const [open, setOpen] = useState<boolean>(false)

	// Get template val set on parent layout def
	const layoutOverrides = (() => {
		if (!path) return {}
		const pathArray = component.path.fromArray(path)

		const pathToLayout = pathArray.slice(0, -3)
		const layoutDef = context.getInViewDef(pathToLayout) as any
		if (!layoutDef.template) return {}
		const template = layoutDef.template

		return getColumnFlexStyles(template, path)
	})()

	const classes = styles.useStyles(
		{
			root: {
				...layoutOverrides,
				"&:hover .fieldHint": {
					opacity: 0.7,
				},

				".fieldHint": {
					border: "2px dashed #74a5f0",
					borderRadius: "0.25em",
					height: "2em",
					padding: "5px",
					margin: "1em 0",
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
			context: props.context,
		}
	)

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

		const wireUpdate = uesio.signal.getHandler([
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		])

		wireUpdate && wireUpdate()
	}

	return (
		<BuildWrapper {...props} classes={classes}>
			<Column {...props} />

			<div
				onMouseLeave={() => setOpen(false)}
				className={classes.fieldHintWrapper}
			>
				<div
					onMouseEnter={() => setOpen(true)}
					// ref={setReferenceEl}
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
								<div
									// ref={setPopperEl}
									className={classes.fieldOptions}
								>
									<div className={classes.fieldOptionslist}>
										{fields &&
											fields.map((field, index) => (
												<div
													onClick={() =>
														handleAddField(field.id)
													}
													className={
														classes.fieldOption
													}
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
		</BuildWrapper>
	)
}

export default ColumnBuilder
