package datasource

import (
	"errors"
	"strconv"

	"github.com/jinzhu/copier"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection metadata.CollectionableGroup
	Options    *reqs.SaveOptions
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

// PlatformLoad function
func PlatformLoad(collections []metadata.CollectionableGroup, requests []reqs.LoadRequest, session *sess.Session) error {

	if len(collections) != len(requests) {
		return errors.New("Bad thing happened - we need the same number of collections as requests")
	}

	loadResponse, err := Load(
		LoadRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		session.RemoveWorkspaceContext(),
	)
	if err != nil {
		return errors.New("Platform LoadFromSite Failed:" + err.Error())
	}

	if len(loadResponse.Wires) != len(collections) {
		return errors.New("Bad thing happened - we need the same number of responses as collections")
	}

	for index, collection := range collections {
		// Turn the result map into a struct
		if err := collection.UnMarshal(loadResponse.Wires[index].Data); err != nil {
			return errors.New("Error in decoding: " + err.Error())
		}
	}

	return nil
}

// PlatformLoadOne function
func PlatformLoadOne(item metadata.CollectionableItem, conditions []reqs.LoadRequestCondition, session *sess.Session) error {
	collection := item.GetCollection()
	collections := []metadata.CollectionableGroup{
		collection,
	}

	err := PlatformLoad(collections, []reqs.LoadRequest{
		reqs.NewPlatformLoadRequest(
			"itemWire",
			collection.GetName(),
			collection.GetFields(),
			conditions,
		),
	}, session)

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

	return copier.Copy(item, collection.GetItem(0))
}

// PlatformDelete function
func PlatformDelete(collectionID string, request map[string]reqs.DeleteRequest, session *sess.Session) error {
	requests := []reqs.SaveRequest{{
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

// PlatformSave function
func PlatformSave(psrs []PlatformSaveRequest, session *sess.Session) ([]reqs.SaveResponse, error) {

	requests := []reqs.SaveRequest{}

	for _, psr := range psrs {
		collection := psr.Collection
		collectionName := collection.GetName()

		// Turn the user struct into a map string interface
		data, err := collection.Marshal()
		if err != nil {
			return nil, err
		}

		changeRequests := map[string]reqs.ChangeRequest{}

		for index, item := range data {
			changeRequests[strconv.Itoa(index)] = item
		}

		requests = append(requests, reqs.SaveRequest{
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
		return nil, err
	}

	return saveResponse.Wires, nil
}
