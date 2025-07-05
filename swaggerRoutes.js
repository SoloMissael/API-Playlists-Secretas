/**
 * Archivo: swaggerRoutes.js
 * Describe todas las rutas documentadas de tu API para integrarse con swagger.js
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Email ya registrado o datos inválidos
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *       400:
 *         description: Credenciales inválidas
 */

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [Usuario]
 *     summary: Obtener perfil del usuario logueado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Usuario no autenticado
 */

/**
 * @swagger
 * /playlists:
 *   post:
 *     tags: [Playlists]
 *     summary: Crear una nueva playlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isSecret:
 *                 type: boolean
 *             required:
 *               - name
 *               - description
 *     responses:
 *       200:
 *         description: Playlist creada
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Límite de playlists secretas alcanzado
 *   get:
 *     tags: [Playlists]
 *     summary: Obtener playlists propias
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de playlists del usuario
 */

/**
 * @swagger
 * /playlists/shared-with-me:
 *   get:
 *     tags: [Playlists]
 *     summary: Obtener playlists compartidas conmigo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Playlists compartidas con el usuario
 *       404:
 *         description: No hay playlists compartidas
 */

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     tags: [Playlists]
 *     summary: Obtener una playlist por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Playlist encontrada
 *       403:
 *         description: No tienes acceso
 *       404:
 *         description: Playlist no encontrada
 *   patch:
 *     tags: [Playlists]
 *     summary: Editar una playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isSecret:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Playlist actualizada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: No encontrada
 *   delete:
 *     tags: [Playlists]
 *     summary: Eliminar una playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminada correctamente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: No encontrada
 */

/**
 * @swagger
 * /playlists/{id}/cover:
 *   patch:
 *     tags: [Playlists]
 *     summary: Actualizar portada de playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Portada actualizada
 *       400:
 *         description: Archivo no proporcionado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Playlist no encontrada
 */

/**
 * @swagger
 * /playlists/{id}/songs:
 *   get:
 *     tags: [Playlists]
 *     summary: Obtener canciones de una playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Canciones de la playlist
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Playlist no encontrada
 *   post:
 *     tags: [Playlists]
 *     summary: Agregar canción a una playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               artist:
 *                 type: string
 *               url:
 *                 type: string
 *             required:
 *               - name
 *               - artist
 *     responses:
 *       201:
 *         description: Canción agregada
 *       400:
 *         description: Datos inválidos o ya existe
 *       404:
 *         description: Playlist no encontrada
 */

/**
 * @swagger
 * /playlists/{id}/share:
 *   post:
 *     tags: [Playlists]
 *     summary: Compartir playlist con usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Playlist compartida correctamente
 *       400:
 *         description: Ya compartida o datos inválidos
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Playlist o usuario no encontrado
 */

/**
 * @swagger
 * /playlists/{id}/shared-users:
 *   get:
 *     tags: [Playlists]
 *     summary: Obtener usuarios con los que se compartió una playlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Emails de usuarios con acceso
 *       404:
 *         description: No hay usuarios compartidos
 */

/**
 * @swagger
 * /songs/search:
 *   get:
 *     tags: [Canciones]
 *     summary: Buscar canciones por nombre o artista
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: name
 *         in: query
 *         schema:
 *           type: string
 *       - name: artist
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de canciones
 *       400:
 *         description: Faltan parámetros de búsqueda
 */