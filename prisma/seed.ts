import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const w1 = await prisma.warehouse.create({
    data: { name: "Mumbai Warehouse", location: "Mumbai" }
  });
  const w2 = await prisma.warehouse.create({
    data: { name: "Bengaluru Warehouse", location: "Bengaluru" }
  });

  const products = [
    { name: "iPhone 15", description: "Latest Apple iPhone", price: 79999 },
    { name: "MacBook Air", description: "M2 Chip Laptop", price: 114900 },
    { name: "Sony Headphones", description: "Noise cancelling", price: 29990 },
  ];

  for (const p of products) {
    const product = await prisma.product.create({ data: p });
    await prisma.stockLevel.createMany({
      data: [
        { productId: product.id, warehouseId: w1.id, total: 10, reserved: 0 },
        { productId: product.id, warehouseId: w2.id, total: 5, reserved: 0 },
      ]
    });
  }
  console.log("✅ Database seeded!");
}

main().finally(() => prisma.$disconnect());