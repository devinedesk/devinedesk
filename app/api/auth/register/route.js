import { NextResponse } from 'next/server';
import { UserService } from '@/src/lib/services/userService';
import bcrypt from 'bcryptjs';
import { withApiAuth } from '@/src/lib/apiHandler';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional()
});

export const POST = withApiAuth({
    requireAuth: false,
    schema: registerSchema,
    handler: async (request, { body }) => {
        const { email, password, name } = body;

        // Check if user already exists
        const existingUser = await UserService.getUserByEmail(email);

        if (existingUser) {
            return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await UserService.createUser({
            email,
            name: name || email.split('@')[0],
            password: hashedPassword
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        
        return NextResponse.json(userWithoutPassword, { status: 201 });
    }
});
