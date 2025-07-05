import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient;

export async function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message: 'Token no proporcionado'});
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({where: {id: decoded.id}});

        if(!user){
            return res.status(401).json({message: 'Usuario no valido o eliminado'});
        }

        req.user = user;
        next();
    }catch(er){
        return res.status(401).json({message: 'Token no valido o expirado'});
    }
}