package postgresio

import (
	"github.com/francoispqt/gojay"
	"github.com/jackc/pgx/v5"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

const INSERT_QUERY = "INSERT INTO public.data (id,uniquekey,owner,createdby,updatedby,createdat,updatedat,collection,tenant,autonumber,fields) VALUES ($1,$2,$3,$4,$5,to_timestamp($6),to_timestamp($7),$8,$9,$10,$11)"
const UPDATE_QUERY = "UPDATE public.data SET uniquekey = $2, owner = $3, createdby = $4, updatedby = $5, createdat = to_timestamp($6), updatedat = to_timestamp($7), fields = fields || $10 WHERE id = $1 and collection = $8 and tenant = $9"
const DELETE_QUERY = "DELETE FROM public.data WHERE id = ANY($1) and collection = $2 and tenant = $3"

func (c *Connection) Save(request *wire.SaveOp, session *sess.Session) error {

	db := c.GetClient()

	tenantID := session.GetTenantID()

	collectionName := request.Metadata.GetFullName()

	batch := &pgx.Batch{}

	err := request.LoopChanges(func(change *wire.ChangeItem) error {

		fieldJSON, err := gojay.MarshalJSONObject(change)
		if err != nil {
			return err
		}

		//We trust the owner send by the client
		//Then we'll see if it can change it
		ownerID, err := change.GetProposedOwnerID()
		if err != nil {
			return err
		}

		createdByID, err := change.GetCreatedByID()
		if err != nil {
			return err
		}

		updatedByID, err := change.GetUpdatedByID()
		if err != nil {
			return err
		}

		createdAt, err := change.GetFieldAsInt(commonfields.CreatedAt)
		if err != nil {
			return err
		}

		updatedAt, err := change.GetFieldAsInt(commonfields.UpdatedAt)
		if err != nil {
			return err
		}

		fullRecordID := change.IDValue
		uniqueID := change.UniqueKey

		if change.IsNew {
			batch.Queue(INSERT_QUERY, fullRecordID, uniqueID, ownerID, createdByID, updatedByID, createdAt, updatedAt, collectionName, tenantID, change.Autonumber, fieldJSON)
		} else {
			batch.Queue(UPDATE_QUERY, fullRecordID, uniqueID, ownerID, createdByID, updatedByID, createdAt, updatedAt, collectionName, tenantID, fieldJSON)
		}

		return nil
	})
	if err != nil {
		return err
	}

	deleteCount := len(request.Deletes)
	if deleteCount > 0 {
		deleteIDs := make([]string, deleteCount)
		for i, delete := range request.Deletes {
			deleteIDs[i] = delete.IDValue
		}
		batch.Queue(DELETE_QUERY, deleteIDs, collectionName, tenantID)
	}

	results := db.SendBatch(c.ctx, batch)
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
