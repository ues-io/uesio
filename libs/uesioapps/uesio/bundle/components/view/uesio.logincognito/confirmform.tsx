import { definition } from "@uesio/ui"
import {
	FunctionComponent,
	useState,
	ChangeEvent,
	Dispatch,
	SetStateAction,
} from "react"
import { useLoginStyles } from "./logincognito"
import { TextField, Button, Typography, Link } from "@material-ui/core"

interface ConfirmFormProps extends definition.BaseProps {
	setMode: Dispatch<SetStateAction<string>>
	confirm: (verificationCode: string) => void
}

const ConfirmForm: FunctionComponent<ConfirmFormProps> = (props) => {
	const { setMode, confirm } = props
	const classes = useLoginStyles(props)
	const [verificationCode, setVerificationCode] = useState("")

	return (
		<>
			<TextField
				label="Verification Code"
				variant="outlined"
				type="password"
				fullWidth
				size="small"
				className={classes.textfield}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					setVerificationCode(e.target.value)
				}
			/>
			<Button onClick={() => setMode("")} className={classes.button}>
				Back to Signup
			</Button>
			<Button
				variant="contained"
				color="primary"
				className={classes.button}
				onClick={() => confirm(verificationCode)}
			>
				Confirm
			</Button>
			<div>
				<Typography variant="body2" component="span">
					Lost your code?&nbsp;
				</Typography>
				<Link
					component="span"
					variant="body2"
					onClick={() => console.info("I'm a button.")}
				>
					Resend code
				</Link>
			</div>
		</>
	)
}

export default ConfirmForm
