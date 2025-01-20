import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    console.log("🚀 ~ POST ~ request:", request)
    try {
        const payload = await request.json();
        console.log("🚀 ~ POST ~ payload:", payload)
        
        if (!payload || typeof payload !== 'object') {
            return NextResponse.json(
                { error: 'Invalid payload format' },
                { status: 400 }
            );
        }

        const { id, scanTime } = payload;
        console.log('Destructured values:', { id, scanTime }); // Debug log

        if (!id || !scanTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                scanned: true,
                scanTime: scanTime || new Date(),
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