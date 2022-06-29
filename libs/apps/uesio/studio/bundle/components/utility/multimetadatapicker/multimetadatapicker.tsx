import { FunctionComponent } from "react"
import { definition, component, hooks, metadata, styles } from "@uesio/ui"

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

const CustomMultiSelect = component.getUtility("uesio/io.custommultiselect")
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
	const uesio = hooks.useUesio(props)

	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		throw new Error("Must provide either siteadmin or workspace context")
	}

	const classes = styles.useUtilityStyles(
		{
			itemwrapper: {
				padding: "6px",
				color: "white",
				display: "inline-block",
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
			nametag: {
				display: "inline-block",
				fontSize: "9pt",
				verticalAlign: "middle",
				color: "#333",
			},
		},
		props
	)

	const metadata = uesio.builder.useMetadataList(
		context,
		metadataType,
		"",
		grouping
	)

	const items: string[] = metadata
		? Object.keys(metadata).map((key) => key)
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

	const renderer = (item: string, highlighted: boolean) => {
		if (!item)
			return (
				<div
					className={styles.cx(classes.itemwrapper, classes.notfound)}
				>
					{tag(
						`No ${metadataType.toLowerCase()} Selected`,
						"",
						"#eee"
					)}
				</div>
			)
		const [ns, name] = component.path.parseKey(item)
		const metadataInfo = metadata?.[item]

		return (
			<div
				className={styles.cx(
					classes.itemwrapper,
					highlighted && classes.highlighteditem
				)}
			>
				{tag(ns, name, metadataInfo?.color || "#eee")}
			</div>
		)
	}

	return (
		<FieldWrapper
			labelPosition={labelPosition}
			variant={fieldWrapperVariant}
			label={label}
			context={context}
		>
			<CustomMultiSelect
				litems={items}
				value={value ? value : []}
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
					return renderer(item, highlighted)
				}}
				tagRenderer={renderer}
				context={context}
				setValue={(item: string[]) => {
					setValue(item ? item : [])
				}}
			/>
		</FieldWrapper>
	)
}

MultiMetadataPicker.displayName = "MultiMetadataPicker"

export default MultiMetadataPicker
