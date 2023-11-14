package file

import (
	"bytes"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
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
		slog.Error(err.Error())
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	buf := &bytes.Buffer{}
	fileMeta, err := bundle.GetItemAttachment(buf, componentPack, "dist/"+path, session)

	if err != nil {
		slog.Error(err.Error())
		http.Error(w, "Failed ComponentPack Download", http.StatusInternalServerError)
		return
	}

	lastModified := *fileMeta.LastModified()

	// Get the greater of the two modification times
	if lastModified.Unix() < componentPack.UpdatedAt {
		lastModified = time.Unix(componentPack.UpdatedAt, 0)
	}

	usePath := "pack.js"
	if path != "runtime.js" && strings.HasSuffix(path, ".json") {
		usePath = path
	}

	respondFile(w, r, &FileRequest{
		Path:         usePath,
		LastModified: lastModified,
		Namespace:    namespace,
		Version:      resourceVersion,
	}, bytes.NewReader(buf.Bytes()))
}
