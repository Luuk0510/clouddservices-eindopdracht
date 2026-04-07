# `target.created.v1`

Exchange: `photo-prestige`  
Routing key: `target.created.v1`

Published by `target-service` after a target is created successfully.

## Payload

```json
{
  "targetId": "67f2c4c3e95fd87d94cf9f20",
  "ownerId": "user-123",
  "ownerEmail": "owner@example.com",
  "imageUrl": "https://example.com/target.jpg",
  "deadlineAt": "2026-04-12T18:00:00.000Z",
  "createdAt": "2026-04-07T14:15:00.000Z"
}
```

## Required fields

- `targetId`
- `ownerId`
- `deadlineAt`

## Consumers

- `clock-service`
- `photo-service`
