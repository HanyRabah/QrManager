import { PrismaClient, User } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const users = await request.json();
    console.log("🚀 ~ POST ~ users:", users)
    
    const createdUsers = await prisma.$transaction(
      users.map((user: User) =>
        prisma.user.create({
          data: {
            name: user.name ,
            title: user.title,
            district: user.district,
            region: user.region,
          },
        })
      )
    );

    return NextResponse.json(createdUsers);
  } catch (error) {
    console.error('Error creating users:', error);
    return NextResponse.json(
      { error: 'Failed to create users' },
      { status: 500 }
    );
  }
}