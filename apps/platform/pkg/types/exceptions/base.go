package exceptions

import "fmt"

type BaseException struct {
	message string
	err     error
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

func (e *BaseException) Error() string {
	return printErr("", e.message, e.err)
}

func (e *BaseException) Unwrap() error {
	return e.err
}
