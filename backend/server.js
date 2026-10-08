const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: "Backend funcionando correctamente" });
});

// GET: Obtener todos los usuarios con su Tier asignado
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
    res.status(500).json({ error: "Error al obtener usuarios" });
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
      include: { tier: true, tags: true }
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al registrar:", error);
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
        message: "Login admin exitoso",
        user: { id: 0, nickname: 'Admin', nombres: 'Administrador Principal' }
      });
    }

    const user = await prisma.user.findFirst({
      where: { nickname, password },
      include: { tier: true, tags: true }
    });

    if (user) {
      res.json({ message: "Login exitoso", user });
    } else {
      res.status(401).json({ error: "Nickname o contraseña incorrectos" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno en login" });
  }
});

// PUT: Asignar Tier por Nickname
app.put('/api/users/nickname/:nickname', async (req, res) => {
  const { nickname } = req.params;
  const { tierName, nombres, modo, familia } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { nickname } });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    let tierId = null;
    if (tierName && tierName !== 'Sin Tier') {
      const tierObj = await prisma.tier.upsert({
        where: { name: tierName },
        update: {},
        create: { name: tierName, color: '#3b82f6' }
      });
      tierId = tierObj.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        tierId: tierId,
        ...(nombres !== undefined && { nombres }),
        ...(modo !== undefined && { modo: typeof modo === 'object' ? JSON.stringify(modo) : modo }),
        ...(familia !== undefined && { familia })
      },
      include: { tier: true, tags: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar por nickname:", error);
    res.status(400).json({ error: "No se pudo actualizar la información" });
  }
});

// PUT: Actualizar datos de perfil por ID
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, modo, familia } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(nombres !== undefined && { nombres }),
        ...(modo !== undefined && { modo: typeof modo === 'object' ? JSON.stringify(modo) : modo }),
        ...(familia !== undefined && { familia })
      },
      include: { tier: true, tags: true }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(400).json({ error: "No se pudo actualizar el perfil" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
