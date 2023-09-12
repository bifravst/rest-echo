---
exampleContext:
  variant:
    protocol: https
  domainName: echo.thingy.rocks
  randomID: 9e69d1e3-614b-456b-9772-7982f4f358ed
---

# Encode the stored payload as base64

> The stored content may be requested to be encoded using base64 in order to
> inspect binary payload

## Generate a new random ID

When I POST to `https://${domainName}/new`

Given I store `response.body` into `randomID`

When I PUT to `https://${domainName}/${randomID}` with

```
Content-type: application/octet-stream

connect:anything
```

Soon the response status code should be `202`

## I can read back the base64 encoded value

When I GET `https://${domainName}/${randomID}` with

```
Accept-Encoding: base64
```

Soon the response status code should be `200`

And the response body should equal

```
Y29ubmVjdDphbnl0aGluZw==
```
