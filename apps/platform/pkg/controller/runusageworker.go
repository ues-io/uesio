package controller

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/usage/usage_worker"
)

func RunUsageWorker(w http.ResponseWriter, r *http.Request) {
	err := usage_worker.UsageWorker()
	if err != nil {
		msg := "Usage Worker Failed: " + err.Error()
		slog.Error(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
	fmt.Fprintf(w, "Usage Worker Success")
}
