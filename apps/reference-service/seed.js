const configify = require('@itgorillaz/configify');
const { PrismaClient } = require('./dist/generated/prisma');
const prisma = new PrismaClient();
async function seed() {
  try {
    console.log('🌍 Seeding Kenya Address Hierarchy...');
    const COUNTRY_CODE = 'KE'; // Kenya

    // Create counties first
    const counties = require('./assets/kenyan-counties-subcounties-wards.json');
    for (const county of counties) {
      // Level 1: County
      const countyRecord = await prisma.addressHierarchy.upsert({
        where: { code_country: { code: county.code, country: COUNTRY_CODE } },
        update: { name: county.name, active: true },
        create: {
          country: COUNTRY_CODE,
          level: 1,
          code: county.code,
          name: county.name,
        },
      });

      // Level 2: Sub-Counties
      if (county.subCounties && county.subCounties.length > 0) {
        for (const sub of county.subCounties) {
          const subRecord = await prisma.addressHierarchy.upsert({
            where: { code_country: { code: sub.code, country: COUNTRY_CODE } },
            update: { name: sub.name, parentId: countyRecord.id },
            create: {
              country: COUNTRY_CODE,
              level: 2,
              parentId: countyRecord.id,
              code: sub.code,
              name: sub.name,
            },
          });

          // Level 3: Wards
          if (sub.wards && sub.wards.length > 0) {
            for (const ward of sub.wards) {
              await prisma.addressHierarchy.upsert({
                where: {
                  code_country: { code: ward.code, country: COUNTRY_CODE },
                },
                update: { name: ward.name, parentId: subRecord.id },
                create: {
                  country: COUNTRY_CODE,
                  level: 3,
                  parentId: subRecord.id,
                  code: ward.code,
                  name: ward.name,
                },
              });
            }
          }
        }
      }

      console.log(`✅ Seeded County: ${county.name}`);
    }

    console.log('🎉 Kenya Address Hierarchy Seed Completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
