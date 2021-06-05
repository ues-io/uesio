package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type SpecialReferences struct {
	OnDelete       string
	CollectionName string
	Fields         []string
}

var specialRefs = map[string]SpecialReferences{
	"FILE": {
		OnDelete:       "CASCADE",
		CollectionName: "uesio.userfiles",
		Fields:         []string{"uesio.mimetype", "uesio.name"},
	},
	"USER": {
		CollectionName: "uesio.users",
		Fields:         []string{"uesio.firstname", "uesio.lastname", "uesio.picture"},
	},
}

func getMetadataForLoad(
	op *adapt.LoadOp,
	metadataResponse *adapt.MetadataCache,
	ops []adapt.LoadOp,
	session *sess.Session,
) error {
	collectionKey := op.CollectionName

	// Keep a running tally of all requested collections
	collections := MetadataRequest{}
	err := collections.AddCollection(collectionKey)
	if err != nil {
		return err
	}

	for _, requestField := range op.Fields {
		subFields := FieldsMap{}
		for _, subField := range requestField.Fields {
			// TODO: This should be recursive
			subFields[subField.ID] = FieldsMap{}
		}
		err := collections.AddField(collectionKey, requestField.ID, &subFields)
		if err != nil {
			return err
		}
	}

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			// We don't need any extra field metadata for search conditions yet
			continue
		}
		err := collections.AddField(collectionKey, condition.Field, nil)
		if err != nil {
			return fmt.Errorf("condition field: %v", err)
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupField != "" && condition.LookupWire != "" {

			// Look through the previous wires to find the one to look up on.
			var lookupCollectionKey string
			for _, op := range ops {
				if op.WireName == condition.LookupWire {
					lookupCollectionKey = op.CollectionName
				}
			}
			lookupFields := strings.Split(condition.LookupField, "->")
			lookupField, rest := lookupFields[0], lookupFields[1:]
			subFields := getAdditionalLookupFields(rest)

			err := collections.AddField(lookupCollectionKey, lookupField, &subFields)
			if err != nil {
				return fmt.Errorf("lookup field: %v", err)
			}
		}

	}

	err = collections.Load(metadataResponse, session)
	if err != nil {
		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return err
	}

	// Now loop over fields and do some additional processing for reference fields
	for i, requestField := range op.Fields {
		fieldMetadata, err := collectionMetadata.GetField(requestField.ID)
		if err != nil {
			return err
		}
		specialRef, ok := specialRefs[fieldMetadata.Type]
		if ok {

			fields := []adapt.LoadRequestField{}
			for _, fieldID := range specialRef.Fields {
				fields = append(fields, adapt.LoadRequestField{
					ID: fieldID,
				})
			}

			// If the reference to a different data source, we'll
			// need to do a whole new approach to reference fields.
			if collectionMetadata.DataSource != "uesio.platform" {
				op.ReferencedCollections = adapt.ReferenceRegistry{}
				refCol := op.ReferencedCollections.Get(specialRef.CollectionName)
				refCol.AddReference(fieldMetadata)
				refCol.AddFields(fields)
			} else {
				op.Fields[i].Fields = fields
			}
		}
	}

	return nil

}

func getAdditionalLookupFields(fields []string) FieldsMap {
	if len(fields) == 0 {
		return FieldsMap{}
	}
	first, rest := fields[0], fields[1:]
	return FieldsMap{
		first: getAdditionalLookupFields(rest),
	}
}

func loadWithRecordPermissions(ops []adapt.LoadOp, session *sess.Session, checkCollectionAccess bool) (*adapt.MetadataCache, error) {
	collated := map[string][]adapt.LoadOp{}
	metadataResponse := adapt.MetadataCache{}
	//Indexed by collection name
	responseTokens := map[string][]string{}
	// Loop over the ops and batch per data source
	for i := range ops {
		op := ops[i]
		err := getMetadataForLoad(&op, &metadataResponse, ops, session)
		if err != nil {
			return nil, fmt.Errorf("metadata: %s: %v", op.CollectionName, err)
		}

		// Get the datasource from the object name
		collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
		if err != nil {
			return nil, err
		}

		if checkCollectionAccess && collectionMetadata.Access == "protected" {
			responseTokensForCollection, ok := responseTokens[collectionMetadata.Name]
			if !ok {
				responseTokensForCollection, err = GenerateResponseTokens(collectionMetadata, session)
				if err != nil {
					return nil, err
				}
				responseTokens[collectionMetadata.Name] = responseTokensForCollection
			}
			op.UserResponseTokens = responseTokensForCollection
		}

		//Set default order by: id - asc
		if op.Order == nil {
			idField, err := collectionMetadata.GetIDField()
			if err != nil {
				return nil, err
			}
			idFieldName := idField.GetFullName()
			op.Order = append(op.Order, adapt.LoadRequestOrder{
				Field: idFieldName,
				Desc:  false,
			})
		}

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		if op.Type == "QUERY" || op.Type == "" {
			if batch == nil {
				batch = []adapt.LoadOp{}
			}
			batch = append(batch, op)
		}
		collated[dsKey] = batch
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := meta.NewDataSource(dsKey)
		if err != nil {
			return nil, err
		}

		err = bundle.Load(datasource, session)
		if err != nil {
			return nil, err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := datasource.Type
		adapter, err := adapt.GetAdapter(adapterType)
		if err != nil {
			return nil, err
		}
		credentials, err := adapt.GetCredentials(datasource.Credentials, session)
		if err != nil {
			return nil, err
		}

		err = adapter.Load(batch, &metadataResponse, credentials)
		if err != nil {
			return nil, err
		}
		for i := range batch {
			if !checkCollectionAccess {
				break
			}
			op := batch[i]
			if op.Collection == nil {
				continue
			}
			collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
			if err != nil {
				return nil, err
			}
			if collectionMetadata.Access != "protected" {
				continue
			}
			err = op.Collection.Filter(func(record loadable.Item) (bool, error) {
				access, err := DetermineAccessFromChallengeTokens(collectionMetadata, op.UserResponseTokens, record, session)
				if err != nil {
					return false, err
				}
				if access == "read" || access == "read-write" {
					return true, nil
				}
				return false, nil
			})
			if err != nil {
				return nil, err
			}
		}

		// Now do our supplemental reference loads
		for i := range batch {
			op := batch[i]
			for colKey, referencedCol := range op.ReferencedCollections {
				refMetadata, err := metadataResponse.GetCollection(colKey)
				if err != nil {
					return nil, err
				}
				referencedCol.Metadata = refMetadata

				datasource, err := meta.NewDataSource(referencedCol.Metadata.DataSource)
				if err != nil {
					return nil, err
				}

				err = bundle.Load(datasource, session)
				if err != nil {
					return nil, err
				}

				// Now figure out which data source adapter to use
				// and make the requests
				// It would be better to make this requests in parallel
				// instead of in series
				adapterType := datasource.Type
				adapter, err := adapt.GetAdapter(adapterType)
				if err != nil {
					return nil, err
				}
				credentials, err := adapt.GetCredentials(datasource.Credentials, session)
				if err != nil {
					return nil, err
				}

				index := 0
				err = op.Collection.Loop(func(item loadable.Item) error {
					for _, reference := range referencedCol.ReferenceFields {
						refInterface, err := item.GetField(reference.GetFullName())
						if err != nil {
							return err
						}

						refItem, ok := refInterface.(adapt.Item)
						if !ok {
							return nil
						}

						value, err := refItem.GetField(referencedCol.Metadata.IDField)
						if err != nil {
							return err
						}
						referencedCol.AddID(value, index)
					}
					index++
					return nil
				})
				if err != nil {
					return nil, err
				}

				err = adapt.HandleReferences(func(ops []adapt.LoadOp) error {
					return adapter.Load(ops, &metadataResponse, credentials)
				}, op.Collection, adapt.ReferenceRegistry{
					colKey: referencedCol,
				})
				if err != nil {
					return nil, err
				}
			}

		}

	}
	return &metadataResponse, nil
}

// Load function
func Load(ops []adapt.LoadOp, session *sess.Session) (*adapt.MetadataCache, error) {
	return loadWithRecordPermissions(ops, session, true)
}
