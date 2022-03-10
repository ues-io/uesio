package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection meta.CollectionableGroup
	Options    *adapt.SaveOptions
}

func PlatformDelete(request meta.CollectionableGroup, connection adapt.Connection, session *sess.Session) error {
	return doPlatformSave([]SaveRequest{{
		Wire:       "deleteRequest",
		Collection: request.GetName(),
		Deletes:    request,
	}}, connection, session)
}

func PlatformDeleteOne(item meta.CollectionableItem, connection adapt.Connection, session *sess.Session) error {
	collection := &LoadOneCollection{
		Collection: item.GetCollection(),
		Item:       item,
	}
	return PlatformDelete(collection, connection, session)
}

func GetSaveRequestFromPlatformSave(psr PlatformSaveRequest) SaveRequest {
	return SaveRequest{
		Collection: psr.Collection.GetName(),
		Wire:       "AnyKey",
		Changes:    psr.Collection,
		Options:    psr.Options,
	}
}

func PlatformSaves(psrs []PlatformSaveRequest, connection adapt.Connection, session *sess.Session) error {
	requests := make([]SaveRequest, len(psrs))
	for i := range psrs {
		requests[i] = GetSaveRequestFromPlatformSave(psrs[i])
	}
	return doPlatformSave(requests, connection, session)
}

func HandleSaveRequestErrors(requests []SaveRequest) error {
	for _, request := range requests {
		if request.Errors != nil {
			if len(request.Errors) > 0 {
				return errors.New(request.Errors[0].Error())
			}
		}
	}
	return nil
}

func GetConnectionMap(connection adapt.Connection) map[string]adapt.Connection {
	if connection == nil {
		return nil
	}
	return map[string]adapt.Connection{
		connection.GetDataSource(): connection,
	}
}

func GetConnectionMetadata(connection adapt.Connection) *adapt.MetadataCache {
	if connection == nil {
		return nil
	}
	return connection.GetMetadata()
}

func GetConnectionSaveOptions(connection adapt.Connection) *SaveOptions {
	if connection == nil {
		return nil
	}
	return &SaveOptions{
		Connections: GetConnectionMap(connection),
		Metadata:    connection.GetMetadata(),
	}
}

func doPlatformSave(requests []SaveRequest, connection adapt.Connection, session *sess.Session) error {
	err := SaveWithOptions(requests, session, GetConnectionSaveOptions(connection))
	if err != nil {
		return err
	}
	return HandleSaveRequestErrors(requests)
}

func PlatformSave(psr PlatformSaveRequest, connection adapt.Connection, session *sess.Session) error {
	return PlatformSaves([]PlatformSaveRequest{
		psr,
	}, connection, session)
}

func PlatformSaveOne(item meta.CollectionableItem, options *adapt.SaveOptions, connection adapt.Connection, session *sess.Session) error {
	return PlatformSave(*GetPlatformSaveOneRequest(item, options), connection, session)
}

func GetPlatformSaveOneRequest(item meta.CollectionableItem, options *adapt.SaveOptions) *PlatformSaveRequest {
	return &PlatformSaveRequest{
		Collection: &LoadOneCollection{
			Collection: item.GetCollection(),
			Item:       item,
		},
		Options: options,
	}
}

func GetPlatformConnection(session *sess.Session) (adapt.Connection, error) {
	return GetConnection("uesio.platform", nil, nil, session, nil)
}
