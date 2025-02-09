package datasource

import (
	"errors"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/constant"
	"github.com/thecloudmasters/uesio/pkg/merge"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getSubFields(loadFields []wire.LoadRequestField) *FieldsMap {
	subFields := FieldsMap{}
	for _, subField := range loadFields {
		subFields[subField.ID] = *getSubFields(subField.Fields)
	}
	return &subFields
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

func processConditions(
	op *wire.LoadOp,
	collectionKey string,
	conditions []wire.LoadRequestCondition,
	metadata *wire.MetadataCache,
	ops []*wire.LoadOp,
	session *sess.Session,
) ([]wire.LoadRequestCondition, error) {

	var err error
	var useConditions []wire.LoadRequestCondition

	currentCollectionMeta, _ := metadata.GetCollection(collectionKey)

	for i := range conditions {
		condition := conditions[i]
		if condition.Inactive {
			continue
		}
		// Convert potentially reference-crossing conditions to subquery conditions
		if isReferenceCrossingField(condition.Field) {
			// Just because it has an arrow does NOT mean it is reference-crossing, it might be a struct field,
			// in which case, we just want to leave it alone. This will mostly be relevant for external integrations.
			mainField := strings.Split(condition.Field, constant.RefSep)[0]
			// Assume it's a reference, unless we can prove otherwise
			isReferenceField := true
			if mainField != "" && currentCollectionMeta != nil {
				mainFieldMeta, err := currentCollectionMeta.GetField(mainField)
				if err == nil && !wire.IsReference(mainFieldMeta.Type) {
					isReferenceField = false
				}
			}
			// If this IS a Condition on a Reference field, then transform it to a Sub-query condition
			if isReferenceField {
				conditionPointer := &condition
				err = transformReferenceCrossingConditionToSubquery(collectionKey, conditionPointer, metadata)
				if err != nil {
					return nil, err
				}
				// Mutate the condition, otherwise the changes will be lost
				condition = *conditionPointer
			}
		}

		if condition.Type == "SUBQUERY" || condition.Type == "GROUP" {
			nestedCollection := collectionKey
			if condition.Type == "SUBQUERY" {
				nestedCollection = condition.SubCollection
			}
			if condition.SubConditions != nil {
				if useSubConditions, err := processConditions(op, nestedCollection, condition.SubConditions, metadata, ops, session); err != nil {
					return nil, err
				} else {
					condition.SubConditions = useSubConditions
				}
			}
			useConditions = append(useConditions, condition)
			continue
		}

		if condition.ValueSource == "" || condition.ValueSource == "VALUE" {

			if condition.RawValues != nil {
				condition.Values = condition.RawValues
			}

			stringValue, ok := condition.RawValue.(string)
			if !ok {
				if condition.RawValue != nil {
					condition.Value = condition.RawValue
				}
				useConditions = append(useConditions, condition)
				continue
			}

			template, err := templating.NewWithFuncs(stringValue, templating.ForceErrorFunc, merge.ServerMergeFuncs)
			if err != nil {
				return nil, err
			}

			mergedValue, err := templating.Execute(template, merge.ServerMergeData{
				Session:     session,
				ParamValues: op.Params,
			})
			if err != nil {
				return nil, err
			}

			if mergedValue == "" && condition.NoValueBehavior == "NOQUERY" {
				op.Query = false
				break
			}
			condition.Value = mergedValue
		}

		if condition.ValueSource == "PARAM" && condition.Param != "" {
			value, ok := op.Params[condition.Param]
			if !ok {
				if condition.NoValueBehavior == "DEACTIVATE" {
					continue
				}
				return nil, exceptions.NewBadRequestException("Invalid Condition, param '" + condition.Param + "' was not provided")
			}
			condition.Value = value
		}

		if condition.ValueSource == "PARAM" && len(condition.Params) > 0 {
			var values []interface{}
			for _, param := range condition.Params {
				value, ok := op.Params[param]
				if !ok {
					return nil, exceptions.NewBadRequestException("Invalid Condition, param: '" + param + "' was not provided")
				}
				values = append(values, value)
			}
			condition.Values = values
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupWire != "" && condition.LookupField != "" {
			// If we weren't provided ops to lookup, just don't process Lookups
			if ops == nil {
				useConditions = append(useConditions, condition)
				continue
			}
			// Look through the previous wires to find the one to look up on.
			var lookupOp *wire.LoadOp
			for _, lop := range ops {
				if lop.WireName == condition.LookupWire {
					lookupOp = lop
					break
				}
			}

			if lookupOp == nil {
				return nil, exceptions.NewBadRequestException("Could not find lookup wire: " + condition.LookupWire)
			}

			values := make([]interface{}, 0, lookupOp.Collection.Len())
			err := lookupOp.Collection.Loop(func(item meta.Item, index string) error {
				value, err := item.GetField(condition.LookupField)
				if err != nil {
					return exceptions.NewBadRequestException("could not get value of specific Lookup field from record: " + condition.LookupField)
				}
				values = append(values, value)
				return nil
			})
			if err != nil {
				return nil, err
			}

			condition.Values = values

			//default "IN"
			if condition.Operator == "" {
				condition.Operator = "IN"
			}
			if !(condition.Operator == "IN" || condition.Operator == "NOT_IN") {
				return nil, exceptions.NewBadRequestException("Invalid operator for lookup condition, must be one of [IN, NOT_IN]: " + condition.Operator)
			}
		}
		useConditions = append(useConditions, condition)
	}

	return useConditions, nil
}

// example:
// uesio/tests.user->uesio/core.username = 'abel'
func transformReferenceCrossingConditionToSubquery(collectionName string, condition *wire.LoadRequestCondition, metadata *wire.MetadataCache) error {
	// Split the field name, and recursively process each part as an IN subquery condition
	// until we get to the final field, which we'll then handle as a normal condition
	parts := strings.Split(condition.Field, constant.RefSep)
	totalParts := len(parts)

	originalOperator := condition.Operator
	originalType := condition.Type
	originalValueSource := condition.ValueSource
	originalParam := condition.Param
	// Move over RawValue/RawValues AND Value/Values because those store the original properties
	// received from the original request. Value/Values will be populated as part of processing the condition,
	// but in code (e.g. Bot code) it's very likely someone will populate condition.Value/Values instead,
	// so to prevent that mistake, move them all over.
	originalValue := condition.Value
	originalValues := condition.Values
	originalRawValue := condition.RawValue
	originalRawValues := condition.RawValues

	var previousCondition *wire.LoadRequestCondition
	currentCondition := condition

	currentCollectionMetadata, err := metadata.GetCollection(collectionName)
	if err != nil {
		return errors.New("unable to find metadata for collection " + collectionName)
	}

	for i, fieldPart := range parts {
		if previousCondition != nil {
			currentCondition = &previousCondition.SubConditions[0]
		}
		if i == totalParts-1 {
			// We are on the last field, so we need to mutate the previous condition's SubConditions array
			currentCondition.Field = fieldPart
			currentCondition.Type = originalType
			currentCondition.Operator = originalOperator
			currentCondition.RawValue = originalRawValue
			currentCondition.RawValues = originalRawValues
			currentCondition.Value = originalValue
			currentCondition.Values = originalValues
			currentCondition.ValueSource = originalValueSource
			currentCondition.Param = originalParam
		} else {
			// Convert the current condition to a subquery condition,
			// with a nested condition, and lookup the related collection metadata
			referenceField, err := currentCollectionMetadata.GetField(fieldPart)
			if err != nil {
				return errors.New("unable to find field " + fieldPart + " in collection " + currentCollectionMetadata.GetFullName())
			}
			if !wire.IsReference(referenceField.Type) || referenceField.ReferenceMetadata == nil {
				return errors.New("field " + fieldPart + " in collection " + currentCollectionMetadata.GetFullName() + " is not a valid Reference field")
			}
			relatedCollectionName := referenceField.ReferenceMetadata.GetCollection()
			subCollectionMetadata, err := metadata.GetCollection(relatedCollectionName)
			if err != nil {
				return errors.New("unable to find metadata for collection " + relatedCollectionName)
			}

			newCondition := wire.LoadRequestCondition{}

			currentCondition.Type = "SUBQUERY"
			currentCondition.Operator = "IN"
			currentCondition.ValueSource = ""
			currentCondition.Param = ""
			currentCondition.Field = fieldPart
			currentCondition.SubCollection = relatedCollectionName
			currentCondition.SubField = "uesio/core.id"
			currentCollectionMetadata = subCollectionMetadata
			currentCondition.SubConditions = []wire.LoadRequestCondition{
				newCondition,
			}
			previousCondition = currentCondition
			currentCondition = &newCondition
		}
	}
	return nil
}

func isReferenceCrossingField(field string) bool {
	return strings.Contains(field, constant.RefSep)
}

func requestMetadataForReferenceCrossingField(collectionName, fieldName string, collections *MetadataRequest) error {
	parts := strings.Split(fieldName, constant.RefSep)
	var currentField *wire.LoadRequestField
	var currentFieldsArray, previousFieldsArray *[]wire.LoadRequestField
	i := len(parts) - 1
	for i >= 0 {
		previousFieldsArray = currentFieldsArray
		currentField = &wire.LoadRequestField{
			ID: parts[i],
		}
		// If we had a previous fields array,
		// use it as subFields for this field
		currentFieldsArray = &[]wire.LoadRequestField{
			*currentField,
		}
		if previousFieldsArray != nil {
			currentField.Fields = *previousFieldsArray
		}
		i--
	}
	subFields := getSubFields(*previousFieldsArray)
	err := collections.AddField(collectionName, currentField.ID, subFields)
	if err != nil {
		return err
	}
	return nil
}

func getMetadataForConditionLoad(
	condition *wire.LoadRequestCondition,
	collectionName string,
	collections *MetadataRequest,
	op *wire.LoadOp,
	ops []*wire.LoadOp,
) error {

	var err error

	if condition.Type == "GROUP" {
		// Process sub-conditions recursively
		if len(condition.SubConditions) > 0 {
			for _, subCondition := range condition.SubConditions {
				err = getMetadataForConditionLoad(&subCondition, collectionName, collections, op, ops)
				if err != nil {
					return err
				}
			}
		}
		return nil
	} else if condition.Type == "SEARCH" {
		// Load metadata for all search fields
		if len(condition.SearchFields) > 0 {
			for _, searchField := range condition.SearchFields {
				err = collections.AddField(collectionName, searchField, nil)
				if err != nil {
					return fmt.Errorf("unable to request metadata for search field '%s' on collection '%s': %s", searchField, collectionName, err.Error())
				}
			}
		}
		return nil
	}

	if isReferenceCrossingField(condition.Field) {
		// Recursively add all pieces of the field, as if we were requesting Subfields,
		err = requestMetadataForReferenceCrossingField(collectionName, condition.Field, collections)
		if err != nil {
			return fmt.Errorf("unable to request metadata for condition field: %s", condition.Field)
		}
	} else {
		// Request metadata for the condition's main field
		err = collections.AddField(collectionName, condition.Field, nil)
		if err != nil {
			return fmt.Errorf("condition field: %v", err)
		}
	}

	if condition.Type == "SUBQUERY" {
		// Request metadata for the sub-query condition's Collection and subfield
		err = collections.AddCollection(condition.SubCollection)
		if err != nil {
			return err
		}
		err = collections.AddField(condition.SubCollection, condition.SubField, nil)
		if err != nil {
			return err
		}
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

	if condition.ValueSource == "LOOKUP" {

		if condition.LookupWire == "" {
			return fmt.Errorf("invalid condition with valueSource 'LOOKUP': lookupWire is required")
		}
		if condition.LookupField == "" {
			return fmt.Errorf("invalid condition with valueSource 'LOOKUP': lookupField is required")
		}

		// Look through the previous wires to find the one to look up on.
		var lookupCollectionKey string
		for _, otherOp := range ops {
			if otherOp.WireName == condition.LookupWire {
				lookupCollectionKey = otherOp.CollectionName
			}
		}

		if lookupCollectionKey == "" {
			// If we've already processed this condition, we can ignore this error
			if condition.Values != nil {
				return nil
			}
			return fmt.Errorf("LOOKUP condition requested field %s from a wire named %s, but no Wire with this name was found in this load request", condition.LookupField, condition.LookupWire)
		}

		lookupFields := strings.Split(condition.LookupField, constant.RefSep)
		lookupField, rest := lookupFields[0], lookupFields[1:]
		subFields := getAdditionalLookupFields(rest)

		innerErr := collections.AddField(lookupCollectionKey, lookupField, &subFields)
		if innerErr != nil {
			return fmt.Errorf("cannot lookup field: %v", innerErr)
		}
	}
	return nil
}
