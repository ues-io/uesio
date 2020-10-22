package controllers

import (
	"encoding/json"
	"net/http"
	"reflect"

	"github.com/gorilla/mux"
	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/middlewares"
	"github.com/thecloudmasters/uesio/pkg/reqs"
)

// MetadataList is good
func MetadataList(w http.ResponseWriter, r *http.Request) {
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	vars := mux.Vars(r)
	metadatatype := vars["type"]
	namespace := vars["namespace"]
	grouping := vars["grouping"]

	conditions := []reqs.LoadRequestCondition{}

	// Special handling for fields for now
	if metadatatype == "fields" {
		conditions = append(conditions, reqs.LoadRequestCondition{
			Field: "uesio.collection",
			Value: grouping,
		})
	}

	collection, err := metadata.GetBundleableGroupFromType(metadatatype)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = datasource.LoadMetadataCollection(collection, namespace, conditions, site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	collectionKeyMap := map[string]bool{}

	length := reflect.Indirect(reflect.ValueOf(collection)).Len()

	for i := 0; i < length; i++ {
		item := collection.GetItem(i)

		var key string

		// Special handling for fields for now
		if metadatatype == "fields" {
			field := item.(*metadata.Field)
			key = field.Namespace + "." + field.Name
			if field.CollectionRef != grouping {
				continue
			}
		} else {
			key = item.GetKey()
		}
		collectionKeyMap[key] = true
	}

	err = json.NewEncoder(w).Encode(&collectionKeyMap)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

// NamespaceList is good
func NamespaceList(w http.ResponseWriter, r *http.Request) {
	site := r.Context().Value(middlewares.SiteKey).(*metadata.Site)
	sess := r.Context().Value(middlewares.SessionKey).(*session.Session)

	namespaces, err := metadata.GetValidNamespaces(site, sess)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(&namespaces)
	if err != nil {
		logger.LogErrorWithTrace(r, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	return

}
