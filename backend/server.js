const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba / Health Check
app.get('/api/health', (req, res) => {
  res.json({ message: "Servidor Backend de UserHub funcionando correctamente" });
});

// GET: Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener la lista de usuarios" });
  }
});

// POST: Registrar un nuevo usuario
app.post('/api/users', async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ error: "El nickname y la contraseña son obligatorios" });
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        nickname,
        password,
        nombres: nickname,
        modo: 'NORMAL',
        familia: 'Sin Clan / Ninguno',
        tier: 'Sin Tier'
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(400).json({ error: "El nickname ya se encuentra registrado" });
  }
});

// POST: Iniciar sesión (Login)
app.post('/api/users/login', async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ error: "Proporcione nickname y contraseña" });
  }

  try {
    // Credencial oficial de Administrador
    if (nickname.toLowerCase() === 'admin' && password === 'rushero123') {
      return res.json({
        message: "Login de administrador exitoso",
        user: { id: 0, nickname: 'Admin', role: 'admin', nombres: 'Administrador Principal' }
      });
    }

    const user = await prisma.user.findFirst({
      where: { nickname, password }
    });

    if (user) {
      res.json({ message: "Inicio de sesión exitoso", user });
    } else {
      res.status(401).json({ error: "Nickname o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno del servidor en el login" });
  }
});

// PUT: Actualizar usuario por ID
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, modo, familia, tier, tags } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { 
        ...(nombres !== undefined && { nombres }),
        ...(modo !== undefined && { modo: typeof modo === 'object' ? JSON.stringify(modo) : modo }),
        ...(familia !== undefined && { familia }),
        ...(tier !== undefined && { tier }),
        ...(tags !== undefined && { tags: typeof tags === 'object' ? JSON.stringify(tags) : tags })
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario por ID:", error);
    res.status(400).json({ error: "No se pudo actualizar la información del usuario" });
  }
});

// PUT: Actualizar usuario por Nickname (Útil para el Admin)
app.put('/api/users/nickname/:nickname', async (req, res) => {
  const { nickname } = req.params;
  const { nombres, modo, familia, tier, tags } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { nickname } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        ...(nombres !== undefined && { nombres }),
        ...(modo !== undefined && { modo: typeof modo === 'object' ? JSON.stringify(modo) : modo }),
        ...(familia !== undefined && { familia }),
        ...(tier !== undefined && { tier }),
        ...(tags !== undefined && { tags: typeof tags === 'object' ? JSON.stringify(tags) : tags })
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario por nickname:", error);
    res.status(400).json({ error: "No se pudo actualizar la información del usuario" });
  }
});

// Inicializar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
