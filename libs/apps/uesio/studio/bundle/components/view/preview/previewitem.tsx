import { Dispatch, FunctionComponent, SetStateAction } from "react"
import {
	definition,
	hooks,
	component,
	collection as col,
	wire,
	styles,
} from "@uesio/ui"
import { ParamDefinition } from "./preview"

interface Props extends definition.BaseProps {
	fieldKey: string
	item: ParamDefinition
	lstate: Record<string, string>
	setLstate: Dispatch<SetStateAction<Record<string, string>>>
}

const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")
const AutoComplete = component.registry.getUtility("uesio/io.autocomplete")

const PreviewItem: FunctionComponent<Props> = (props) => {
	const { context, fieldKey, item, lstate, setLstate } = props
	const { collectionId } = item
	const uesio = hooks.useUesio(props)

	const collection = uesio.collection.useCollection(context, collectionId)
	if (!collection) return null

	const fieldName = collection.getNameField()?.getId()

	if (!fieldName) return null

	const itemToString = (item: wire.PlainWireRecord | undefined) =>
		item ? `${item[fieldName]}` : ""

	const classes = styles.useUtilityStyles(
		{
			div: {
				boxShadow: "0 2px 5px #888",
				background: "#FFF",
				cursor: "pointer",
			},
			title: { fontWeight: "bold" },
			subtitle: {
				fontFamily: "monospace",
				whiteSpace: "pre",
			},
		},
		props
	)

	return (
		<FieldWrapper context={context} label={fieldKey} key={fieldKey}>
			<AutoComplete
				context={context}
				variant="io.default"
				value={lstate[fieldKey]}
				setValue={(value: wire.PlainWireRecord) => {
					const idValue = value && (value[col.ID_FIELD] as string)
					if (idValue && idValue !== "") {
						setLstate({
							...lstate,
							[fieldKey]: idValue,
						})
					}
				}}
				itemToString={itemToString}
				itemRenderer={(item: wire.PlainWireRecord) => (
					<div className={classes.div} style={{}}>
						<div className={classes.title}>{item[fieldName]}</div>
						<span className={classes.subtitle}>
							{item[col.ID_FIELD]}
						</span>
					</div>
				)}
				getItems={async (
					searchText: string,
					callback: (items: wire.PlainWireRecord[]) => void
				) => {
					const searchFields = [fieldName]
					const returnFields = [fieldName]
					const result = await uesio.platform.loadData(context, {
						wires: [
							{
								wire: "search",
								query: true,
								collection: collectionId,
								fields: returnFields.map((fieldName) => ({
									id: fieldName,
								})),
								conditions: [
									{
										type: "SEARCH",
										value: searchText,
										valueSource: "VALUE",
										active: true,
										fields: searchFields,
									},
								],
							},
						],
					})
					callback(result.wires[0].data || [])
				}}
			/>
		</FieldWrapper>
	)
}

export default PreviewItem
