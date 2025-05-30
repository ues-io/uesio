import { Context } from "../context/context"

export const respondJSON = async (response: Response) => {
  if (interceptPlatformRedirects(response)) return
  if (response.status >= 400) {
    const errorText = await response.text()
    throw new Error(
      errorText ? errorText : "We are sorry, something went wrong on our side",
    )
  }

  return response.json()
}

export const respondVoid = async (response: Response) => {
  if (interceptPlatformRedirects(response)) return
  if (response.status >= 400) {
    const errorText = await response.text()
    throw new Error(errorText)
  }

  return
}

export function interceptPlatformRedirects(response: Response) {
  const locationHeader = response.headers.get("location")
  if (locationHeader) {
    window.location.href = locationHeader
    return true
  }
  return false
}

export const getJSON = (context: Context, url: string) =>
  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
  }).then(respondJSON)

export const del = (context: Context, url: string) =>
  fetch(url, {
    method: "DELETE",
  })

export const post = (context: Context, url: string) =>
  fetch(url, {
    method: "POST",
  })

export const postJSON = (
  context: Context,
  url: string,
  body: Record<string, unknown>,
) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

export const postBinary = (
  context: Context,
  url: string,
  body: string | Blob | File | FormData,
) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body,
  })

export const postMultipartForm = (
  context: Context,
  url: string,
  body: string | Blob | File | FormData,
) =>
  fetch(url, {
    method: "POST",
    // Do not set the content-type header. The browser does this for us.
    body,
  })
