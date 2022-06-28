import { FunctionComponent } from "react"
import { definition, component, hooks, metadata, styles } from "@uesio/ui"

interface MetadataPickerProps extends definition.UtilityProps {
	value: string
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	defaultNamespace?: string
	selectVariant?: string
	fieldWrapperVariant?: string
}

type MetadataItem = {
	key: string
}

const CustomSelect = component.getUtility("uesio/io.customselect")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const MetadataPicker: FunctionComponent<MetadataPickerProps> = (props) => {
	const {
		value,
		setValue,
		label,
		labelPosition,
		metadataType,
		context,
		grouping,
		//defaultNamespace,
		//selectVariant,
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

	const items: MetadataItem[] = metadata
		? Object.keys(metadata).map((key) => ({
				key,
		  }))
		: []

	const itemToString = (item: MetadataItem) => (item ? item.key : "")

	const tag = (ns: string, name: string, background: string) => (
		<>
			<div
				className={classes.namespacetag}
				style={{
					...(background && { backgroundColor: background }),
				}}
			>
				{ns}
			</div>
			<div className={classes.nametag}>{name}</div>
		</>
	)

	const renderer = (item: MetadataItem, highlighted: boolean) => {
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
		const [ns, name] = component.path.parseKey(item.key)
		const metadataInfo = metadata?.[item.key]

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
			<CustomSelect
				items={items}
				value={
					value
						? {
								key: value,
						  }
						: undefined
				}
				itemToString={itemToString}
				itemRenderer={(
					item: MetadataItem,
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
				setValue={(item: MetadataItem) => {
					setValue(item ? item.key : "")
				}}
			/>
		</FieldWrapper>
	)
}

MetadataPicker.displayName = "MetadataPicker"

export default MetadataPicker
