const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ message: "Servidor Backend de UserHub funcionando correctamente" });
});

// GET: Obtener todos los usuarios con su Tier y Tags
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tier: true,
        tags: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener la lista de usuarios" });
  }
});

// POST: Registrar usuario
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
        familia: 'Sin Clan / Ninguno'
      },
      include: {
        tier: true,
        tags: true
      }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(400).json({ error: "El nickname ya se encuentra registrado" });
  }
});

// POST: Login
app.post('/api/users/login', async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ error: "Proporcione nickname y contraseña" });
  }

  try {
    if (nickname.toLowerCase() === 'admin' && password === 'rushero123') {
      return res.json({
        message: "Login de administrador exitoso",
        user: { id: 0, nickname: 'Admin', nombres: 'Administrador Principal' }
      });
    }

    const user = await prisma.user.findFirst({
      where: { nickname, password },
      include: {
        tier: true,
        tags: true
      }
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
  const { nombres, modo, familia, tierId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(nombres !== undefined && { nombres }),
        ...(modo !== undefined && { modo: typeof modo === 'object' ? JSON.stringify(modo) : modo }),
        ...(familia !== undefined && { familia }),
        ...(tierId !== undefined && { tierId: tierId ? Number(tierId) : null })
      },
      include: {
        tier: true,
        tags: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(400).json({ error: "No se pudo actualizar el usuario" });
  }
});

// PUT: Actualizar usuario por Nickname (Sincronización Admin)
app.put('/api/users/nickname/:nickname', async (req, res) => {
  const { nickname } = req.params;
  const { nombres, modo, familia, tierId } = req.body;

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
        ...(tierId !== undefined && { tierId: tierId ? Number(tierId) : null })
      },
      include: {
        tier: true,
        tags: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar usuario por nickname:", error);
    res.status(400).json({ error: "No se pudo actualizar el usuario" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
