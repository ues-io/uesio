package exceptions

import (
	"errors"
	"fmt"
	"net/http"
)

// GetStatusCodeForError returns an HTTP status code appropriate for the error type,
// defaulting to 500 Internal Server Error for generic ctlutil
func GetStatusCodeForError(err error) int {
	if IsType[*UnauthorizedException](err) {
		return http.StatusUnauthorized
	}

	if IsType[*BadRequestException](err) {
		return http.StatusBadRequest
	}

	if IsType[*InvalidParamException](err) {
		return http.StatusBadRequest
	}

	if IsType[*ExecutionException](err) {
		return http.StatusBadRequest
	}

	if IsType[*NotFoundException](err) {
		return http.StatusNotFound
	}

	if IsType[*SystemBotNotFoundException](err) {
		return http.StatusNotFound
	}

	if IsType[*ForbiddenException](err) {
		return http.StatusForbidden
	}

	if IsType[*DuplicateException](err) {
		return http.StatusConflict
	}

	return http.StatusInternalServerError
}

func IsType[K error](err error) bool {
	var e K
	return errors.As(err, &e)
}

func printErr(prefix, message string, err error) string {
	if prefix != "" {
		return printErrWithPrefix(prefix, message, err)
	}
	return printErrNoPrefix(message, err)
}

func printErrWithPrefix(prefix, message string, err error) string {
	if message != "" && err != nil {
		return fmt.Sprintf("%s %s: %v", prefix, message, err)
	}
	if err != nil {
		return fmt.Sprintf("%s %v", prefix, err)
	}
	return fmt.Sprintf("%s %s", prefix, message)
}

func printErrNoPrefix(message string, err error) string {
	if message != "" && err != nil {
		return fmt.Sprintf("%s: %v", message, err)
	}
	if err != nil {
		return err.Error()
	}
	return message
}
