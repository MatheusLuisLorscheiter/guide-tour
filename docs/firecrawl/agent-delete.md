> ## Documentation Index
> Fetch the complete documentation index at: https://docs.firecrawl.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# Cancel Agent



## OpenAPI

````yaml /api-reference/v2-openapi.json DELETE /agent/{jobId}
openapi: 3.0.0
info:
  title: Firecrawl API
  version: v2
  description: >-
    API for interacting with Firecrawl services to perform web scraping and
    crawling tasks.
  contact:
    name: Firecrawl Support
    url: https://firecrawl.dev/support
    email: support@firecrawl.dev
servers:
  - url: https://api.firecrawl.dev/v2
security:
  - bearerAuth: []
paths:
  /agent/{jobId}:
    parameters:
      - name: jobId
        in: path
        description: The ID of the agent job
        required: true
        schema:
          type: string
          format: uuid
    delete:
      tags:
        - Agent
      summary: Cancel an agent job
      operationId: cancelAgent
      responses:
        '200':
          description: Agent job cancelled successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer

````

Built with [Mintlify](https://mintlify.com).