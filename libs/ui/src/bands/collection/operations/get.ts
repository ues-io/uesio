import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { set } from "../index"

const getMetadata =
	(collectionName: string, context: Context): ThunkFunc =>
	async (dispatcher, getState, api) => {
		const response = await api.getCollectionMetadata(
			context,
			collectionName
		)
		dispatcher(set(response.collections))
		return context
	}

export default getMetadata
