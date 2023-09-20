package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type PlatformSaveRequest struct {
	Collection meta.CollectionableGroup
	Options    *adapt.SaveOptions
	Params     map[string]string
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
		Item: item,
	}
	return PlatformDelete(collection, connection, session)
}

func GetSaveRequestFromPlatformSave(psr PlatformSaveRequest) SaveRequest {
	return SaveRequest{
		Collection: psr.Collection.GetName(),
		Wire:       "AnyKey",
		Changes:    psr.Collection,
		Options:    psr.Options,
		Params:     psr.Params,
	}
}

func PlatformSaves(psrs []PlatformSaveRequest, connection adapt.Connection, session *sess.Session) error {
	requests := make([]SaveRequest, len(psrs))
	for i := range psrs {
		requests[i] = GetSaveRequestFromPlatformSave(psrs[i])
	}
	return doPlatformSave(requests, connection, session)
}

func HandleSaveRequestErrors(requests []SaveRequest, err error) error {
	uniqueErrorStrings := map[string]bool{}
	errorStrings := []string{}
	if err != nil {
		errString := err.Error()
		uniqueErrorStrings[errString] = true
		errorStrings = append(errorStrings, errString)
	}
	for _, request := range requests {
		for _, saveError := range request.Errors {
			errString := saveError.Error()
			if _, hasValue := uniqueErrorStrings[errString]; !hasValue {
				uniqueErrorStrings[errString] = true
				errorStrings = append(errorStrings, errString)
			}
		}
	}

	if len(uniqueErrorStrings) > 0 {
		return errors.New(strings.Join(errorStrings, " : "))
	}

	return nil
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
		Connection: connection,
		Metadata:   connection.GetMetadata(),
	}
}

func doPlatformSave(requests []SaveRequest, connection adapt.Connection, session *sess.Session) error {
	err := SaveWithOptions(requests, session, GetConnectionSaveOptions(connection))
	return HandleSaveRequestErrors(requests, err)
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
			Item: item,
		},
		Options: options,
	}
}

func GetPlatformConnection(metadata *adapt.MetadataCache, session *sess.Session, connection adapt.Connection) (adapt.Connection, error) {
	if metadata == nil {
		metadata = &adapt.MetadataCache{}
	}
	return GetConnection(meta.PLATFORM_DATA_SOURCE, metadata, session, connection)
}
