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

	db := c.GetClient()

	tenantID := session.GetTenantID()

	resetTokenIDs := make([]string, 0, len(request.Deletes)+len(request.Updates))

	collectionName := request.Metadata.GetFullName()

	batch := &pgx.Batch{}

	// First loop over the updates and deletes to get the ids to delete
	err := request.LoopUpdates(func(change *adapt.ChangeItem) error {
		resetTokenIDs = append(resetTokenIDs, change.IDValue)
		return nil
	})
	if err != nil {
		return err
	}

	err = request.LoopDeletes(func(change *adapt.ChangeItem) error {
		resetTokenIDs = append(resetTokenIDs, change.IDValue)
		return nil
	})
	if err != nil {
		return err
	}

	if len(resetTokenIDs) > 0 {
		batch.Queue(TOKEN_DELETE_QUERY, resetTokenIDs, collectionName, tenantID)
	}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {
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

	results := db.SendBatch(context.Background(), batch)
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
