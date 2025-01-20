import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { id, scanTime } = await request.json();

        if (!id || !scanTime) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // First check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.scanned) {
            return NextResponse.json(
                { 
                    status: 'already_scanned',
                    message: 'User already scanned',
                    user: {
                        name: user.name,
                        scanTime: user.scanTime,
                        scannedTimes: (user.scannedTimes ?? 0) + 1
                    }
                },
                { status: 409 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                scanned: true,
                scanTime: scanTime,
                scannedTimes: (user.scannedTimes ?? 0) + 1
            },
        });

        return NextResponse.json({
            status: 'success',
            message: 'Successfully scanned',
            user: {
                name: updatedUser.name,
                scanTime: updatedUser.scanTime,
                scannedTimes: (user.scannedTimes ?? 0) + 1
            }
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        return NextResponse.json(
            { error: 'Failed to update user status' },
            { status: 500 }
        );
    }
}