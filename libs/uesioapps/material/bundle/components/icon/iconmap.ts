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

type IconMap = {
	[key: string]: React.ComponentType<material.SvgIconProps>
}

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
} as IconMap

export default function getIcon(
	key?: string
): React.ComponentType<material.SvgIconProps> {
	const fallback = Close
	if (!key) {
		return fallback
	}
	const icon = iconMap[key]
	return icon || fallback
}
