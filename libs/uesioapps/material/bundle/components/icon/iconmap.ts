import Close from "@material-ui/icons/Close"
import CheckCircleOutline from "@material-ui/icons/CheckCircleOutline"
import ReportProblemOutlined from "@material-ui/icons/ReportProblemOutlined"
import ErrorOutline from "@material-ui/icons/ErrorOutline"
import InfoOutlined from "@material-ui/icons/InfoOutlined"
import Launch from "@material-ui/icons/Launch"
import Visibility from "@material-ui/icons/Visibility"
import Delete from "@material-ui/icons/Delete"
import Description from "@material-ui/icons/Description"

import { material } from "@uesio/ui"

type IconMap<K extends string> = {
	[key in K]: React.ComponentType<material.SvgIconProps>
}

/*
const iconMap: IconMap<
	| "close"
	| "success"
	| "warning"
	| "error"
	| "info"
	| "open"
	| "preview"
	| "delete"
	| "file"
> = {
	close: Close,
	success: CheckCircleOutline,
	warning: ReportProblemOutlined,
	error: ErrorOutline,
	info: InfoOutlined,
	open: Launch,
	preview: Visibility,
	delete: Delete,
	file: Description,
}
*/

const iconMap = {
	close: Close,
	success: CheckCircleOutline,
	warning: ReportProblemOutlined,
	error: ErrorOutline,
	info: InfoOutlined,
	open: Launch,
	preview: Visibility,
	delete: Delete,
	file: Description,
}

const dictionary: Record<string, React.ComponentType<material.SvgIconProps>> = {
	close: Close,
	success: CheckCircleOutline,
	warning: ReportProblemOutlined,
	error: ErrorOutline,
	info: InfoOutlined,
	open: Launch,
	preview: Visibility,
	delete: Delete,
	file: Description,
}

console.log("dico", dictionary)

export default function getIcon(
	key?: keyof iconMap
): React.ComponentType<material.SvgIconProps> {
	const fallback = Close
	if (!key) {
		return fallback
	}
	const icon = iconMap[key]
	return icon || fallback
}
