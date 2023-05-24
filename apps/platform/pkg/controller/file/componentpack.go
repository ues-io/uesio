package file

import (
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func ServeComponentPackFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	resourceVersion := vars["version"]
	path := vars["filename"]

	session := middleware.GetSession(r)

	componentPack := meta.NewBaseComponentPack(namespace, name)

	err := bundle.Load(componentPack, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	fileModTime, stream, err := bundle.GetItemAttachment(componentPack, "dist/"+path, session)

	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
		return
	}

	modTime := fileModTime.Unix()

	// Get the greater of the two modtimes
	if modTime < componentPack.UpdatedAt {
		modTime = componentPack.UpdatedAt
	}

	usePath := "pack.js" 
	if path != "runtime.js" && strings.HasSuffix(path, ".json") {
		usePath = path
	}

	respondFile(w, r, &FileRequest{
		Path:         usePath,
		LastModified: time.Unix(modTime, 0),
		Namespace:    namespace,
		Version:      resourceVersion,
	}, stream)
}
