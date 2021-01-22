package migrate

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// Migrate func
func Migrate(session *sess.Session) error {

	site := session.GetSite()

	collatedMetadata := map[string]*adapt.MetadataCache{}
	metadataResponse := adapt.MetadataCache{}
	var collections meta.CollectionCollection
	namespace := session.GetWorkspaceApp()
	// Loop over all collections in the workspace/site and batch by data source
	err := bundle.LoadAll(&collections, namespace, nil, session)
	if err != nil {
		return err
	}

	var fields meta.FieldCollection
	err = bundle.LoadAll(&fields, namespace, nil, session)
	if err != nil {
		return err
	}

	metadataRequest := datasource.MetadataRequest{}
	for _, collection := range collections {
		collectionKey := collection.Namespace + "." + collection.Name
		err := metadataRequest.AddCollection(collectionKey)
		if err != nil {
			return err
		}

		for _, field := range fields {

			if field.CollectionRef != collectionKey {
				continue
			}

			fieldKey := field.Namespace + "." + field.Name
			err := metadataRequest.AddField(collectionKey, fieldKey, nil)
			if err != nil {
				return err
			}
		}
	}

	err = metadataRequest.Load(nil, &metadataResponse, collatedMetadata, session)
	if err != nil {
		return err
	}

	// Then migrate for each datasource
	// 3. Get metadata for each datasource and collection
	for dsKey := range collatedMetadata {

		ds, err := meta.NewDataSource(dsKey)
		if err != nil {
			return err
		}

		err = bundle.Load(ds, session)
		if err != nil {
			return err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := ds.GetAdapterType()
		adapter, err := adapt.GetAdapter(adapterType)
		if err != nil {
			return err
		}
		credentials, err := adapt.GetCredentials(ds, site)
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
