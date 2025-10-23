## Universal Address Model

```ts
// ✅ Kenya Example:
// Creating a Kenyan address with full hierarchy
const kenyaAddress = {
  address1: 'Kimathi Street, Building No. 45',
  address2: 'Floor 3, Suite 302',
  landmark: 'Next to Kencom Bus Station',

  // Hierarchical levels
  level1: 'Nairobi County', // County
  level2: 'Westlands Sub-County', // Sub-County
  level3: 'Parklands/Highridge Ward', // Ward
  level4: 'Parklands Estate', // Estate/Village
  level5: 'Block A', // Optional: Building block

  country: 'KE',
  postalCode: '00100',

  // Optional: Store what each level means
  localeFormat: {
    level1: 'County',
    level2: 'Sub-County',
    level3: 'Ward',
    level4: 'Estate',
    level5: 'Block',
  },
};

// ✅ USA Example:
const usaAddress = {
  address1: '123 Main Street',
  address2: 'Apt 4B',
  landmark: 'Near Central Park',

  level1: 'New York', // State
  level2: 'New York City', // City
  level3: 'Manhattan', // Borough
  level4: 'Upper West Side', // Neighborhood

  country: 'US',
  postalCode: '10025',

  localeFormat: {
    level1: 'State',
    level2: 'City',
    level3: 'Borough',
    level4: 'Neighborhood',
  },
};

// ✅ UK Example:
const ukAddress = {
  address1: '10 Downing Street',

  level1: 'England', // Country (within UK)
  level2: 'Greater London', // County/Region
  level3: 'Westminster', // Borough
  level4: 'Westminster', // District

  country: 'GB',
  postalCode: 'SW1A 2AA',

  localeFormat: {
    level1: 'Country',
    level2: 'Region',
    level3: 'Borough',
    level4: 'District',
  },
};
```

### Key Features for Flexibility:

1. Hierarchical Levels (level1-5)

- Adapts to any country's administrative structure
- Kenya: County → Sub-County → Ward → Estate
- US: State → City → Borough → Neighborhood
- India: State → District → Taluka → Village

2. Landmark Field

- Critical for Kenya and many developing countries
- "Next to Nakumatt", "Opposite Shell Petrol Station"
- Helps with directions where street names may not be well-known

3. Optional AddressHierarchy Table

- Pre-populate with official administrative boundaries
- Enables cascading dropdowns in your UI:

```ts
// → User selects "Nairobi County"
// → System shows Sub-Counties: Westlands, Starehe, Dagoretti...
// → User selects "Westlands"
// → System shows Wards: Parklands/Highridge, Kitisuru...
```

4. Plus Code Support

- Google Plus Codes work everywhere, even without street addresses
- Example: PX4J+2G Nairobi pinpoints exact location
- Great for rural areas or informal settlements

5. Legacy Fields (cityVillage, stateProvince)

- Backward compatibility
- Can auto-populate from hierarchy levels based on country

- Service Layer Example:

```ts
// address.service.ts
async formatAddress(address: Address): Promise<string> {
  const parts = [];

  if (address.address1) parts.push(address.address1);
  if (address.address2) parts.push(address.address2);
  if (address.landmark) parts.push(address.landmark);
  if (address.level4) parts.push(address.level4);
  if (address.level3) parts.push(address.level3);
  if (address.level2) parts.push(address.level2);
  if (address.level1) parts.push(address.level1);
  if (address.postalCode) parts.push(address.postalCode);

  // Add country name lookup
  const countryName = this.getCountryName(address.country);
  if (countryName) parts.push(countryName);

  return parts.join(', ');
}

// Query addresses by hierarchy
async findAddressesByRegion(country: string, level1?: string, level2?: string) {
  return this.prisma.address.findMany({
    where: {
      country,
      ...(level1 && { level1 }),
      ...(level2 && { level2 }),
    }
  });
}

```

## 🎯 The Core Concept

Think of the address hierarchy like Russian nesting dolls - each level contains the next smaller level:

```
🇰🇪 Kenya (Country)
  └─ 📍 Nairobi County (level1)
      └─ 🏘️ Westlands Sub-County (level2)
          └─ 🏡 Parklands Ward (level3)
              └─ 🏠 Parklands Estate (level4)
                  └─ 🏢 Block A (level5)
                      └─ 🚪 Building 45, Floor 3, Suite 302 (address1, address2)
```

1. 📝 Example 1: Kenyan Address (Full Detail)

- User Story: John lives in Parklands, Nairobi and wants to add his home address.

```ts
{
  // WHO owns this address?
  userId: "john-123",
  type: "HOME",
  label: "My Apartment",

  // STREET LEVEL (Most specific)
  address1: "Kimathi Street, Building 45",  // Building number + street
  address2: "Floor 3, Apartment 302",       // Unit within building
  landmark: "Next to Java House Westlands", // Helpful directions

  // ADMINISTRATIVE HIERARCHY (Broad to specific)
  level1: "Nairobi County",           // Biggest administrative unit
  level2: "Westlands Sub-County",     // Inside Nairobi County
  level3: "Parklands/Highridge Ward", // Inside Westlands Sub-County
  level4: "Parklands Estate",         // Inside the Ward
  level5: "Phase 2",                  // Optional: specific neighborhood section

  // COUNTRY & POSTAL
  country: "KE",
  postalCode: "00100",

  // COORDINATES (Optional but useful)
  latitude: -1.2634,
  longitude: 36.8081,
  plusCode: "6GCQP9P5+2G",

  // METADATA
  preferred: true,  // This is John's main address

  // HELPER (explains what each level means in Kenya)
  localeFormat: {
    level1: "County",
    level2: "Sub-County",
    level3: "Ward",
    level4: "Estate",
    level5: "Phase"
  }
}
```

**When displayed to user, this formats as:**

```
Building 45, Kimathi Street
Floor 3, Apartment 302
Next to Java House Westlands
Parklands Estate, Phase 2
Parklands/Highridge Ward
Westlands Sub-County
Nairobi County
Kenya, 00100
```

2. 📝 Example 2: Rural Kenyan Address (Minimal Detail)

- User Story: Mary lives in a village where there are no street names.

```ts
{
  userId: "mary-456",
  type: "HOME",

  // NO street address - uses landmark instead
  address1: "Opposite Chief's Camp",
  landmark: "200m from Kisii-Kilgoris Road",

  // HIERARCHY (stops at village level)
  level1: "Nairobi County",
  level2: "Kajiado Sub-County",
  level3: "Olkeri Ward",
  level4: "Olkeri Village",
  // level5 not needed

  country: "KE",
  postalCode: null,  // No postal code in rural areas

  // Coordinates are CRUCIAL here
  latitude: -1.4567,
  longitude: 36.2345,
  plusCode: "6GCQH6JM+XY",  // Google Plus Code helps delivery

  localeFormat: {
    level1: "County",
    level2: "Sub-County",
    level3: "Ward",
    level4: "Village"
  }
}
```

3. 📝 Example 3: US Address (Different Hierarchy)
- User Story: Sarah lives in New York City.

```ts
{
  userId: "sarah-789",
  type: "HOME",
  
  address1: "350 5th Avenue",
  address2: "Suite 4210",
  landmark: "Empire State Building",
  
  // US uses different hierarchy names
  level1: "New York",         // STATE (not county!)
  level2: "New York City",    // CITY
  level3: "Manhattan",        // BOROUGH
  level4: "Midtown",          // NEIGHBORHOOD
  
  country: "US",
  postalCode: "10118",
  
  // Different labels for US
  localeFormat: {
    level1: "State",
    level2: "City",
    level3: "Borough",
    level4: "Neighborhood"
  }
}
```
Same fields, different meanings! The model adapts.

4. 🏢 Example 4: Organization Address
- User Story: A company has a branch office in Mombasa.

```ts
{
  // ORGANIZATION owns this (not a user)
  organizationId: "acme-corp",
  userId: null,  // No user - it's a company address
  
  type: "BRANCH",
  label: "Mombasa Regional Office",
  
  address1: "Nkrumah Road, ABC Place",
  address2: "7th Floor",
  
  level1: "Mombasa County",
  level2: "Mvita Sub-County", 
  level3: "Tononoka Ward",
  
  country: "KE",
  postalCode: "80100",
  
  preferred: false  // Not the main office
}
```

TODO: bRAINSTOME ON BELLOW ENUM SPECIFIC TO REAL ESTATE

```prisma

enum AddressType {
  // Core property addresses
  PROPERTY        // The physical location of a real estate unit
  PROJECT_SITE    // For construction projects or gated communities
  LAND_PLOT       // For land-only listings or parcels
  DEVELOPMENT     // For multi-unit developments (e.g., estates, apartments)

  // Organizational/Business addresses
  HEAD_OFFICE
  BRANCH_OFFICE
  SALES_OFFICE
  AGENCY_OFFICE
  DEVELOPER_OFFICE

  // User-related addresses
  OWNER_RESIDENCE
  TENANT_RESIDENCE
  LANDLORD_ADDRESS
  AGENT_ADDRESS

  // Operational & utility addresses
  BILLING
  SHIPPING
  MAINTENANCE_SITE
  STORAGE_FACILITY

  OTHER
}

```