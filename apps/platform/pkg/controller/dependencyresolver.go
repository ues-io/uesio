package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// MetadataList is good
func MetadataList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	conditions := meta.BundleConditions{}

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions["studio.collection"] = grouping
	} else if metadatatype == "bots" {
		conditions["studio.type"] = grouping
	}

	collection, err := meta.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = bundle.LoadAll(collection, namespace, conditions, session)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collectionKeyMap := map[string]bool{}

	err = collection.Loop(func(item loadable.Item) error {
		var key string
		// Special handling for fields for now
		if metadatatype == "fields" {
			field := item.(*meta.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != grouping {
				return nil
			}
		} else {
			key = item.(meta.BundleableItem).GetKey()
		}
		collectionKeyMap[key] = true
		return nil
	})
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &collectionKeyMap)

}

// NamespaceList is good
func NamespaceList(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	namespaces := session.GetContextNamespaces()
	respondJSON(w, r, &namespaces)
}
