import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
      const users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });
  
      return NextResponse.json(users);
    } catch (error) {
      console.error('Error exporting users:', error);
      return NextResponse.json(
        { error: 'Failed to export users' },
        { status: 500 }
      );
    }
  }