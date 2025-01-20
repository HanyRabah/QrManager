import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
      const { id, status, metadata } = await request.json();
      
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          scanned: status === 'scanned',
          scanTime: new Date(),
          location: metadata?.location,
        },
      });
  
      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }
  }