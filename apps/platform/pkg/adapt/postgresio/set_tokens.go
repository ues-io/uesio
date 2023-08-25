package postgresio

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const TOKEN_DELETE_QUERY = "DELETE FROM public.tokens WHERE recordid = ANY($1) and collection = $2 and tenant = $3"
const TOKEN_INSERT_QUERY = "INSERT INTO public.tokens (recordid,token,collection,tenant,readonly) VALUES ($1,$2,$3,$4,$5)"

func (c *Connection) SetRecordAccessTokens(request *adapt.SaveOp, session *sess.Session) error {

	tenantID := session.GetTenantID()
	collectionName := request.Metadata.GetFullName()
	batch := &pgx.Batch{}

	numDeletes := len(request.Deletes)
	numUpdates := len(request.Updates)
	resetTokenIDs := make([]string, numDeletes+numUpdates)

	// First loop over the updates and deletes to get the ids to delete
	for i, change := range request.Updates {
		resetTokenIDs[i] = change.IDValue
	}
	for i, change := range request.Deletes {
		resetTokenIDs[numUpdates+i] = change.IDValue
	}

	if len(resetTokenIDs) > 0 {
		batch.Queue(TOKEN_DELETE_QUERY, resetTokenIDs, collectionName, tenantID)
	}

	err := request.LoopChanges(func(change *adapt.ChangeItem) error {
		if request.Metadata.IsWriteProtected() {
			for _, token := range change.ReadWriteTokens {
				batch.Queue(
					TOKEN_INSERT_QUERY,
					change.IDValue,
					token,
					collectionName,
					tenantID,
					false,
				)
			}
			for _, token := range change.ReadTokens {
				batch.Queue(
					TOKEN_INSERT_QUERY,
					change.IDValue,
					token,
					collectionName,
					tenantID,
					true,
				)
			}
		}
		return nil
	})
	if err != nil {
		return err
	}

	results := c.GetClient().SendBatch(context.Background(), batch)
	execCount := batch.Len()
	for i := 0; i < execCount; i++ {
		_, err := results.Exec()
		if err != nil {
			results.Close()
			return err
		}
	}
	results.Close()

	return nil

}
