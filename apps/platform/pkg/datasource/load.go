package datasource

import (
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
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
			Collection: "uesio/core.userfile",
		},
		Fields: []string{"uesio/core.mimetype", "uesio/core.name"},
	},
	"USER": {
		ReferenceMetadata: &meta.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.picture"},
	},
}

type LoadOptions struct {
	CheckPermissions bool
	Connections      map[string]adapt.Connection
	Metadata         *adapt.MetadataCache
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
	ops []*adapt.LoadOp,
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
						ID: adapt.ID_FIELD,
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

func Load(ops []*adapt.LoadOp, session *sess.Session) (*adapt.MetadataCache, error) {
	return LoadWithOptions(ops, session, &LoadOptions{
		CheckPermissions: true,
	})
}

func LoadWithOptions(ops []*adapt.LoadOp, session *sess.Session, options *LoadOptions) (*adapt.MetadataCache, error) {
	if options == nil {
		options = &LoadOptions{}
	}
	collated := map[string][]*adapt.LoadOp{}
	metadataResponse := &adapt.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}
	checkPermissions := options.CheckPermissions

	if !session.HasLabels() {
		labels, err := translate.GetTranslatedLabels(session)
		if err != nil {
			return nil, err
		}
		session.SetLabels(labels)
	}

	// Loop over the ops and batch per data source
	for i := range ops {
		// Verify that the id field is present
		hasIDField := false
		for j := range ops[i].Fields {
			if ops[i].Fields[j].ID == adapt.ID_FIELD {
				hasIDField = true
				break
			}
		}
		if !hasIDField {
			ops[i].Fields = append(ops[i].Fields, adapt.LoadRequestField{
				ID: adapt.ID_FIELD,
			})
		}

		op := ops[i]
		err := getMetadataForLoad(op, metadataResponse, ops, session)
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
			op.Order = append(op.Order, adapt.LoadRequestOrder{
				Field: adapt.ID_FIELD,
				Desc:  false,
			})
		}

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		if op.Query {
			batch = append(batch, ops[i])
		}
		collated[dsKey] = batch
	}

	if checkPermissions {
		err := GenerateUserAccessTokens(metadataResponse, &LoadOptions{
			Metadata:    metadataResponse,
			Connections: options.Connections,
		}, session)
		if err != nil {
			return nil, err
		}
	}

	var tokens []string
	if checkPermissions {
		tokens = session.GetTokens()
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		connection, err := GetConnection(dsKey, tokens, metadataResponse, session, options.Connections)
		if err != nil {
			return nil, err
		}

		for _, op := range batch {

			for i := range op.Conditions {
				value, err := adapt.GetConditionValue(op.Conditions[i], op, metadataResponse, batch)
				if err != nil {
					return nil, err
				}
				op.Conditions[i].Value = value
				op.Conditions[i].ValueSource = ""
			}

			err := connection.Load(op)
			if err != nil {
				return nil, err
			}
		}

	}
	return metadataResponse, nil
}
