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
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const INSERT_QUERY = "INSERT INTO public.data (id,uniquekey,collection,tenant,autonumber,fields) VALUES ($1,$2,$3,$4,$5,$6)"
const UPDATE_QUERY = "UPDATE public.data SET uniquekey = $2, fields = fields || $4 WHERE id = $1 and collection = $3"
const DELETE_QUERY = "DELETE FROM public.data WHERE id = ANY($1) and collection = $2"
const TOKEN_DELETE_QUERY = "DELETE FROM public.tokens WHERE fullid = ANY($1)"
const TOKEN_INSERT_QUERY = "INSERT INTO public.tokens (fullid,recordid,token,collection,tenant,readonly) VALUES ($1,$2,$3,$4,$5,$6)"

type DataArrayMarshaler struct {
	Data          []interface{}
	FieldMetadata *adapt.FieldMetadata
}

func (dam *DataArrayMarshaler) MarshalJSONArray(enc *gojay.Encoder) {
	for _, val := range dam.Data {
		if val == nil {
			return
		}
		if dam.FieldMetadata.SubType == "MAP" {
			item, ok := val.(loadable.Item)
			if !ok {
				jsonValue, err := json.Marshal(val)
				if err != nil {
					fmt.Println("Error converting from map to json: " + dam.FieldMetadata.GetFullName())
					return
				}
				ej := gojay.EmbeddedJSON(jsonValue)
				enc.AddEmbeddedJSON(&ej)
				continue
			}

			marshaler := &DataMarshaler{
				Data: item,
				Metadata: &adapt.CollectionMetadata{
					Fields: dam.FieldMetadata.SubFields,
				},
			}
			jsonValue, err := gojay.MarshalJSONObject(marshaler)
			if err != nil {
				fmt.Println("Error Marshalling Map in list: " + err.Error())
				return
			}
			ej := gojay.EmbeddedJSON(jsonValue)
			enc.AddEmbeddedJSON(&ej)

		}
		if dam.FieldMetadata.SubType == "TEXT" {
			enc.String(val.(string))
		}

	}
}
func (dam *DataArrayMarshaler) IsNil() bool {
	return len(dam.Data) == 0
}

type DataMarshaler struct {
	Data     loadable.Item
	Metadata *adapt.CollectionMetadata
}

func (dm *DataMarshaler) MarshalJSONObject(enc *gojay.Encoder) {

	err := dm.Data.Loop(func(fieldID string, value interface{}) error {
		if value == nil {
			return nil
		}
		fieldMetadata, err := dm.Metadata.GetField(fieldID)
		if err != nil {
			return err
		}

		if fieldMetadata.Type == "MAP" {

			item, ok := value.(loadable.Item)
			if !ok || fieldMetadata.SubFields == nil || len(fieldMetadata.SubFields) == 0 {
				jsonValue, err := json.Marshal(value)
				if err != nil {
					return errors.New("Error converting from map to json: " + fieldMetadata.GetFullName())
				}
				ej := gojay.EmbeddedJSON(jsonValue)
				enc.AddEmbeddedJSONKey(fieldID, &ej)
				return nil
			}

			marshaler := &DataMarshaler{
				Data: item,
				Metadata: &adapt.CollectionMetadata{
					Fields: fieldMetadata.SubFields,
				},
			}
			jsonValue, err := gojay.MarshalJSONObject(marshaler)
			if err != nil {
				return err
			}
			ej := gojay.EmbeddedJSON(jsonValue)
			enc.AddEmbeddedJSONKey(fieldID, &ej)
			return nil
		}

		if fieldMetadata.Type == "LIST" {
			list, ok := value.([]interface{})
			if !ok {
				return fmt.Errorf("Couldn't convert list item: %T", value)
			}

			marshaler := &DataArrayMarshaler{
				Data:          list,
				FieldMetadata: fieldMetadata,
			}
			enc.AddArrayKey(fieldID, marshaler)
			return nil
		}

		if fieldMetadata.Type == "MULTISELECT" {
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
				return nil
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
			switch v := value.(type) {
			case int:
				enc.IntKey(fieldID, v)
			case int64:
				enc.Int64Key(fieldID, v)
			case float64:
				enc.Float64Key(fieldID, v)
			default:
				return fmt.Errorf("Error converting number field: Invalid Type %T", v)
			}
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
		// this should add an error to the encoder and make it bomb
		fmt.Println(err)
		badValue := []string{}
		enc.AddInterface(badValue)
	}
}

func (dm *DataMarshaler) IsNil() bool {
	return dm == nil
}

// Save function
func (c *Connection) Save(request *adapt.SaveOp, session *sess.Session) error {

	db := c.GetClient()
	metadata := c.metadata

	tenantID := session.GetTenantID()

	readWriteTokens := map[string][]string{}
	readTokens := map[string][]string{}
	resetTokenIDs := []string{}

	collectionMetadata, err := metadata.GetCollection(request.CollectionName)
	if err != nil {
		return err
	}

	collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
	if err != nil {
		return err
	}

	batch := &pgx.Batch{}

	err = request.LoopChanges(func(change *adapt.ChangeItem) error {
		marshaler := &DataMarshaler{
			Data:     change.FieldChanges,
			Metadata: collectionMetadata,
		}
		fieldJSON, err := gojay.MarshalJSONObject(marshaler)
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

		if collectionMetadata.IsWriteProtected() {
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
			fmt.Println("Error saving: " + request.CollectionName)
			results.Close()
			return err
		}
	}
	results.Close()

	return nil
}
