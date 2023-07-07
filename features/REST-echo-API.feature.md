---
variants:
  - protocol: https
  - protocol: http
---

# Interacting with the REST echo API

> This file demonstrates how to use the REST echo API and at the same time is
> used to run automated tests.  
> The endpoint supports both unsecure HTTP and HTTPs.

## Generate a new random ID

> I should be able to generate a new random ID so I can use it for my own data.
> The response returns a UUIDv4.

When I POST to `${variant.protocol}://${domainName}/new`

Then the response status code should be `201`

And the response body should be a string matching
`^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$`

Given I store `responseBody` into `randomID`

## Using the random ID I can store a value

When I PUT to `${variant.protocol}://${domainName}/${randomID}` with

```
connect:anything
```

Then the response status code should be `202`

## I can read back the value

When I GET `${variant.protocol}://${domainName}/${randomID}`

Then the response status code should be `200`

And the response body should be a string matching `^connect:anything$`

## Finally I can delete the value

When I DELETE `${variant.protocol}://${domainName}/${randomID}`

Then the response status code should be `202`

## The deleted value can no longer be read

When I GET `${variant.protocol}://${domainName}/${randomID}`

<!-- @retryScenario @retry:tries=10,initialDelay=2000,delayFactor=2 -->

Soon the response status code should be `404`
