import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { Spec } from "../../../definition/definition"

const createJob =
	(wirename: string, context: Context): ThunkFunc =>
	async (dispatcher, getState, api) => {
		const wire = context.getWireByName(wirename)
		if (!wire) throw new Error("Could not get wire")

		const collection = wire.getCollection().getFullName()
		const conditions = wire.getConditions()

		console.log({ collection, conditions })

		const spec: Spec = {
			jobtype: "EXPORT",
			filetype: "CSV",
			collection,
			conditions,
		}
		await api.createJob(context, spec)
		return context
	}

export default createJob
