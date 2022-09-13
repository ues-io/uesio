package datasource

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"github.com/thecloudmasters/uesio/pkg/usage/register"
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
		Fields: []string{"uesio/core.mimetype", "uesio/core.name", "uesio/core.filename"},
	},
	"USER": {
		ReferenceMetadata: &meta.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.picture"},
	},
}

type LoadOptions struct {
	Connections map[string]adapt.Connection
	Metadata    *adapt.MetadataCache
}

func getSubFields(loadFields []adapt.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
}

func processConditions(
	op *adapt.LoadOp,
	metadata *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	session *sess.Session,
) error {

	for i, condition := range op.Conditions {

		if condition.ValueSource == "" || condition.ValueSource == "VALUE" {
			// make sure the condition value is a string
			stringValue, ok := condition.Value.(string)
			if !ok {
				continue
			}
			template, err := templating.NewWithFuncs(stringValue, templating.ForceErrorFunc, map[string]interface{}{
				"Param": func(m map[string]interface{}, key string) (interface{}, error) {
					val, ok := op.Params[key]
					if !ok {
						return nil, errors.New("missing param " + key)
					}
					return val, nil
				},
				"User": func(m map[string]interface{}, key string) (interface{}, error) {

					userID := session.GetUserID()

					if key == "id" {
						return userID, nil
					}

					return nil, nil
				},
			})
			if err != nil {
				return err
			}

			mergedValue, err := templating.Execute(template, nil)
			if err != nil {
				return err
			}

			op.Conditions[i].Value = mergedValue
		}

		if condition.ValueSource == "PARAM" && condition.Param != "" {
			value, ok := op.Params[condition.Param]
			if !ok {
				return errors.New("Invalid Condition: " + condition.Param)
			}
			op.Conditions[i].Value = value
			op.Conditions[i].ValueSource = ""
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {

			// Look through the previous wires to find the one to look up on.
			var lookupOp *adapt.LoadOp
			for _, lop := range ops {
				if lop.WireName == condition.LookupWire {
					lookupOp = lop
					break
				}
			}

			if lookupOp.Collection.Len() != 1 {
				return errors.New("Must lookup on wires with only one record: " + strconv.Itoa(lookupOp.Collection.Len()))
			}

			value, err := lookupOp.Collection.GetItem(0).GetField(condition.LookupField)
			if err != nil {
				return err
			}
			op.Conditions[i].Value = value
			op.Conditions[i].ValueSource = ""
		}
	}

	return nil
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

		if condition.Type == "GROUP" {
			// We don't need any extra field metadata for group conditions yet
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

func Load(ops []*adapt.LoadOp, session *sess.Session, options *LoadOptions) (*adapt.MetadataCache, error) {
	if options == nil {
		options = &LoadOptions{}
	}
	collated := map[string][]*adapt.LoadOp{}
	metadataResponse := &adapt.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	if !session.HasLabels() {
		labels, err := translate.GetTranslatedLabels(session)
		if err != nil {
			return nil, err
		}
		session.SetLabels(labels)
	}

	// Loop over the ops and batch per data source
	for _, op := range ops {
		// Verify that the id field is present
		hasIDField := false
		hasUniqueKeyField := false
		for i := range op.Fields {
			if op.Fields[i].ID == adapt.ID_FIELD {
				hasIDField = true
				break
			}
			if op.Fields[i].ID == adapt.UNIQUE_KEY_FIELD {
				hasUniqueKeyField = true
				break
			}
		}
		if !hasIDField {
			op.Fields = append(op.Fields, adapt.LoadRequestField{
				ID: adapt.ID_FIELD,
			})
		}

		if !hasUniqueKeyField {
			op.Fields = append(op.Fields, adapt.LoadRequestField{
				ID: adapt.UNIQUE_KEY_FIELD,
			})
		}

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
			batch = append(batch, op)
		}
		collated[dsKey] = batch
	}

	err := GenerateUserAccessTokens(metadataResponse, &LoadOptions{
		Metadata:    metadataResponse,
		Connections: options.Connections,
	}, session)
	if err != nil {
		return nil, err
	}

	tokens := session.GetTokens()

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		connection, err := GetConnection(dsKey, tokens, metadataResponse, session, options.Connections)
		if err != nil {
			return nil, err
		}

		for _, op := range batch {

			err := processConditions(op, metadataResponse, batch, session)
			if err != nil {
				return nil, err
			}

			collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
			if err != nil {
				return nil, err
			}

			if collectionMetadata.Type == "DYNAMIC" {
				err := runDynamicCollectionLoadBots(op, connection, session)
				if err != nil {
					return nil, err
				}
			}

			err = connection.Load(op)
			if err != nil {
				return nil, err
			}
			go register.UsageEvent("LOAD", "COLLECTION", collectionMetadata.GetFullName(), op.Size(), session)
			go register.UsageEvent("LOAD", "DATASOURCE", dsKey, op.Size(), session)
		}
	}
	return metadataResponse, nil
}
