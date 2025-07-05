import express, { json } from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './auth.js';
import upload from './multerConfig.js';
import { UPLOAD_FOLDER } from './constants/common.js';
import { swaggerUi, swaggerSpec } from './swagger.js';

const AUTH_REGISTER_PATH = '/auth/register';
const AUTH_LOGIN_PATH = '/auth/login';
const ME_PATH = '/me';
const PLAYLIST_PATH = '/playlists';
const SONGS_PATH = '/songs';
const UPLOADS_PATH = '/uploads';


dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(UPLOADS_PATH, express.static(UPLOAD_FOLDER));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post(AUTH_REGISTER_PATH, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'El email ya esta registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });
        res.status(201).json({ message: 'Usuario registrado correctamente', userId: user.id });
    } catch (er) {
        console.log(er);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.post(AUTH_LOGIN_PATH, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales invalidas (email)' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Credenciales Invalidas (Contraseña)' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.status(200).json({ token });

    } catch (er) {
        console.log('Error en login: ', er);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get(ME_PATH, authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                playlists: true,
                sharedPlaylists: true
            }
        });

        if (!user) {
            res.status(401).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(user);

    } catch (er) {
        console.log('error al obtener el perfil', er);
        res.status(500), json({ message: 'Error en el servidor' });
    }
});

app.post(PLAYLIST_PATH, authenticateToken, async (req, res) => {

    const { name, description } = req.body;
    const isSecret = req.body.isSecret === true;


    if (!name || !description) {
        return res.status(400).json({ message: 'Nombre y descripcion requeridos' });
    }

    try {

        const secretCount = await prisma.playlist.count({
            where: {
                creatorId: req.user.id,
                isSecret: true
            }
        });

        if (isSecret && secretCount >= 10) {
            return res.status(403).json({ message: 'Límite de 10 playlists secretas alcanzado' });
        }

        const playlist = await prisma.playlist.create({
            data: {
                name,
                description,
                isSecret,
                creatorId: req.user.id
            }
        });

        res.status(200).json(playlist);
    } catch (er) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get(PLAYLIST_PATH, authenticateToken, async (req, res) => {
    try {
        const playlists = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                playlists: true
            }
        });
        res.status(200).json(playlists);
    } catch (er) {
        console.log('Error al obtener las playlist', er);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get(`${PLAYLIST_PATH}/shared-with-me`, authenticateToken, async (req, res) => {
    try{
        const playlistSharedWithMe = await prisma.sharedPlaylist.findMany({
            where: {userId: req.user.id},
            include: {playlist: true}
        });

        console.log('Playlists compartidas conmigo:', playlistSharedWithMe);


        if(playlistSharedWithMe.length === 0){
            return res.status(404).json({ message: 'No hay playlist compartidas contigo'});
        }

        res.status(200).json(playlistSharedWithMe);
    }catch(er){
        console.error('Error al obtener playlist compartidas conmigo', er);
        res.status(500).json({message: 'Error en el servidor'});
    }
});

app.get(`${PLAYLIST_PATH}/:id`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId },
            include: {
                playlistSongs: {
                    include: {
                        song: true
                    }
                },
                creator: {
                    select: { id: true, email: true }
                },
                sharedWith: {
                    select: {
                        user: {
                            select: { id: true, email: true }
                        }
                    }
                }
            }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist no encontrada' });
        }

        const isOwner = playlist.creator.id === req.user.id;
        const isSharedWithUser = Array.isArray(playlist.sharedWith) &&
            playlist.sharedWith.some(entry => entry.user.id === req.user.id);

        const hasAccess = isOwner || isSharedWithUser;

        if (!hasAccess) {
            return res.status(403).json({ message: 'No tienes acceso a esta playlist' });
        }

        playlist.coverImageUrl = `http://localhost:3000${UPLOADS_PATH}/${playlist.coverImageUrl}`;
        res.status(200).json(playlist);
    } catch (er) {
        console.log('Error al obtener la playlist por ID', er);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}
);

app.patch(`${PLAYLIST_PATH}/:id`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);
    const { name, description, isSecret } = req.body;

    try {
        const playlist = await prisma.playlist.findFirst({
            where: { id: playlistId },
            include: { creator: true }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist no encontrada' });
        }

        if (playlist.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para editar esta playlist' });
        }

        const updated = await prisma.playlist.update({
            where: { id: playlistId },
            data: {
                name: name,//?? playlist.name,
                description: description, //?? playlist.description,
                isSecret: typeof isSecret === 'boolean' ? isSecret : playlist.isSecret
            }
        });

        res.status(200).json(updated);

    } catch (er) {
        console.log('Error al editar la playlist');
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.delete(`${PLAYLIST_PATH}/:id`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId },
            include: { creator: true }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist no encontrada' });
        }

        if (playlist.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'no tienes permiso para eliminar esta playlist' });
        }

        await prisma.playlist.delete({
            where: { id: playlistId }
        });

        res.status(200).json({ message: 'Playlist eliminada correctamente' });
    } catch (er) {
        console.log('Error al eliminar la playlist:', er);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.patch(`${PLAYLIST_PATH}/:id/cover`, authenticateToken, upload.single('cover'), async (req, res) => {
  const playlistId = parseInt(req.params.id);

  try {
        const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId }
    });

    if (!playlist) {
        return res.status(404).json({ message: 'Playlist no encontrada' });
    }

    if (playlist.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'No tienes permiso para editar esta playlist' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Archivo no proporcionado' });
    }

    const coverPath = req.file.filename;

    const updatedPlaylist = await prisma.playlist.update({
        where: { id: playlistId },
        data: {
            coverImageUrl: coverPath
        }
    });

    res.status(200).json({ message: 'Imagen actualizada correctamente', playlist: updatedPlaylist });

  } catch (er) {
        console.error('Error al subir portada', er);
        res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post(`${PLAYLIST_PATH}/:id/songs`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);
    const { name, artist, url } = req.body;

    if (!name || !artist) {
        return res.status(400).json({ message: 'Nombre y artista requeridos' });
    }

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist no encontrada' });
        }

        let song = await prisma.song.findFirst({
            where: {
                name,
                artist
            }
        });

        if (!song) {
            song = await prisma.song.create({
                data: {
                    name,
                    artist,
                    url: url || ''
                }
            });
        }

        const alreadyAdded = await prisma.playlistSong.findFirst({
            where: {
                playlistId,
                songId: song.id
            }
        });

        if (alreadyAdded) {
            return res.status(400).json({ message: 'La cancion ya esta en la playlist' });
        }

        await prisma.playlistSong.create({
            data: {
                playlistId,
                songId: song.id
            }
        });

        res.status(201).json({ message: 'Cancion agregada a la playlist', song });
    } catch (er) {
        console.log('Error al agregar la cancion', er);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.get(`${PLAYLIST_PATH}/:id/songs`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: playlistId },
            include: {
                playlistSongs: {
                    include: {
                        song: true
                    }
                }
            }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'playlist no encontrada' });
        }

        const isOwner = playlist.creatorId === req.user.id;

        const isSharedWithUser = await prisma.sharedPlaylist.findFirst({
            where: {
                playlistId,
                userId: req.user.id
            }
        });

        if (!isOwner && !isSharedWithUser) {
            return res.status(403).json({ message: 'No tienes acceso a esta playList' });
        }

        const songs = playlist.playlistSongs.map(ps => ps.song);

        res.status(200).json(songs);

    } catch (er) {
        console.log('Error al obtener canciones de la playlist');
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.post(`${PLAYLIST_PATH}/:id/share`, authenticateToken, async (req, res) => {
    const { body, params } = req;
    const { id: playlistId } = params;
    const { userId } = body;
    const parsedPlaylistId = parseInt(playlistId);

    if (!userId) {
        return res.status(400).json({ message: 'El campo userId es obligatorio' });
    }

    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: parsedPlaylistId },
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist no encontrada' });
        }

        if (playlist.creatorId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permisos para compartir esta playlist' });
        }

        const userToShare = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userToShare) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const alreadyShared = await prisma.sharedPlaylist.findFirst({
            where: {
                playlistId: parsedPlaylistId,
                userId: userId,
            },
        });

        if (alreadyShared) {
            return res.status(400).json({ message: 'La playlist ya fue compartida con este usuario' });
        }

        const shared = await prisma.sharedPlaylist.create({
            data: {
                playlistId: parsedPlaylistId,
                userId,
            },
        });

        res.status(200).json({ message: 'Playlist compartida correctamente', shared });
    } catch (er) {
        console.error('Error al compartir playlist:', er);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

app.get(`${PLAYLIST_PATH}/:id/shared-users`, authenticateToken, async (req, res) => {
    const playlistId = parseInt(req.params.id);

     try {
    //     const playlist = await prisma.playlist.findUnique({
    //         where: { id: playlistId },
    //         include: {
    //             creator: true,
    //             sharedWith: {
    //                 include: {
    //                     user: {
    //                         select: {
    //                             id: true,
    //                             email: true
    //                         }
    //                     }
    //                 }
    //             }

    //         }
    //     });

        const playlistUsers = await prisma.sharedPlaylist.findMany({
            where: {
                playlistId, playlist: {creatorId: req.user.id}
            },
            include: {user: true}
        });

        console.log(playlistUsers);

        if (playlistUsers.length === 0) {
            return res.status(404).json({ message: 'No hay usuarios compartidos'});
        }

        //const isOwner = playlistUsers[0].playlist.creatorId === req.user.id;

         //if (!isOwner) {
         //    return res.status(403).json({ message: 'No tienes acceso a esta playlist' });
         //}

        //const sharedUsers = playlist.sharedWith.map(entry => entry.user);
        const sharedUsers = playlistUsers.map(playlistUser => playlistUser.user.email);

        res.status(200).json(sharedUsers);
    } catch (er) {
        console.error('Error al obtener los usuarios compartidos:', er);
        res.status(500).json({ message: 'Error en el servidor'});
    }
});

app.get(`${SONGS_PATH}/search`, authenticateToken, async (req, res) => {
    const {name, artist} = req.query;

    try{
        const songs = await prisma.song.findMany({
            where: {
                AND: [
                    name ? {name: {contains: name, mode: 'insensitive'}} : {},
                    artist ? {artist: {contains: artist, mode: 'insensitive'}} : {}
                ]
            }
        });

        res.status(200).json(songs);

    }catch(er){
        console.error('Error al buscar canciones', er);
        res.status(500).json({message: 'Error en el sercidor'})
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});