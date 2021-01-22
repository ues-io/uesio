package controller

import (
	"fmt"
	"net/http"
)

// Health is good
func Health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "HEALTHY")
}
