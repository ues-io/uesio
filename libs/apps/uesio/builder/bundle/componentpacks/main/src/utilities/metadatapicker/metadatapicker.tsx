import { FunctionComponent } from "react"
import { definition, component, api, metadata, styles } from "@uesio/ui"
import NamespaceLabel from "../namespacelabel/namespacelabel"

interface MetadataPickerProps extends definition.UtilityProps {
	value: string | undefined
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	defaultNamespace?: string
	selectVariant?: string
	fieldWrapperVariant?: metadata.MetadataKey
}

type MetadataItem = string

const MetadataPicker: FunctionComponent<MetadataPickerProps> = (props) => {
	const CustomSelect = component.getUtility("uesio/io.customselect")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const Icon = component.getUtility("uesio/io.icon")
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
				color: "#444",
				display: "flex",
				alignItems: "center",
				padding: "8px",
				fontSize: "8pt",
			},
			notfound: {
				textTransform: "capitalize",
				color: "#999",
				fontSize: "8pt",
				padding: "5px",
			},
			namespacetag: {
				display: "inline-block",
				backgroundColor: "#ddd",
				padding: "6px 10px",
				marginRight: "4px",
				borderRadius: "14px",
				fontSize: "8pt",
				verticalAlign: "middle",
			},
			highlighteditem: {
				backgroundColor: "#eee",
			},
			nametag: {
				display: "inline-block",
				fontSize: "9pt",
				verticalAlign: "middle",
				color: "#333",
			},
			editbutton: {
				color: "#777",
				border: "none",
				outline: "none",
				padding: "0px 5px 0px 2px",
				backgroundColor: "transparent",
				fontSize: "initial",
				cursor: "pointer",
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

	const items: MetadataItem[] = metadata ? Object.keys(metadata) : []

	const renderer = (
		item: MetadataItem | null,
		highlighted: boolean,
		selected?: boolean
	) => {
		if (!item)
			return (
				<div
					className={styles.cx(classes.itemwrapper, classes.notfound)}
				>
					{`No ${metadataType.toLowerCase()} Selected`}
				</div>
			)

		return (
			<div
				className={styles.cx(
					classes.itemwrapper,
					highlighted && classes.highlighteditem
				)}
				style={{
					...(selected && {
						padding: "0 8px 3px 8px",
						display: "inline-flex",
					}),
				}}
			>
				<NamespaceLabel context={context} metadatakey={item} />
				{selected && (
					<button
						tabIndex={-1}
						className={classes.editbutton}
						type="button"
						onClick={(event) => {
							event.preventDefault() // Prevent the label from triggering
							setValue("")
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
			variant={fieldWrapperVariant}
			label={label}
			context={context}
			errors={error ? [{ message: error }] : []}
		>
			<CustomSelect
				items={items}
				value={value}
				itemRenderer={(
					item: MetadataItem,
					index: number,
					highlightedIndex: number
				) => {
					const isHighlighted = index === highlightedIndex
					return renderer(item, isHighlighted)
				}}
				tagRenderer={renderer(value || null, false, true)}
				context={context}
				setValue={(item: MetadataItem) => setValue(item || "")}
			/>
		</FieldWrapper>
	)
}

MetadataPicker.displayName = "MetadataPicker"

export default MetadataPicker
