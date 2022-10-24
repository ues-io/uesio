package postgresio

import (
	"context"
	"fmt"

	"github.com/francoispqt/gojay"
	"github.com/jackc/pgx/v4"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const INSERT_QUERY = "INSERT INTO public.data (id,uniquekey,collection,tenant,autonumber,fields) VALUES ($1,$2,$3,$4,$5,$6)"
const UPDATE_QUERY = "UPDATE public.data SET uniquekey = $2, fields = fields || $4 WHERE id = $1 and collection = $3"
const DELETE_QUERY = "DELETE FROM public.data WHERE id = ANY($1) and collection = $2"
const TOKEN_DELETE_QUERY = "DELETE FROM public.tokens WHERE fullid = ANY($1)"
const TOKEN_INSERT_QUERY = "INSERT INTO public.tokens (fullid,recordid,token,collection,tenant,readonly) VALUES ($1,$2,$3,$4,$5,$6)"

func (c *Connection) Save(request *adapt.SaveOp, session *sess.Session) error {

	db := c.GetClient()

	tenantID := session.GetTenantID()

	readWriteTokens := map[string][]string{}
	readTokens := map[string][]string{}
	resetTokenIDs := []string{}

	collectionName, err := getDBCollectionName(request.Metadata, tenantID)
	if err != nil {
		return err
	}

	batch := &pgx.Batch{}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {

		fieldJSON, err := gojay.MarshalJSONObject(change)
		if err != nil {
			return err
		}
		fullRecordID := makeDBId(collectionName, change.IDValue)
		uniqueID := makeDBId(collectionName, change.UniqueKey)

		if change.IsNew {
			batch.Queue(INSERT_QUERY, fullRecordID, uniqueID, collectionName, tenantID, change.Autonumber, fieldJSON)
		} else {
			batch.Queue(UPDATE_QUERY, fullRecordID, uniqueID, collectionName, fieldJSON)
		}

		if request.Metadata.IsWriteProtected() {
			if !change.IsNew {
				resetTokenIDs = append(resetTokenIDs, fullRecordID)
			}
			readWriteTokens[fullRecordID] = change.ReadWriteTokens
			readTokens[fullRecordID] = change.ReadTokens
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
			deleteIDs[i] = makeDBId(collectionName, delete.IDValue)
		}
		batch.Queue(DELETE_QUERY, deleteIDs, collectionName)
	}

	collectionNameLength := len(collectionName) + 1

	if len(resetTokenIDs) > 0 {
		batch.Queue(TOKEN_DELETE_QUERY, resetTokenIDs)
	}

	if len(readWriteTokens) > 0 {
		for key, tokens := range readWriteTokens {
			for _, token := range tokens {
				batch.Queue(
					TOKEN_INSERT_QUERY,
					key,
					key[collectionNameLength:],
					token,
					collectionName,
					tenantID,
					false,
				)
			}
		}
	}

	if len(readTokens) > 0 {
		for key, tokens := range readTokens {
			for _, token := range tokens {
				batch.Queue(
					TOKEN_INSERT_QUERY,
					key,
					key[collectionNameLength:],
					token,
					collectionName,
					tenantID,
					true,
				)
			}
		}
	}

	results := db.SendBatch(context.Background(), batch)
	execCount := batch.Len()
	for i := 0; i < execCount; i++ {
		_, err := results.Exec()
		if err != nil {
			fmt.Println("Error saving: " + request.Metadata.GetFullName())
			results.Close()
			return err
		}
	}
	results.Close()

	return nil
}
