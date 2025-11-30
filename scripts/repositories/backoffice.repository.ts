import { db } from '../../src/config/prisma';
import type { Prisma } from '@prisma/client';

export class BackofficeRepository {
    async upsertProfile(
        userId: number,
        createData: Prisma.BackofficeCustomerProfileCreateInput,
        updateData: Prisma.BackofficeCustomerProfileUpdateInput
    ) {
        return db.backofficeCustomerProfile.upsert({
            where: { userId },
            create: createData,
            update: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
    }

    async upsertAuthState(
        userId: number,
        createData: Prisma.BackofficeAuthStateCreateInput,
        updateData: Prisma.BackofficeAuthStateUpdateInput
    ) {
        return db.backofficeAuthState.upsert({
            where: { userId },
            create: createData,
            update: {
                ...updateData,
                updatedAt: new Date(),
            },
        });
    }

    async findProfileByUserId(userId: number) {
        return db.backofficeCustomerProfile.findUnique({
            where: { userId },
        });
    }

    async findUserById(userId: number) {
        return db.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                password: true,
                phone: true,
                completeName: true,
                gender: true,
                birthDate: true,
                birthCountry: true,
                curp: true,
                postalCode: true,
                state: true,
                country: true,
                municipality: true,
                street: true,
                colony: true,
                externalNumber: true,
                internalNumber: true,
                rfc: true,
            },
        });
    }

    async findAllUsers() {
        return db.users.findMany({
            select: {
                id: true,
                email: true,
                password: true,
                phone: true,
                completeName: true,
                gender: true,
                birthDate: true,
                birthCountry: true,
                curp: true,
                postalCode: true,
                state: true,
                country: true,
                municipality: true,
                street: true,
                colony: true,
                externalNumber: true,
                internalNumber: true,
                rfc: true,
            },
        });
    }
}
