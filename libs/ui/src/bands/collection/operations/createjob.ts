import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { Spec } from "../../../definition/definition"

const createJob =
	(collection: string, context: Context): ThunkFunc =>
	async (dispatcher, getState, api) => {
		const spec: Spec = {
			jobtype: "EXPORT",
			collection,
			filetype: "CSV",
		}
		await api.createJob(context, spec)
		return context
	}

export default createJob
