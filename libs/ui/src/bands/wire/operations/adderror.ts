import { Context } from "../../../context/context"
import { addError } from ".."
import { ThunkFunc } from "../../../store/store"

export default (
		entity: string,
		recordId: string,
		fieldId: string,
		message: string
	): ThunkFunc =>
	(dispatch) => {
		console.log("add error")
		dispatch(
			addError({
				entity,
				recordId,
				fieldId,
				message,
			})
		)
		return context
	}
