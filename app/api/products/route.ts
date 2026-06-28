import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stockLevels: {
        include: { warehouse: true }
      }
    }
  });

  const result = products.map(p => ({
    ...p,
    stockLevels: p.stockLevels.map(s => ({
      ...s,
      available: s.total - s.reserved
    }))
  }));

  return NextResponse.json(result);
}