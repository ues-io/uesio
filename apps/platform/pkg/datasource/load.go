package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/translate"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

type SpecialReferences struct {
	ReferenceMetadata *adapt.ReferenceMetadata
	Fields            []string
}

var specialRefs = map[string]SpecialReferences{
	"FILE": {
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/core.userfile",
		},
		Fields: []string{"uesio/core.mimetype", "uesio/core.path", "uesio/core.updatedat"},
	},
	"USER": {
		ReferenceMetadata: &adapt.ReferenceMetadata{
			Collection: "uesio/core.user",
		},
		Fields: []string{"uesio/core.firstname", "uesio/core.lastname", "uesio/core.language", "uesio/core.picture"},
	},
}

type LoadOptions struct {
	Connection adapt.Connection
	Metadata   *adapt.MetadataCache
}

func getSubFields(loadFields []adapt.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
}

func processConditions(
	conditions []adapt.LoadRequestCondition,
	params map[string]string,
	metadata *adapt.MetadataCache,
	ops []*adapt.LoadOp,
	session *sess.Session,
) error {

	if conditions == nil {
		return nil
	}

	for i, condition := range conditions {

		if condition.Type == "SUBQUERY" || condition.Type == "GROUP" {
			if condition.SubConditions != nil {
				err := processConditions(condition.SubConditions, params, metadata, ops, session)
				if err != nil {
					return err
				}
			}
			continue
		}

		if condition.ValueSource == "" || condition.ValueSource == "VALUE" {

			if condition.RawValues != nil {
				conditions[i].Values = condition.RawValues
			}

			stringValue, ok := condition.RawValue.(string)
			if !ok {
				if condition.RawValue != nil {
					conditions[i].Value = condition.RawValue
				}
				continue
			}

			template, err := templating.NewWithFuncs(stringValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
			if err != nil {
				return err
			}

			mergedValue, err := templating.Execute(template, merge.ServerMergeData{
				Session:     session,
				ParamValues: params,
			})
			if err != nil {
				return err
			}

			conditions[i].Value = mergedValue

		}

		if condition.ValueSource == "PARAM" && condition.Param != "" {
			value, ok := params[condition.Param]
			if !ok {
				return errors.New("Invalid Condition: " + condition.Param)
			}
			conditions[i].Value = value
		}

		if condition.ValueSource == "PARAM" && len(condition.Params) > 0 {
			var values []string
			for _, param := range condition.Params {
				value, ok := params[param]
				if !ok {
					return errors.New("Invalid Condition, parameter not provided: " + param)
				}
				values = append(values, value)
			}
			conditions[i].Values = values
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {

			// If we weren't provided ops to lookup, just don't process Lookups
			if ops == nil {
				continue
			}
			// Look through the previous wires to find the one to look up on.
			var lookupOp *adapt.LoadOp
			for _, lop := range ops {
				if lop.WireName == condition.LookupWire {
					lookupOp = lop
					break
				}
			}

			if lookupOp == nil {
				return errors.New("Could not find lookup wire: " + condition.LookupWire)
			}

			values := make([]interface{}, 0, lookupOp.Collection.Len())
			err := lookupOp.Collection.Loop(func(item meta.Item, index string) error {
				value, err := item.GetField(condition.LookupField)
				if err != nil {
					return err
				}
				values = append(values, value)
				return nil
			})
			if err != nil {
				return err
			}

			conditions[i].Values = values
			//default "IN"
			if conditions[i].Operator == "" {
				conditions[i].Operator = "IN"
			}
			if !(conditions[i].Operator == "IN" || conditions[i].Operator == "NOT_IN") {
				return errors.New("Invalid operator for lookup: " + conditions[i].Operator)
			}
		}
	}

	return nil
}

func getMetadataForConditionLoad(
	condition *adapt.LoadRequestCondition,
	collectionName string,
	collections *MetadataRequest,
	op *adapt.LoadOp,
	ops []*adapt.LoadOp,
) error {

	// We don't need any extra field metadata for these conditions (yet)
	if condition.Type == "SEARCH" || condition.Type == "GROUP" {
		// We don't need any extra field metadata for search conditions yet
		return nil
	}

	// Request metadata for the condition's main field
	err := collections.AddField(collectionName, condition.Field, nil)
	if err != nil {
		return fmt.Errorf("condition field: %v", err)
	}

	if condition.Type == "SUBQUERY" {
		// Request metadata for the sub-query condition's Collection and subfield
		err = collections.AddCollection(condition.SubCollection)
		if err != nil {
			return err
		}
		err = collections.AddField(condition.SubCollection, condition.SubField, nil)
		// Now, process sub-conditions recursively
		if len(condition.SubConditions) > 0 {
			for _, subCondition := range condition.SubConditions {
				err = getMetadataForConditionLoad(&subCondition, condition.SubCollection, collections, op, ops)
				if err != nil {
					return err
				}
			}
		}
	}

	if condition.ValueSource == "LOOKUP" && condition.LookupField != "" && condition.LookupWire != "" {

		// Look through the previous wires to find the one to look up on.
		var lookupCollectionKey string
		for _, otherOp := range ops {
			if otherOp.WireName == condition.LookupWire {
				lookupCollectionKey = otherOp.CollectionName
			}
		}
		lookupFields := strings.Split(condition.LookupField, "->")
		lookupField, rest := lookupFields[0], lookupFields[1:]
		subFields := getAdditionalLookupFields(rest)

		innerErr := collections.AddField(lookupCollectionKey, lookupField, &subFields)
		if innerErr != nil {
			return fmt.Errorf("lookup field: %v", innerErr)
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

		if !session.GetContextPermissions().HasFieldReadPermission(collectionKey, requestField.ID) {
			return fmt.Errorf("Profile %s does not have read access to the %s field.", session.GetProfile(), requestField.ID)
		}

		subFields := getSubFields(requestField.Fields)
		err := collections.AddField(collectionKey, requestField.ID, subFields)
		if err != nil {
			return err
		}
	}

	for _, condition := range op.Conditions {
		innerErr := getMetadataForConditionLoad(&condition, collectionKey, &collections, op, ops)
		if innerErr != nil {
			return innerErr
		}
	}

	err = collections.Load(metadataResponse, session, nil)
	if err != nil {
		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(collectionKey)
	if err != nil {
		return err
	}

	// Now loop over fields and do some additional processing for reference & formula fields
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

		if fieldMetadata.IsFormula && fieldMetadata.FormulaMetadata != nil {
			fieldDeps, err := adapt.GetFormulaFields(fieldMetadata.FormulaMetadata.Expression)
			if err != nil {
				return err
			}
			for key := range fieldDeps {
				op.Fields = append(op.Fields, adapt.LoadRequestField{ID: key})
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
	allOps := []*adapt.LoadOp{}
	metadataResponse := &adapt.MetadataCache{}
	// Use existing metadata if it was passed in
	if options.Metadata != nil {
		metadataResponse = options.Metadata
	}

	// We do this so that we're sure that the labels are attached to the session
	_, err := translate.GetTranslatedLabels(session)
	if err != nil {
		return nil, err
	}

	// Loop over the ops and batch per data source
	for _, op := range ops {
		if !session.GetContextPermissions().HasCollectionReadPermission(op.CollectionName) {
			return nil, fmt.Errorf("Profile %s does not have read access to the %s collection.", session.GetProfile(), op.CollectionName)
		}
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

		//Set default order by: id - asc
		if op.Order == nil {
			op.Order = append(op.Order, adapt.LoadRequestOrder{
				Field: adapt.ID_FIELD,
				Desc:  false,
			})
		}

		if op.Query {
			allOps = append(allOps, op)
		}

	}

	// 3. Get metadata for each datasource and collection

	connection, err := GetConnection(meta.PLATFORM_DATA_SOURCE, metadataResponse, session, options.Connection)
	if err != nil {
		return nil, err
	}

	err = GenerateUserAccessTokens(connection, session)
	if err != nil {
		return nil, err
	}

	for _, op := range allOps {

		err := processConditions(op.Conditions, op.Params, metadataResponse, allOps, session)
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
			continue
		}

		err = loadData(op, connection, session)
		if err != nil {
			return nil, err
		}

		usage.RegisterEvent("LOAD", "COLLECTION", collectionMetadata.GetFullName(), 0, session)
		usage.RegisterEvent("LOAD", "DATASOURCE", meta.PLATFORM_DATA_SOURCE, 0, session)
	}

	return metadataResponse, nil
}

func loadData(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	err := connection.Load(op, session)
	if err != nil {
		return err
	}

	if !op.LoadAll || !op.HasMoreBatches {
		return nil
	}

	return loadData(op, connection, session)
}
