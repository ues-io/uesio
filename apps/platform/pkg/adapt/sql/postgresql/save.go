package postgresql

import (
	"context"
	"encoding/json"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

// Save function
func (a *Adapter) Save(requests []adapt.SaveOp, metadata *adapt.MetadataCache, credentials *adapt.Credentials) error {

	ctx := context.Background()

	db, err := connect()
	if err != nil {
		return errors.New("Failed to connect to PostgreSQL:" + err.Error())
	}
	defer db.Close()

	psql := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	for _, request := range requests {

		collectionMetadata, err := metadata.GetCollection(request.CollectionName)
		if err != nil {
			return err
		}

		collectionName, err := getDBCollectionName(collectionMetadata)
		if err != nil {
			return err
		}

		idFieldMetadata, err := collectionMetadata.GetIDField()
		if err != nil {
			return err
		}

		idFieldDBName, err := getDBFieldName(idFieldMetadata)
		if err != nil {
			return err
		}

		// Sometimes we only have the name of something instead of its real id
		// We can use this lookup functionality to get the real id before the save.
		err = adapt.HandleLookups(func(ops []adapt.LoadOp) error {
			return loadMany(ctx, db, ops, metadata)
		}, &request, metadata)
		if err != nil {
			return err
		}

		err = adapt.ProcessChanges(
			&request,
			metadata,
			// Update Func
			func(id interface{}, update map[string]interface{}) error {
				dbID, ok := update[idFieldDBName]
				if !ok {
					return errors.New("No key found for dynamoDb update")
				}
				delete(update, idFieldDBName)
				_, err = psql.Update(collectionName).SetMap(update).RunWith(db).Where(sq.Eq{
					idFieldDBName: dbID,
				}).Query()

				if err != nil {
					return errors.New("Failed to Update in SQL Adapter:" + err.Error())
				}
				return nil
			},
			// Insert Func
			func(id interface{}, insert map[string]interface{}) error {
				newID, ok := insert[idFieldDBName]
				if !ok {
					return errors.New("No key found for dynamoDb update")
				}
				result, err := psql.Insert(collectionName).SetMap(insert).RunWith(db).Query()
				if err != nil {
					return errors.New("Failed to insert in SQL Adapter:" + err.Error())
				}
				return result.Scan(newID)
			},
			// SetData Func
			func(value interface{}, fieldMetadata *adapt.FieldMetadata) (interface{}, error) {
				if fieldMetadata.Type == "MAP" {
					jsonValue, err := json.Marshal(value)
					if err != nil {
						return nil, errors.New("Error converting from map to json: " + fieldMetadata.GetFullName())
					}
					return jsonValue, nil
				}
				if adapt.IsReference(fieldMetadata.Type) {
					return adapt.SetReferenceData(value, fieldMetadata, metadata)
				}
				return value, nil
			},
			// FieldName Func
			getDBFieldName,
			// SearchField Func
			func(searchableValues []string) (string, interface{}) {
				return "", nil
			},
			// DefaultID Func
			func() string {
				return uuid.New().String()
			},
		)
		if err != nil {
			return err
		}

		err = adapt.ProcessDeletes(&request, metadata, func(dbID interface{}) error {
			result, err := psql.Delete(collectionName).RunWith(db).Where(sq.Eq{
				idFieldDBName: dbID,
			}).Query()
			if err != nil {
				return errors.New("Failed to delete in SQL Adapter:" + err.Error())
			}
			return result.Scan(dbID)
		})
		if err != nil {
			return err
		}
	}

	return nil
}
