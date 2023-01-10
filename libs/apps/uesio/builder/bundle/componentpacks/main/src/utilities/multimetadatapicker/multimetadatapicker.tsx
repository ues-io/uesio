import { FunctionComponent } from "react"
import { definition, component, api, metadata, styles } from "@uesio/ui"
interface MultiMetadataPickerProps extends definition.UtilityProps {
	value: string[]
	setValue: (value: string[]) => void
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	defaultNamespace?: string
	selectVariant?: string
	fieldWrapperVariant?: string
}

const Icon = component.getUtility("uesio/io.icon")
const CustomSelect = component.getUtility("uesio/io.customselect")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const MultiMetadataPicker: FunctionComponent<MultiMetadataPickerProps> = (
	props
) => {
	const {
		value,
		setValue,
		label,
		labelPosition,
		metadataType,
		context,
		grouping,
		fieldWrapperVariant,
	} = props

	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		throw new Error("Must provide either siteadmin or workspace context")
	}

	const classes = styles.useUtilityStyles(
		{
			itemwrapper: {
				padding: "6px",
				color: "white",
				display: "block",
			},
			notfound: {
				textTransform: "capitalize",
				color: "#999",
			},
			namespacetag: {
				display: "inline-block",
				backgroundColor: "#ddd",
				padding: "6px 10px",
				marginRight: "8px",
				borderRadius: "14px",
				fontSize: "8pt",
				verticalAlign: "middle",
			},
			highlighteditem: {
				backgroundColor: "#eee",
			},
			editbutton: {
				color: "#444",
				border: "none",
				outline: "none",
				padding: "6px 10px 6px 0",
				backgroundColor: "transparent",
				fontSize: "initial",
				cursor: "pointer",
			},
			nametag: {
				display: "inline-block",
				fontSize: "9pt",
				verticalAlign: "middle",
				color: "#333",
			},
		},
		props
	)

	const [metadata, error] = api.builder.useMetadataList(
		context,
		metadataType,
		"",
		grouping
	)

	const items: string[] = metadata
		? Object.keys(metadata).filter((el) => !value.includes(el))
		: []

	const itemToString = (item: string) => (item ? item : "")

	const tag = (ns: string, name: string, background: string) => (
		<>
			<div
				className={classes.namespacetag}
				style={{
					...(background && { backgroundColor: background }),
				}}
			>
				<span>{ns}</span>
			</div>
			<span className={classes.nametag}>{name}</span>
		</>
	)

	const renderer = (
		item: string,
		highlighted: boolean,
		selected: boolean
	) => {
		const [ns, name] = component.path.parseKey(item)
		const metadataInfo = metadata?.[item]

		return (
			<div
				key={item}
				className={styles.cx(
					classes.itemwrapper,
					highlighted && classes.highlighteditem
				)}
				style={{
					...(selected && {
						display: "inline-flex",
						alignItems: "center",
						margin: "2.5px",
					}),
				}}
			>
				{tag(ns, name, metadataInfo?.color || "#eee")}
				{selected && (
					<button
						tabIndex={-1}
						className={classes.editbutton}
						type="button"
						onClick={(event) => {
							event.nativeEvent.preventDefault()
							setValue(value.filter((el) => el !== item))
						}}
					>
						<Icon icon="close" context={context} />
					</button>
				)}
			</div>
		)
	}

	return (
		<FieldWrapper
			labelPosition={labelPosition}
			variant={fieldWrapperVariant as metadata.MetadataKey}
			label={label}
			context={context}
			errors={error ? [{ message: error }] : []}
		>
			<CustomSelect
				items={items}
				value={value}
				itemToString={itemToString}
				itemRenderer={(
					item: string,
					index: number,
					highlightedIndex: number
				) => {
					if (!item) {
						return null
					}
					const highlighted = index === highlightedIndex
					return renderer(item, highlighted, false)
				}}
				allowSearch={false}
				tagRenderer={value.map((el) => el && renderer(el, false, true))}
				context={context}
				setValue={(item: string) => {
					if (!item) return
					const newValue = value.includes(item)
						? value.filter((el) => el !== item)
						: [...value, item]

					return setValue(newValue)
				}}
			/>
		</FieldWrapper>
	)
}

MultiMetadataPicker.displayName = "MultiMetadataPicker"

export default MultiMetadataPicker
