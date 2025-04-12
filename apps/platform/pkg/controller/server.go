package controller

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/thecloudmasters/uesio/pkg/env"
)

var gracefulShutdownSeconds int

func init() {
	gracefulShutdownSecondsEnvVar := os.Getenv("UESIO_GRACEFUL_SHUTDOWN_SECONDS")
	if intVal, err := strconv.Atoi(gracefulShutdownSecondsEnvVar); err == nil {
		gracefulShutdownSeconds = intVal
	} else if env.InDevMode() {
		gracefulShutdownSeconds = 0
	} else {
		gracefulShutdownSeconds = 5
	}
}

func GetGracefulShutdownSeconds() int {
	return gracefulShutdownSeconds
}

func NewServer(serveAddress string, router http.Handler) *ServerWithShutdown {
	return &ServerWithShutdown{
		// TODO: Evaluate timeouts here (e.g., ReadTimeout, WriteTimeout, etc.). The default and what
		// we currently use is 0 (no timeout) which could lead to a client taking a connection forever
		// which could result in running out of file descriptors.
		// See https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/ &
		// https://blog.cloudflare.com/exposing-go-on-the-internet/ & https://simon-frey.com/blog/go-as-in-golang-standard-net-http-config-will-break-your-production/
		Server: http.Server{
			Addr:    serveAddress,
			Handler: router,
		},
		startupError: make(chan bool),
	}
}

type ServerWithShutdown struct {
	http.Server
	startupError chan bool
}

// StartupError should ONLY be called on initial startup if the server failed to start due to misconfiguration,
// conflicting processes, etc. this will immediately terminate the server,
// without performing graceful shutdown.
func (s *ServerWithShutdown) StartupError() {
	s.startupError <- true
}

// WaitShutdown will block until a SIGINT/SIGTERM signal is sent to the process,
// at which point it will wait for <gracefulShutdownSeconds> before actually killing the server.
// This allows in-flight requests and processes to be cleanly completed.
// Load balancers should NOT be sending us any net-new API requests after the interrupt signal is received.
func (s *ServerWithShutdown) WaitShutdown() {
	irqSig := make(chan os.Signal, 1)
	signal.Notify(irqSig, syscall.SIGINT, syscall.SIGTERM)

	startupError := false

	// Wait for an interrupt signal is sent
	select {
	case sig := <-irqSig:
		slog.Info(fmt.Sprintf("Shutdown initiated (signal: %s)", sig.String()))
	case <-s.startupError:
		startupError = true
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(gracefulShutdownSeconds+1)*time.Second)
	defer cancel()

	// If there was an error starting up the server, this channel will receive a message
	if !startupError {
		slog.Info(fmt.Sprintf("Waiting %d seconds to allow in-flight processes to finish...", gracefulShutdownSeconds))

		// Create shutdown context with timeout
		t := time.NewTimer(time.Duration(gracefulShutdownSeconds) * time.Second)
		defer t.Stop()
		<-t.C
	}

	// Completely shutdown the server
	err := s.Shutdown(ctx)
	if err != nil {
		slog.Error(fmt.Sprintf("Error terminating server: %s", err.Error()))
	}
	if !startupError {
		slog.Info("Graceful shutdown is complete.")
	}
}
