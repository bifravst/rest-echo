---
variants:
  - protocol: https
  - protocol: http
---

# Redirect to GitHub

> Calling the root of the server should redirect to the GitHub project page

## Redirect to GitHub

When I GET `${variant.protocol}://${domainName}/`

Then the response status code should be `302`

And the response `location` header should equal
`https://github.com/bifravst/rest-echo`
