import "dotenv/config";
import { Pool } from 'pg'; 
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Pool ইনিশিয়ালাইজ করুন
const pool = new Pool({ connectionString });

// ✅ পরিবর্তন: { pool } এর বদলে সরাসরি pool পাস করুন
const adapter = new PrismaPg(pool); 

const prisma = new PrismaClient({ adapter });

export { prisma };
