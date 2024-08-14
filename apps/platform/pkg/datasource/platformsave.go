package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type PlatformSaveRequest struct {
	Collection meta.CollectionableGroup
	Options    *wire.SaveOptions
	Params     map[string]interface{}
}

func PlatformDelete(request meta.CollectionableGroup, connection wire.Connection, session *sess.Session) error {
	return doPlatformSave([]SaveRequest{{
		Wire:       "deleteRequest",
		Collection: request.GetName(),
		Deletes:    request,
	}}, connection, session)
}

func PlatformDeleteOne(item meta.CollectionableItem, connection wire.Connection, session *sess.Session) error {
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

func PlatformSaves(psrs []PlatformSaveRequest, connection wire.Connection, session *sess.Session) error {
	requests := make([]SaveRequest, len(psrs))
	for i := range psrs {
		requests[i] = GetSaveRequestFromPlatformSave(psrs[i])
	}
	return doPlatformSave(requests, connection, session)
}

func HandleSaveRequestErrors(requests []SaveRequest, err error) error {

	uniqueErrorStrings := map[string]bool{}
	var errorStrings []string
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
		return exceptions.NewBadRequestException(strings.Join(errorStrings, " : "))
	}

	return nil
}

func NewSaveOptions(connection wire.Connection, metadata *wire.MetadataCache) *SaveOptions {
	if connection == nil && metadata == nil {
		return nil
	}
	return &SaveOptions{
		Connection: connection,
		Metadata:   metadata,
	}
}

func doPlatformSave(requests []SaveRequest, connection wire.Connection, session *sess.Session) error {
	err := SaveWithOptions(requests, session, NewSaveOptions(connection, nil))
	return HandleSaveRequestErrors(requests, err)
}

func PlatformSave(psr PlatformSaveRequest, connection wire.Connection, session *sess.Session) error {
	return PlatformSaves([]PlatformSaveRequest{
		psr,
	}, connection, session)
}

func PlatformSaveOne(item meta.CollectionableItem, options *wire.SaveOptions, connection wire.Connection, session *sess.Session) error {
	return PlatformSave(*GetPlatformSaveOneRequest(item, options), connection, session)
}

func GetPlatformSaveOneRequest(item meta.CollectionableItem, options *wire.SaveOptions) *PlatformSaveRequest {
	return &PlatformSaveRequest{
		Collection: &LoadOneCollection{
			Item: item,
		},
		Options: options,
	}
}

func GetPlatformConnection(session *sess.Session, connection wire.Connection) (wire.Connection, error) {
	return GetConnection(meta.PLATFORM_DATA_SOURCE, session, connection)
}
