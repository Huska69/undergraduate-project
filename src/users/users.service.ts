import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcryptjs';

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
    async create(data: { 
        name: string; 
        age: number; 
        sex: string; 
        pregnancy?: boolean; 
        height: number; 
        weight: number; 
        contact: number; 
        blood: string; 
        allergies: string; 
        medCond: string; 
        meds: string; 
        email: string; 
        password: string; 
    }) {
        //hashing should happen in AuthService
        return this.prisma.user.create({ data });
    }

    async findOne(id: string) {
        return this.prisma.user.findUnique({ where: { id } });
    } 
    
    async findByEmail(email: string){
        return this.prisma.user.findUnique({where: { email }});
    }

    async update(id: string, data: { 
        name?: string; 
        age?: number; 
        sex?: string; 
        pregnancy?: boolean; 
        height?: number; 
        weight?: number; 
        contact?: number; 
        blood?: string; 
        allergies?: string; 
        medCond?: string; 
        meds?: string; 
        email?: string; 
        password?: string; 
    }) {
        if(data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.update({where: {id}, data});
    }

    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}