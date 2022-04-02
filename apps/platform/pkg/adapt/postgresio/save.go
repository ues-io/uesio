package postgresio

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/francoispqt/gojay"
	"github.com/jackc/pgx/v4"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

const INSERT_QUERY = "INSERT INTO public.data (id,collection,tenant,autonumber,fields) VALUES ($1,$2,$3,$4,$5)"
const UPDATE_QUERY = "UPDATE public.data SET fields = fields || $3 WHERE id = $1 and collection = $2"
const DELETE_QUERY = "DELETE FROM public.data WHERE id = ANY($1) and collection = $2"
const TOKEN_DELETE_QUERY = "DELETE FROM public.tokens WHERE recordid = ANY($1) and collection = $2"
const TOKEN_INSERT_QUERY = "INSERT INTO public.tokens (recordid,token,collection,tenant,readonly) VALUES ($1,$2,$3,$4,$5)"

type DataMarshaler struct {
	Data     loadable.Item
	Metadata *adapt.CollectionMetadata
}

func (dm *DataMarshaler) MarshalJSONObject(enc *gojay.Encoder) {

	err := dm.Data.Loop(func(fieldID string, value interface{}) error {
		fieldMetadata, err := dm.Metadata.GetField(fieldID)
		if err != nil {
			return err
		}

		if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "LIST" || fieldMetadata.Type == "MULTISELECT" {
			jsonValue, err := json.Marshal(value)
			if err != nil {
				return errors.New("Error converting from map to json: " + fieldMetadata.GetFullName())
			}
			ej := gojay.EmbeddedJSON(jsonValue)
			enc.AddEmbeddedJSONKey(fieldID, &ej)
			return nil
		}

		if adapt.IsReference(fieldMetadata.Type) {
			refValue, err := adapt.GetReferenceKey(value)
			if err != nil {
				return errors.New("Error converting reference field: " + fieldMetadata.GetFullName() + " : " + err.Error())
			}
			if refValue == "" {
				return nil
			}
			enc.StringKey(fieldID, refValue)
			return nil
		}

		if fieldMetadata.Type == "TIMESTAMP" {
			enc.Int64Key(fieldID, value.(int64))
			return nil
		}

		if fieldMetadata.Type == "NUMBER" {
			enc.Float64Key(fieldID, value.(float64))
			return nil
		}

		if fieldMetadata.Type == "CHECKBOX" {
			enc.BoolKey(fieldID, value.(bool))
			return nil
		}

		enc.StringKey(fieldID, value.(string))

		return nil
	})
	if err != nil {
		fmt.Println("Got this dumb error: " + err.Error())
	}
}

func (dm *DataMarshaler) IsNil() bool {
	return dm == nil
}

// Save function
func (c *Connection) Save(request *adapt.SaveOp) error {

	credentials := c.credentials
	db := c.GetClient()
	metadata := c.metadata

	tenantID := credentials.GetTenantID()

	recordsIDsList := map[string][]string{}

	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	batch := &pgx.Batch{}

	for _, change := range request.Inserts {

		marshaler := &DataMarshaler{
			Data:     change.FieldChanges,
			Metadata: collectionMetadata,
		}

		fieldJSON, err := gojay.MarshalJSONObject(marshaler)
		if err != nil {
			return err
		}

		fullRecordID := fmt.Sprintf("%s:%s", collectionName, change.IDValue)

		batch.Queue(INSERT_QUERY, fullRecordID, collectionName, tenantID, change.Autonumber, fieldJSON)

		if collectionMetadata.Access == "protected" {
			recordsIDsList[fullRecordID] = change.ReadWriteTokens
		}

	}

	for _, change := range request.Updates {

		marshaler := &DataMarshaler{
			Data:     change.FieldChanges,
			Metadata: collectionMetadata,
		}

		fieldJSON, err := gojay.MarshalJSONObject(marshaler)
		if err != nil {
			return err
		}

		fullRecordID := fmt.Sprintf("%s:%s", collectionName, change.IDValue)

		batch.Queue(UPDATE_QUERY, fullRecordID, collectionName, fieldJSON)

		if collectionMetadata.Access == "protected" {
			recordsIDsList[fullRecordID] = change.ReadWriteTokens
		}
	}

	deleteCount := len(request.Deletes)
	if deleteCount > 0 {
		deleteIDs := make([]string, deleteCount)
		for i, delete := range request.Deletes {
			deleteIDs[i] = fmt.Sprintf("%s:%s", collectionName, delete.IDValue)
		}
		fmt.Println(deleteIDs)
		batch.Queue(DELETE_QUERY, deleteIDs, collectionName)
	}

	tokenInsertCount := len(recordsIDsList)

	if tokenInsertCount > 0 {
		tokenDeleteIDs := make([]string, tokenInsertCount)
		i := 0
		for key := range recordsIDsList {
			tokenDeleteIDs[i] = key
			i++
		}

		batch.Queue(TOKEN_DELETE_QUERY, tokenDeleteIDs, collectionName)

		for key, tokens := range recordsIDsList {
			for _, token := range tokens {
				batch.Queue(
					TOKEN_INSERT_QUERY,
					key,
					token,
					collectionName,
					tenantID,
					false,
				)
			}
		}
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
