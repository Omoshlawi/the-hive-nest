

## Usage Examples

### Option 1: Client Provides InstanceId
```typescript
// Client controls the instance ID
await registryClient.register({
  name: '@hive/user-service',
  host: 'localhost',
  port: 3001,
  version: '1.0.0',
  instanceId: 'user-service-prod-01', // Client-defined
});
```

### Option 2: Server Generates InstanceId  
```typescript
// Server generates instance ID automatically
const registration = await registryClient.register({
  name: '@hive/user-service',
  host: 'localhost', 
  port: 3001,
  version: '1.0.0',
  // No instanceId provided - server will generate
});

console.log(`Server assigned instanceId: ${registration.instanceId}`);
// Output: "user-service-localhost-3001-l8x9k2m1-a4f7b9"
```

### Option 3: Utility Helper for Client-Generated IDs
```typescript
import { ServiceUtils } from '@hive/registry';

// Use utility to generate consistent instance IDs
const instanceId = ServiceUtils.generateInstanceId('@hive/user-service', 'localhost', 3001);

await registryClient.register({
  name: '@hive/user-service',
  host: 'localhost',
  port: 3001,
  version: '1.0.0',
  instanceId, // Client-generated but using utility
});
```

## Pros and Cons

### Client-Generated InstanceId (Current Implementation)
**Pros:**
- Client has full control over instance identification
- Useful for stateful services or specific naming conventions
- Can restart with same instance ID for continuity

**Cons:**
- Risk of ID collisions if clients don't generate properly
- Clients must handle ID generation logic

### Server-Generated InstanceId
**Pros:**
- Guaranteed uniqueness
- Simpler client implementation
- Centralized ID management

**Cons:**
- Less client control
- Harder to maintain instance identity across restarts
- Need to store instance ID for subsequent operations

## Recommendation

For most microservice architectures, I'd recommend the **hybrid approach** (shown above) where:

1. **Server generates instanceId by default** (simpler for most clients)
2. **Clients can optionally provide their own instanceId** (for special cases)
3. **Server validates uniqueness** and handles collisions

This gives you the best of both worlds - simplicity for most cases, but flexibility when needed.