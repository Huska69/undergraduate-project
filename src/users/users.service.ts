import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to retrieve users');
    }
  }
    //this method should not be used directly for user registration.
    //IT SHOULD ONLY BE USED BY THE AUTHSERVICE FRRR
    // users.service.ts
    async create(data: { 
        firstName: string;
        lastName: string;
        nationality: string;
        age?: number; // 👈 Make optional
        sex: string;
        pregnancy?: boolean;
        height?: number; // 👈 Make optional
        weight?: number; // 👈 Make optional
        contact?: number; // 👈 Make optional
        blood?: string; // 👈 Make optional
        allergies?: string; // 👈 Make optional
        medCond?: string; // 👈 Make optional
        meds?: string; // 👈 Make optional
        email: string;
        password: string;
    }) {
        return this.prisma.user.create({ data });
    }

    async findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    } 
    
    async findByEmail(email: string){
        return this.prisma.user.findUnique({where: { email }});
    }

    async update(id: string, data: {
        firstName: string;
        lastName: string;
        nationality: string;
        age?: number; // 👈  optional
        sex: string;
        pregnancy?: boolean;
        height?: number; // 👈  optional
        weight?: number; // 👈  optional
        contact?: number; // 👈  optional
        blood?: string; // 👈  optional
        allergies?: string; // 👈  optional
        medCond?: string; // 👈  optional
        meds?: string; // 👈  optional
        email?: string;
        password?: string;
    }) {
        if(data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.update({ where: { id }, data });
    }

    async remove(id: string) {
        let objectId: ObjectId;

        try {
            objectId = new ObjectId(id);
        } catch (error) {
            throw new BadRequestException('Invalid user ID');
        }

        // Fetch user to ensure it exists and to have user data
        const user = await this.prisma.user.findUnique({ where: { id: objectId.toHexString() } });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Delete associated chats first
        await this.prisma.chat.deleteMany({
            where: {
                userId: objectId.toHexString(),
            },
        });

        // Now delete the user
        return this.prisma.user.delete({ where: { id: objectId.toHexString() } });
    }
}
