import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReserveSchema = z.object({
  productId:   z.string(),
  warehouseId: z.string(),
  quantity:    z.number().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ReserveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { productId, warehouseId, quantity } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stockLevel.findUnique({
        where: {
          productId_warehouseId: { productId, warehouseId }
        }
      });

      if (!stock) throw new Error("STOCK_NOT_FOUND");

      const available = stock.total - stock.reserved;
      if (available < quantity) throw new Error("INSUFFICIENT_STOCK");

      await tx.stockLevel.update({
        where: {
          productId_warehouseId: { productId, warehouseId }
        },
        data: { reserved: { increment: quantity } }
      });

      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        include: {
          product: true,
          warehouse: true,
        }
      });

      return reservation;
    });

    return NextResponse.json(result, { status: 201 });

  } catch (err: any) {
    if (err.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}