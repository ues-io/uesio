package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/translate"
)

type SpecialReferences struct {
	ReferenceMetadata *meta.ReferenceMetadata
	Fields            []string
}

var specialRefs = map[string]SpecialReferences{
	"FILE": {
		ReferenceMetadata: &meta.ReferenceMetadata{
			OnDelete:   "CASCADE",
			Collection: "uesio.userfiles",
		},
		Fields: []string{"uesio.mimetype", "uesio.name"},
	},
	"USER": {
		ReferenceMetadata: &meta.ReferenceMetadata{
			Collection: "uesio.users",
		},
		Fields: []string{"uesio.firstname", "uesio.lastname", "uesio.picture"},
	},
}

func getSubFields(loadFields []adapt.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
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
		subFields := getSubFields(requestField.Fields)
		err := collections.AddField(collectionKey, requestField.ID, subFields)
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
			if len(op.Fields[i].Fields) == 0 {
				for _, fieldID := range specialRef.Fields {
					op.Fields[i].Fields = append(op.Fields[i].Fields, adapt.LoadRequestField{
						ID: fieldID,
					})
				}
			}

			// If the reference to a different data source, we'll
			// need to do a whole new approach to reference fields.
			if collectionMetadata.DataSource != "uesio.platform" {
				op.ReferencedCollections = adapt.ReferenceRegistry{}
				refCol := op.ReferencedCollections.Get(specialRef.ReferenceMetadata.Collection)
				refCol.AddReference(fieldMetadata)
				refCol.AddFields(op.Fields[i].Fields)
			}
		}

		if fieldMetadata.Type == "REFERENCE" && fieldMetadata.ReferenceMetadata.Collection != "" {
			if len(op.Fields[i].Fields) == 0 {
				refCollectionMetadata, err := metadataResponse.GetCollection(fieldMetadata.ReferenceMetadata.Collection)
				if err != nil {
					return err
				}
				op.Fields[i].Fields = []adapt.LoadRequestField{
					{
						ID: refCollectionMetadata.NameField,
					},
					{
						ID: "uesio.id",
					},
				}

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

func Load(ops []adapt.LoadOp, session *sess.Session) (*adapt.MetadataCache, error) {
	return LoadWithOptions(ops, session, true)
}

func LoadWithOptions(ops []adapt.LoadOp, session *sess.Session, checkPermissions bool) (*adapt.MetadataCache, error) {
	collated := map[string][]*adapt.LoadOp{}
	metadataResponse := adapt.MetadataCache{}

	if !session.HasLabels() {
		labels, err := translate.GetTranslatedLabels(session)
		if err != nil {
			return nil, err
		}
		session.SetLabels(labels)
	}

	// Loop over the ops and batch per data source
	for i := range ops {
		// Verify that the uesio.id field is present
		hasIDField := false
		for j := range ops[i].Fields {
			if ops[i].Fields[j].ID == "uesio.id" {
				hasIDField = true
				break
			}
		}
		if !hasIDField {
			ops[i].Fields = append(ops[i].Fields, adapt.LoadRequestField{
				ID: "uesio.id",
			})
		}

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
		if op.Query {
			batch = append(batch, &ops[i])
		}
		collated[dsKey] = batch
	}

	if checkPermissions {
		err := GenerateUserAccessTokens(&metadataResponse, session)
		if err != nil {
			return nil, err
		}
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
		adapter, err := adapt.GetAdapter(adapterType, session)
		if err != nil {
			return nil, err
		}
		credentials, err := adapt.GetCredentials(datasource.Credentials, session)
		if err != nil {
			return nil, err
		}

		var tokens []string
		if checkPermissions {
			tokens = session.GetTokens()
		}

		err = adapter.Load(batch, &metadataResponse, credentials, tokens)
		if err != nil {
			return nil, err
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
				adapter, err := adapt.GetAdapter(adapterType, session)
				if err != nil {
					return nil, err
				}
				credentials, err := adapt.GetCredentials(datasource.Credentials, session)
				if err != nil {
					return nil, err
				}

				index := 0
				err = op.Collection.Loop(func(item loadable.Item, _ interface{}) error {
					for _, reference := range referencedCol.ReferenceFields {
						refInterface, err := item.GetField(reference.GetFullName())
						if err != nil {
							return err
						}

						refItem, ok := refInterface.(adapt.Item)
						if !ok {
							continue
						}

						value, err := refItem.GetField(referencedCol.Metadata.IDField)
						if err != nil {
							return err
						}
						referencedCol.AddID(value, adapt.ReferenceLocator{
							RecordIndex: index,
							Field:       reference,
						})
					}
					index++
					return nil
				})
				if err != nil {
					return nil, err
				}

				err = adapt.HandleReferences(func(ops []*adapt.LoadOp) error {
					return adapter.Load(ops, &metadataResponse, credentials, tokens)
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
