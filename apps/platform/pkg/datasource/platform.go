package datasource

import (
	"errors"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection meta.CollectionableGroup
	Options    *adapt.SaveOptions
}

// RecordNotFoundError struct
type RecordNotFoundError struct {
	message string
}

func (e *RecordNotFoundError) Error() string { return e.message }

// NewRecordNotFoundError creates a new record not found error
func NewRecordNotFoundError(message string) *RecordNotFoundError {
	return &RecordNotFoundError{
		message: message,
	}
}

func GetLoadRequestFields(fieldStrings []string) []adapt.LoadRequestField {
	fields := []adapt.LoadRequestField{}
	for _, field := range fieldStrings {
		fields = append(fields, adapt.LoadRequestField{
			ID: field,
		})
	}
	return fields
}

// PlatformLoads function
func PlatformLoads(ops []adapt.LoadOp, session *sess.Session) error {

	_, err := Load(
		ops,
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	return nil
}

// PlatformLoad function
func PlatformLoad(group meta.CollectionableGroup, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoadWithFields(group, GetLoadRequestFields(group.GetFields()), conditions, session)
}

// PlatformLoadWithFields function
func PlatformLoadWithFields(group meta.CollectionableGroup, fields []adapt.LoadRequestField, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	return PlatformLoads([]adapt.LoadOp{
		{
			WireName:       group.GetName() + "Wire",
			CollectionName: "uesio." + group.GetName(),
			Collection:     group,
			Conditions:     conditions,
			Fields:         fields,
		},
	}, session)
}

// PlatformLoadOne function
func PlatformLoadOne(item meta.CollectionableItem, conditions []adapt.LoadRequestCondition, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}

	err := PlatformLoad(collection, conditions, session)
	if err != nil {
		return err
	}

	length := collection.Len()

	if length == 0 {
		return NewRecordNotFoundError("Couldn't find item from platform load: " + collection.GetName())
	}
	if length > 1 {
		return errors.New("Duplicate item found from platform load: " + collection.GetName())
	}

	return nil
}

// PlatformDelete function
func PlatformDelete(collectionID string, request map[string]adapt.DeleteRequest, session *sess.Session) error {
	requests := []adapt.SaveRequest{{
		Wire:       "deleteRequest",
		Collection: "uesio." + collectionID,
		Deletes:    request,
	}}
	_, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)

	return err
}

// PlatformSaves function
func PlatformSaves(psrs []PlatformSaveRequest, session *sess.Session) error {

	requests := []adapt.SaveRequest{}

	for _, psr := range psrs {
		collection := psr.Collection
		collectionName := collection.GetName()

		changeRequests := map[string]adapt.ChangeRequest{}

		index := 0

		err := collection.Loop(func(item loadable.Item) error {
			fieldChanges := map[string]interface{}{}
			for _, field := range collection.GetFields() {
				fieldValue, err := item.GetField(field)
				if err != nil {
					return err
				}
				fieldChanges[field] = fieldValue
			}
			changeRequests[strconv.Itoa(index)] = adapt.ChangeRequest{
				FieldChanges: fieldChanges,
			}
			index++
			return nil
		})
		if err != nil {
			return err
		}

		requests = append(requests, adapt.SaveRequest{
			Collection: "uesio." + collectionName,
			Wire:       "AnyKey",
			Changes:    changeRequests,
			Options:    psr.Options,
		})
	}

	saveResponse, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return err
	}

	for i, psr := range psrs {
		collection := psr.Collection
		wire := saveResponse.Wires[i]
		for j := range wire.ChangeResults {
			num, err := strconv.Atoi(j)
			if err != nil {
				return err
			}
			result, ok := wire.ChangeResults[j]
			if !ok {
				continue
			}

			item := collection.GetItem(num)
			for fieldName, value := range result.Data {
				err := item.SetField(fieldName, value)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// PlatformSave function
func PlatformSave(psr PlatformSaveRequest, session *sess.Session) error {
	return PlatformSaves([]PlatformSaveRequest{
		psr,
	}, session)
}

func PlatformSaveOne(item meta.CollectionableItem, options *adapt.SaveOptions, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}
	return PlatformSave(PlatformSaveRequest{
		Collection: collection,
		Options:    options,
	}, session)
}
