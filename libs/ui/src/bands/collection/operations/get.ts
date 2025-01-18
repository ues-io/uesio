import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { set } from "../index"
import { platform } from "../../../platform/platform"

const getMetadata = async (collectionName: string, context: Context) => {
  const response = await platform.getCollectionMetadata(context, collectionName)
  dispatch(set(response.collections))
  return context
}

export default getMetadata
