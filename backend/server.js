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
  res.json({ message: "Backend OK" });
});

// GET: Obtener usuarios con Tier y Tags
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { tier: true, tags: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener la lista de usuarios" });
  }
});

// GET: Obtener Familias/Clanes globales
app.get('/api/clans', async (req, res) => {
  try {
    const clans = await prisma.clan.findMany({ orderBy: { name: 'asc' } });
    res.json(clans);
  } catch (error) {
    console.error("Error al obtener familias:", error);
    res.status(500).json({ error: "Error al obtener familias" });
  }
});

// POST: Crear Familia/Clan global
app.post('/api/clans', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "El nombre de la familia es obligatorio" });

  try {
    const newClan = await prisma.clan.create({ data: { name } });
    res.status(201).json(newClan);
  } catch (error) {
    res.status(400).json({ error: "La familia ya existe o no se pudo crear" });
  }
});

// DELETE: Eliminar Familia/Clan global
app.delete('/api/clans/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await prisma.clan.delete({ where: { name } });
    res.json({ message: "Familia eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ error: "No se pudo eliminar la familia" });
  }
});

// GET: Obtener Tiers globales
app.get('/api/tiers', async (req, res) => {
  try {
    const tiers = await prisma.tier.findMany({ orderBy: { id: 'asc' } });
    res.json(tiers);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tiers" });
  }
});

// POST: Crear Tier global
app.post('/api/tiers', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: "Nombre de tier obligatorio" });

  try {
    const newTier = await prisma.tier.upsert({
      where: { name },
      update: { color: color || '#6366f1' },
      create: { name, color: color || '#6366f1' }
    });
    res.status(201).json(newTier);
  } catch (error) {
    res.status(400).json({ error: "No se pudo crear el Tier" });
  }
});

// POST: Registrar usuario
app.post('/api/users', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.status(400).json({ error: "Nickname y contraseña obligatorios" });
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        nickname,
        password,
        nombres: nickname,
        modo: 'NORMAL',
        familia: 'Sin Familia / Ninguno'
      },
      include: { tier: true, tags: true }
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: "El nickname ya se encuentra registrado" });
  }
});

// POST: Login
app.post('/api/users/login', async (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: "Faltan credenciales" });

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
    res.status(500).json({ error: "Error en login" });
  }
});

// PUT: Asignar Tier por Nickname
app.put('/api/users/nickname/:nickname', async (req, res) => {
  const { nickname } = req.params;
  const { tierName, nombres, modo, familia } = req.body;

  try {
    const user = await prisma.user.findFirst({ where: { nickname } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    let tierId = null;
    if (tierName && tierName !== 'Sin Tier') {
      const tierObj = await prisma.tier.upsert({
        where: { name: tierName },
        update: {},
        create: { name: tierName, color: '#6366f1' }
      });
      tierId = tierObj.id;
    }

    const formattedModo = modo !== undefined ? (typeof modo === 'object' ? JSON.stringify(modo) : modo) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        tierId: tierId,
        ...(nombres !== undefined && { nombres }),
        ...(formattedModo !== undefined && { modo: formattedModo }),
        ...(familia !== undefined && { familia })
      },
      include: { tier: true, tags: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar por nickname:", error);
    res.status(400).json({ error: "No se pudo actualizar el usuario" });
  }
});

// PUT: Actualizar perfil por ID
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, modo, familia } = req.body;

  try {
    const formattedModo = modo !== undefined ? (typeof modo === 'object' ? JSON.stringify(modo) : modo) : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(nombres !== undefined && { nombres }),
        ...(formattedModo !== undefined && { modo: formattedModo }),
        ...(familia !== undefined && { familia })
      },
      include: { tier: true, tags: true }
    });
    res.json(updatedUser);
  } catch (error) {
    console.error("Error al actualizar perfil por ID:", error);
    res.status(400).json({ error: "No se pudo actualizar el perfil" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
