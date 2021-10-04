import { FC, useState, useEffect } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"

import { hooks, component, definition, builder } from "@uesio/ui"
interface T extends definition.BaseProps {
	fieldId: string
	valueAPI: builder.ValueAPI
	anchorEl: HTMLDivElement | null
}
const Popper = component.registry.getUtility("io.popper")
const IOButton = component.registry.getUtility("io.button")
const IOIcon = component.registry.getUtility("io.icon")

const { makeFullPath, parseKey } = component.path

function flattenObj(
	obj: any,
	parent?: string,
	res: { [key: string]: any } = {}
) {
	for (const key in obj) {
		const propName = parent ? parent + "_" + key : key
		if (typeof obj[key] === "object") {
			flattenObj(obj[key], propName, res)
		} else {
			res[propName] = obj[key]
		}
	}
	return res
}

const useHighlightedFields = () => {
	const [highlightedFields, setHighlightedFields] = useState<
		NodeListOf<HTMLDivElement> | []
	>([])

	const updateHighlightedFields = (fieldId: string) => {
		// Remove border from currently highlighted fields
		if (highlightedFields.length)
			highlightedFields.forEach((el) => (el.style.border = ""))

		const fields = document.querySelectorAll<HTMLDivElement>(
			`[data-fieldid="${fieldId}"]`
		)
		setHighlightedFields(fields)
		fields.forEach((el) => (el.style.border = "1px solid red"))
	}

	return updateHighlightedFields
}

const FieldDelete: FC<T> = (props) => {
	const { path, context, valueAPI, anchorEl, fieldId } = props
	const uesio = hooks.useUesio(props)

	// Field deletion \
	const [affectedPaths, setAffectedPaths] = useState<string[][]>([])
	const updateHighlightedFields = useHighlightedFields()
	const [showWarning, setShowWarning] = useState(false)
	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.

	const viewDef = uesio.builder.useDefinition(
		makeFullPath("viewdef", context.getViewDefId() || "", "")
	) as any

	useEffect(() => {
		fieldRemover.handleFieldRemove(fieldId)
	}, [fieldId])

	const fieldRemover = {
		handleFieldRemove: (fieldId: string) => {
			setAffectedPaths([])
			setShowWarning(false)
			const brokenPaths = fieldRemover.getDeprecatedFields(fieldId)

			// Field is used in viewDef
			if (brokenPaths.length) {
				const affectedPaths = brokenPaths.map((p) =>
					p.split("_").slice(0, -2)
				)
				setAffectedPaths(affectedPaths)
				console.log({ affectedPaths })
				updateHighlightedFields(fieldId)
				setShowWarning(true)
				return
			}

			valueAPI.remove(`${path}["fields"]["${fieldId}"]`)
		},

		getDeprecatedFields: (fieldId: string) => {
			const flatObject = flattenObj(viewDef.components, "components")
			return Object.entries(flatObject)
				.filter(([key, value]) => value === fieldId)
				.map(([key]) => key)
		},
		removePathsFromDef: (paths: string[][]) => {
			console.log({ path })
			valueAPI.remove(`${path}["fields"]["${fieldId}"]`)

			paths.forEach((pathArray) =>
				valueAPI.remove(component.path.fromPath(pathArray))
			)
		},
	}

	return affectedPaths.length && showWarning ? (
		<Popper
			referenceEl={anchorEl}
			context={context}
			placement="right"
			onOutsideClick={() => setShowWarning(false)}
		>
			<div style={{ padding: "8px", fontSize: "14px" }}>
				<p style={{ fontWeight: 700 }}>
					<span style={{ color: "red" }}>
						<IOIcon context={context} icon={"error"} />{" "}
					</span>
					{fieldId} is referenced in this view.
				</p>
				<p>
					Do you want to delete the field and{" "}
					{affectedPaths.length > 1 ? "the " : ""}
					{affectedPaths.length} element
					{affectedPaths.length > 1 ? "s" : ""} using this field?
				</p>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<IOButton
						variant="io.primary"
						label="Cancel"
						context={context}
						icon={
							<IOIcon
								context={context}
								icon="arrow_back"
								variant="studio.buttonicon"
							/>
						}
						onClick={() => setShowWarning(false)}
					/>
					<IOButton
						variant="io.primary"
						label="Delete "
						context={context}
						icon={
							<IOIcon
								context={context}
								icon="delete"
								variant="studio.buttonicon"
							/>
						}
						onClick={() => {
							fieldRemover.removePathsFromDef(affectedPaths)
							setShowWarning(false)
						}}
					/>
				</div>
			</div>
		</Popper>
	) : null
}

export default FieldDelete
