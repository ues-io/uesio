package postgresio

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

type ValueBuilder struct {
	Start      int
	QueryParts []string
	Values     []interface{}
	Counter    int
}

func (vb *ValueBuilder) add(key string, value interface{}, pgType string) {
	vb.QueryParts = append(vb.QueryParts, fmt.Sprintf("'%s',$%d::%s", key, vb.Counter+vb.Start, pgType))
	vb.Values = append(vb.Values, value)
	vb.Counter++
}

func (vb *ValueBuilder) build() string {
	return strings.Join(vb.QueryParts, ",")
}

func NewValueBuilder(start int) *ValueBuilder {
	return &ValueBuilder{
		QueryParts: []string{},
		Values:     []interface{}{},
		Counter:    0,
		Start:      start,
	}
}

func getPGType(field *adapt.FieldMetadata) string {
	switch field.Type {
	case "MAP", "LIST":
		return "jsonb"
	case "TIMESTAMP":
		return "bigint"
	default:
		return "text"
	}
}

type DataValuer struct {
	Data     interface{}
	Field    *adapt.FieldMetadata
	Metadata *adapt.MetadataCache
}

func (dv DataValuer) Value() (driver.Value, error) {
	fieldMetadata := dv.Field
	if fieldMetadata.Type == "MAP" || fieldMetadata.Type == "LIST" {
		jsonValue, err := json.Marshal(dv.Data)
		if err != nil {
			return nil, errors.New("Error converting from map to json: " + fieldMetadata.GetFullName())
		}
		return jsonValue, nil
	}
	if adapt.IsReference(fieldMetadata.Type) {
		refValue, err := adapt.GetReferenceKey(dv.Data, fieldMetadata, dv.Metadata)
		if err != nil {
			return nil, errors.New("Error converting reference field: " + fieldMetadata.GetFullName() + " : " + err.Error())
		}
		if refValue == "" {
			return nil, nil
		}
		return refValue, nil
	}
	return dv.Data, nil
}

// Save function
func (a *Adapter) Save(requests []adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	db, err := connect(credentials)
	if err != nil {
		return errors.New("Failed to connect to PostgreSQL:" + err.Error())
	}
	defer db.Close()

	tenantID := credentials.GetTenantID()

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata, tenantID)
		if err != nil {
			return err
		}

		idFieldMetadata, err := collectionMetadata.GetIDField()
		if err != nil {
			return err
		}

		idFieldDBName := idFieldMetadata.GetFullName()

		// Process Inserts
		idTemplate, err := adapt.NewFieldChanges(collectionMetadata.IDFormat, collectionMetadata, metadata)
		if err != nil {
			return err
		}

		for _, change := range *request.Inserts {

			newID, err := templating.Execute(idTemplate, change.FieldChanges)
			if err != nil {
				return err
			}

			if newID == "" {
				newID = uuid.New().String()
			}

			builder := NewValueBuilder(3)

			err = change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
				fieldMetadata, err := collectionMetadata.GetField(fieldID)
				if err != nil {
					return err
				}
				if fieldID == idFieldDBName {
					// Don't set the id field here
					return nil
				}
				builder.add(fieldID, DataValuer{
					Data:     value,
					Field:    fieldMetadata,
					Metadata: metadata,
				}, getPGType(fieldMetadata))
				return nil
			})
			if err != nil {
				return err
			}

			err = change.FieldChanges.SetField(idFieldDBName, newID)
			if err != nil {
				return err
			}

			builder.add(idFieldDBName, newID, "text")

			query := fmt.Sprintf("INSERT INTO public.data (id,collection,fields) VALUES ($1,$2,jsonb_build_object(%s))", builder.build())
			fmt.Println(query)

			params := append([]interface{}{
				collectionName + ":" + newID,
				collectionName,
			}, builder.Values...)

			_, err = db.Exec(query, params...)
			if err != nil {
				return err
			}

		}

		for _, change := range *request.Updates {

			if change.IDValue == nil {
				continue
			}

			builder := NewValueBuilder(3)

			err = change.FieldChanges.Loop(func(fieldID string, value interface{}) error {
				fieldMetadata, err := collectionMetadata.GetField(fieldID)
				if err != nil {
					return err
				}
				if fieldID == idFieldDBName {
					// Don't set the id field here
					return nil
				}
				if fieldMetadata.AutoPopulate == "CREATE" {
					return nil
				}
				builder.add(fieldID, DataValuer{
					Data:     value,
					Field:    fieldMetadata,
					Metadata: metadata,
				}, "text")
				return nil
			})
			if err != nil {
				return err
			}

			params := append([]interface{}{
				collectionName + ":" + change.IDValue.(string),
				collectionName,
			}, builder.Values...)

			query := fmt.Sprintf("UPDATE public.data SET fields = fields || jsonb_build_object(%s) WHERE id = $1 and collection = $2", builder.build())
			fmt.Println(query)
			_, err = db.Exec(query, params...)
			if err != nil {
				return err
			}
			return nil

		}

		for _, delete := range *request.Deletes {

			if delete.IDValue == nil {
				continue
			}

			query := "DELETE FROM public.data WHERE id = $1 and collection = $2"
			fmt.Println(query)
			_, err = db.Exec(query, []interface{}{
				collectionName + ":" + delete.IDValue.(string),
				collectionName,
			})
			if err != nil {
				return err
			}
		}
	}

	return nil
}
