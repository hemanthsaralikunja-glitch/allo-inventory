import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (new Date() > reservation.expiresAt) {
      await prisma.$transaction([
        prisma.stockLevel.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId
            }
          },
          data: { reserved: { decrement: reservation.quantity } }
        }),
        prisma.reservation.update({
          where: { id },
          data: { status: "RELEASED" }
        })
      ]);
      return NextResponse.json(
        { error: "Reservation has expired" },
        { status: 410 }
      );
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: `Reservation is already ${reservation.status}` },
        { status: 400 }
      );
    }

    const confirmed = await prisma.$transaction(async (tx) => {
      await tx.stockLevel.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId
          }
        },
        data: {
          total:    { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity }
        }
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true }
      });
    });

    return NextResponse.json(confirmed);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}