package file

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"

	"github.com/thecloudmasters/uesio/pkg/logger"
)

const CacheFor1Year = "private, no-transform, max-age=31536000, s-maxage=31536000"

func RespondJSON(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/json")

	err := json.NewEncoder(w).Encode(v)
	if err != nil {
		logger.LogError(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
func respondFile(w http.ResponseWriter, r *http.Request, fileRequest *FileRequest, stream io.ReadSeeker) {
	if stream == nil {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "application/json")
		resp := make(map[string]string)
		resp["message"] = "Resource Not Found"
		jsonResp, err := json.Marshal(resp)
		if err != nil {
			logger.LogError(err)
		}
		w.Write(jsonResp)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s\"", fileRequest.Path))
	if fileRequest.TreatAsImmutable() {
		w.Header().Set("Cache-Control", CacheFor1Year)
	}

	http.ServeContent(w, r, fileRequest.Path, fileRequest.LastModified, stream)
	return

}

func ServeFileContent(file *meta.File, version string, w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)

	err := bundle.Load(file, session, nil)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}
	_, stream, err := bundle.GetItemAttachment(file, file.Path, session)
	if err != nil {
		logger.LogError(err)
		http.Error(w, "Failed File Download", http.StatusInternalServerError)
		return
	}

	//usage.RegisterEvent("DOWNLOAD", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, 0, session)
	//usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, contentLength, session)

	respondFile(w, r, &FileRequest{
		Path:         file.Path,
		LastModified: time.Unix(file.UpdatedAt, 0),
		Namespace:    file.Namespace,
		Version:      version,
	}, stream)
}

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	file := meta.NewBaseFile(vars["namespace"], vars["name"])
	ServeFileContent(file, vars["version"], w, r)
}
