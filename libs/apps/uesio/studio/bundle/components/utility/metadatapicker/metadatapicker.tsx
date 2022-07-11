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
	fieldWrapperVariant?: metadata.MetadataKey
}

type MetadataItem = string

const CustomSelect = component.getUtility("uesio/io.customselect")
const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
const Icon = component.getUtility("uesio/io.icon")

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
				color: "white",
				display: "flex",
				alignItems: "center",
				margin: "5px 0",
				padding: "0 3px",
			},
			notfound: {
				textTransform: "capitalize",
				color: "#999",
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
				color: "#444",
				border: "none",
				outline: "none",
				padding: "0px 5px 0px 0",
				backgroundColor: "transparent",
				fontSize: "initial",
				cursor: "pointer",
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

	const items: MetadataItem[] = metadata ? Object.keys(metadata) : []

	const tag = (
		ns: string,
		name: string,
		background: string,
		selected: boolean
	) => (
		<>
			<span
				className={classes.namespacetag}
				style={{
					...(background && { backgroundColor: background }),
					...(selected && {
						borderRight: "2px solid white",
						borderTop: "2px solid white",
						marginTop: "-2px",
						marginBottom: "-2px",
						borderBottom: "2px solid white",
					}),
				}}
			>
				{ns}
			</span>
			<span
				style={{
					...(selected && {
						whiteSpace: "nowrap",
						overflow: "hidden",
						marginRight: "4px",
						maxWidth: "44px",
						textOverflow: "ellipsis",
					}),
				}}
				className={classes.nametag}
			>
				{name}
			</span>
		</>
	)

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
					{tag(
						`No ${metadataType.toLowerCase()} Selected`,
						"",
						"#eee",
						false
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
				style={{
					...(selected && {
						padding: "0",
						display: "inline-flex",
						borderRadius: "14px",
						backgroundColor: "#dcdcdc",
					}),
				}}
			>
				{tag(ns, name, metadataInfo?.color || "#eee", !!selected)}
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
