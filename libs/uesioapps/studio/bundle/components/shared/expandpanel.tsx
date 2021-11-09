import { FunctionComponent, SyntheticEvent, ChangeEvent } from "react"

const IconButton = component.registry.getUtility("io.iconbutton")
import { component, definition } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	title: string
	defaultExpanded: boolean
	action?: string
	actionColor?: string
	actionOnClick?: () => void
	onSearch?: (searchValue: string) => void
	searchValue?: string
}

const IOExpandPanel = component.registry.getUtility("io.expandpanel")
const TitleBar = component.registry.getUtility("io.titlebar")

const ExpandPanel: FunctionComponent<Props> = ({
	children,
	action,
	title,
	defaultExpanded,
	actionOnClick,
	context,
	styles,
	onSearch,
	searchValue,
}) => (
	<IOExpandPanel
		defaultExpanded={defaultExpanded}
		context={context}
		styles={styles}
		toggle={
			<TitleBar
				title={title}
				context={context}
				actions={
					<>
						{action && (
							<IconButton
								onClick={(event: SyntheticEvent): void => {
									event.stopPropagation()
									actionOnClick?.()
								}}
								icon={action}
								context={context}
							/>
						)}
						{onSearch && (
							<input
								value={searchValue}
								style={{
									outline: "none",
									padding: "4px",
									fontSize: "9pt",
									border: "none",
									background: "#eee",
									borderRadius: "4px",
								}}
								onChange={(
									event: ChangeEvent<HTMLInputElement>
								) => {
									onSearch(event.target.value)
								}}
								onClick={(event: SyntheticEvent): void => {
									event.stopPropagation()
								}}
								type="search"
								placeholder="Search..."
							/>
						)}
					</>
				}
				variant="studio.expandpanel"
			/>
		}
		variant="studio.expandpanel"
	>
		{children}
	</IOExpandPanel>
)

export default ExpandPanel
