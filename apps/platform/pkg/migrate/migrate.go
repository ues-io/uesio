package migrate

import (
	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Migrate func
func Migrate(session *sess.Session) error {

	site := session.GetSite()

	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}
	var collections metadata.CollectionCollection
	namespace := session.GetWorkspaceApp()
	// Loop over all collections in the workspace/site and batch by data source
	err := datasource.LoadMetadataCollection(&collections, namespace, nil, session)
	if err != nil {
		return err
	}

	var fields metadata.FieldCollection
	err = datasource.LoadMetadataCollection(&fields, namespace, nil, session)
	if err != nil {
		return err
	}

	metadataRequest := datasource.MetadataRequest{}
	for _, collection := range collections {
		collectionKey := collection.Namespace + "." + collection.Name
		metadataRequest.AddCollection(collectionKey)

		for _, field := range fields {

			if field.CollectionRef != collectionKey {
				continue
			}

			fieldKey := field.Namespace + "." + field.Name
			metadataRequest.AddField(collectionKey, fieldKey, nil)
		}
	}

	err = metadataRequest.Load(&metadataResponse, collatedMetadata, session)
	if err != nil {
		return err
	}

	// Then migrate for each datasource
	// 3. Get metadata for each datasource and collection
	for dsKey := range collatedMetadata {

		ds, err := metadata.NewDataSource(dsKey)
		if err != nil {
			return err
		}

		err = datasource.LoadMetadataItem(ds, session)
		if err != nil {
			return err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := ds.GetAdapterType()
		adapter, err := adapters.GetAdapter(adapterType)
		if err != nil {
			return err
		}
		credentials, err := ds.GetCredentials(site)
		if err != nil {
			return err
		}

		err = adapter.Migrate(collatedMetadata[dsKey], credentials)
		if err != nil {
			return err
		}

	}

	return nil
}
