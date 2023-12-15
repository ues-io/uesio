package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var dataSourceTypesByName = map[string]string{
	meta.PLATFORM_DATA_SOURCE: "uesio.postgresio",
}

func GetConnection(dataSourceKey string, metadata *wire.MetadataCache, session *sess.Session, connection wire.Connection) (wire.Connection, error) {

	// If we were provided a default connection for this datasource,
	// use that instead
	if connection != nil {
		return connection, nil
	}

	namespace, _, err := meta.ParseKey(dataSourceKey)
	if err != nil {
		return nil, err
	}

	// Enter into a version context to get these
	// credentials as the datasource's namespace
	versionSession := session
	if session != nil {
		versionSession, err = EnterVersionContext(namespace, session, connection)
		if err != nil {
			return nil, err
		}
	}

	mergedType, hasType := dataSourceTypesByName[dataSourceKey]
	if !hasType {
		return nil, errors.New("unknown datasource type: " + dataSourceKey)
	}

	adapter, err := adapt.GetAdapter(mergedType)
	if err != nil {
		return nil, err
	}

	credentials, err := GetCredentials(adapter.GetCredentials(), versionSession)
	if err != nil {
		return nil, err
	}

	return adapter.GetConnection(session.Context(), credentials, metadata, dataSourceKey)
}
