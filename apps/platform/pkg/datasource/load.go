package datasource

import (
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getMetadataForLoad(
	op *adapters.LoadOp,
	metadataResponse *adapters.MetadataCache,
	collatedMetadata map[string]*adapters.MetadataCache,
	ops []adapters.LoadOp,
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
		subFields := FieldsMap{}
		for _, subField := range requestField.Fields {
			// TODO: This should be recursive
			subFields[subField.ID] = FieldsMap{}
		}
		err := collections.AddField(collectionKey, requestField.ID, &subFields)
		if err != nil {
			return err
		}
	}

	for _, condition := range op.Conditions {

		if condition.Type == "SEARCH" {
			// We don't need any extra field metadata for search conditions yet
			continue
		}
		err := collections.AddField(collectionKey, condition.Field, nil)
		if err != nil {
			return fmt.Errorf("condition field: %v", err)
		}

		if condition.ValueSource == "LOOKUP" && condition.LookupField != "" && condition.LookupWire != "" {

			// Look through the previous wires to find the one to look up on.
			var lookupCollectionKey string
			for _, op := range ops {
				if op.WireName == condition.LookupWire {
					lookupCollectionKey = op.CollectionName
				}
			}
			err := collections.AddField(lookupCollectionKey, condition.LookupField, nil)
			if err != nil {
				return fmt.Errorf("lookup field: %v", err)
			}
		}

	}

	return collections.Load(op, metadataResponse, collatedMetadata, session)

}

// Load function
func Load(ops []adapters.LoadOp, session *sess.Session) (*adapters.MetadataCache, error) {
	site := session.GetSite()
	collated := map[string][]adapters.LoadOp{}
	collatedMetadata := map[string]*adapters.MetadataCache{}
	metadataResponse := adapters.MetadataCache{}

	// Loop over the ops and batch per data source
	for i := range ops {
		op := ops[i]
		err := getMetadataForLoad(&op, &metadataResponse, collatedMetadata, ops, session)
		if err != nil {
			return nil, fmt.Errorf("metadata: %s: %v", op.CollectionName, err)
		}

		// Get the datasource from the object name
		collectionMetadata, err := metadataResponse.GetCollection(op.CollectionName)
		if err != nil {
			return nil, err
		}

		//Set default order by: id - asc
		if op.Order == nil {
			idField, _ := collectionMetadata.GetIDField()
			idFieldName := idField.GetFullName()
			def := adapters.LoadRequestOrder{Field: idFieldName, Desc: false}
			op.Order = append(op.Order, def)
		}

		dsKey := collectionMetadata.DataSource
		batch := collated[dsKey]
		if op.Type == "QUERY" || op.Type == "" {
			if batch == nil {
				batch = []adapters.LoadOp{}
			}
			batch = append(batch, op)
		}
		collated[dsKey] = batch
	}

	// 3. Get metadata for each datasource and collection
	for dsKey, batch := range collated {

		datasource, err := metadata.NewDataSource(dsKey)
		if err != nil {
			return nil, err
		}

		err = bundles.Load(datasource, session)
		if err != nil {
			return nil, err
		}

		// Now figure out which data source adapter to use
		// and make the requests
		// It would be better to make this requests in parallel
		// instead of in series
		adapterType := datasource.GetAdapterType()
		adapter, err := adapters.GetAdapter(adapterType)
		if err != nil {
			return nil, err
		}
		credentials, err := datasource.GetCredentials(site)
		if err != nil {
			return nil, err
		}

		err = adapter.Load(batch, collatedMetadata[dsKey], credentials)
		if err != nil {
			return nil, err
		}

		// Now do our supplemental reference loads
		for i := range batch {
			op := batch[i]
			for colKey, referencedCol := range op.ReferencedCollections {
				datasource, err := metadata.NewDataSource(referencedCol.Metadata.DataSource)
				if err != nil {
					return nil, err
				}

				err = bundles.Load(datasource, session)
				if err != nil {
					return nil, err
				}

				// Now figure out which data source adapter to use
				// and make the requests
				// It would be better to make this requests in parallel
				// instead of in series
				adapterType := datasource.GetAdapterType()
				adapter, err := adapters.GetAdapter(adapterType)
				if err != nil {
					return nil, err
				}
				credentials, err := datasource.GetCredentials(site)
				if err != nil {
					return nil, err
				}

				err = op.Collection.Loop(func(item adapters.LoadableItem) error {
					for _, reference := range referencedCol.ReferenceFields {
						value, err := item.GetField(reference.ForeignKeyField)
						if err != nil {
							return err
						}
						referencedCol.AddID(value)
					}

					return nil
				})
				if err != nil {
					return nil, err
				}

				err = adapters.HandleReferences(func(op *adapters.LoadOp, metadata *adapters.MetadataCache) error {
					return adapter.Load([]adapters.LoadOp{*op}, metadata, credentials)
				}, &op, collatedMetadata[referencedCol.Metadata.DataSource], adapters.ReferenceRegistry{
					colKey: referencedCol,
				})
				if err != nil {
					return nil, err
				}
			}

		}

	}
	return &metadataResponse, nil
}
