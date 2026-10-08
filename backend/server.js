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

// GET: Pestañas con sus Tiers asociados
app.get('/api/tabs', async (req, res) => {
  try {
    const tabs = await prisma.modeTab.findMany({
      include: { tiers: { orderBy: { order: 'asc' } } },
      orderBy: { id: 'asc' }
    });
    res.json(tabs);
  } catch (error) {
    console.error("Error al obtener pestañas:", error);
    res.status(500).json({ error: "Error al obtener pestañas" });
  }
});

// POST: Crear Pestaña
app.post('/api/tabs', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "El nombre de la pestaña es obligatorio" });

  try {
    const newTab = await prisma.modeTab.create({ data: { name } });
    res.status(201).json(newTab);
  } catch (error) {
    res.status(400).json({ error: "La pestaña ya existe o no se pudo crear" });
  }
});

// DELETE: Eliminar Pestaña
app.delete('/api/tabs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.modeTab.delete({ where: { id: Number(id) } });
    res.json({ message: "Pestaña eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ error: "No se pudo eliminar la pestaña" });
  }
});

// GET: Obtener usuarios con sus Múltiples Tiers y Puntos
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tierRanks: {
          include: { tier: true }
        },
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

// GET: Familias/Clanes
app.get('/api/clans', async (req, res) => {
  try {
    const clans = await prisma.clan.findMany({ orderBy: { name: 'asc' } });
    res.json(clans);
  } catch (error) {
    console.error("Error al obtener familias:", error);
    res.status(500).json({ error: "Error al obtener familias" });
  }
});

// POST: Crear Familia
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

// DELETE: Eliminar Familia
app.delete('/api/clans/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await prisma.clan.delete({ where: { name } });
    res.json({ message: "Familia eliminada correctamente" });
  } catch (error) {
    res.status(400).json({ error: "No se pudo eliminar la familia" });
  }
});

// GET: Tiers globales
app.get('/api/tiers', async (req, res) => {
  try {
    const tiers = await prisma.tier.findMany({
      include: { tab: true },
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    });
    res.json(tiers);
  } catch (error) {
    console.error("Error al obtener tiers:", error);
    res.status(500).json({ error: "Error al obtener tiers" });
  }
});

// POST: Crear Tier
app.post('/api/tiers', async (req, res) => {
  const { name, color, tabId } = req.body;
  if (!name) return res.status(400).json({ error: "Nombre de tier obligatorio" });

  try {
    const last = await prisma.tier.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    const nextOrder = last ? last.order + 1 : 0;

    const newTier = await prisma.tier.upsert({
      where: { name },
      update: {
        color: color || '#6366f1',
        ...(tabId && { tabId: Number(tabId) })
      },
      create: {
        name,
        color: color || '#6366f1',
        order: nextOrder,
        tabId: tabId ? Number(tabId) : null
      }
    });
    res.status(201).json(newTier);
  } catch (error) {
    res.status(400).json({ error: "No se pudo crear el Tier" });
  }
});

// PUT: Reordenar Tiers
app.put('/api/tiers/reorder', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: "Se esperaba una lista de ids" });
  }

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.tier.update({
          where: { id: Number(id) },
          data: { order: index }
        })
      )
    );
    res.json({ message: "Orden actualizado" });
  } catch (error) {
    console.error("Error al reordenar tiers:", error);
    res.status(400).json({ error: "No se pudo guardar el orden" });
  }
});

// DELETE: Eliminar Tier
app.delete('/api/tiers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.tier.delete({ where: { id: Number(id) } });
    res.json({ message: "Tier eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar tier:", error);
    res.status(400).json({ error: "No se pudo eliminar el Tier" });
  }
});

// POST: Registrar Usuario
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
      include: { tierRanks: { include: { tier: true } }, tags: true }
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
      include: { tierRanks: { include: { tier: true } }, tags: true }
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

// POST: Asignar o actualizar Tier y Puntos a un Usuario
app.post('/api/users/:userId/tiers', async (req, res) => {
  const { userId } = req.params;
  const { tierId, puntos } = req.body;

  if (!tierId) return res.status(400).json({ error: "tierId es obligatorio" });

  try {
    const rank = await prisma.userTierRank.upsert({
      where: {
        userId_tierId: {
          userId: Number(userId),
          tierId: Number(tierId)
        }
      },
      update: {
        ...(puntos !== undefined && { puntos: Number(puntos) })
      },
      create: {
        userId: Number(userId),
        tierId: Number(tierId),
        puntos: Number(puntos || 0)
      },
      include: { tier: true }
    });

    res.json(rank);
  } catch (error) {
    console.error("Error al asignar tier/puntos:", error);
    res.status(400).json({ error: "No se pudo asignar el tier al usuario" });
  }
});

// DELETE: Quitar un Tier a un Usuario
app.delete('/api/users/:userId/tiers/:tierId', async (req, res) => {
  const { userId, tierId } = req.params;

  try {
    await prisma.userTierRank.delete({
      where: {
        userId_tierId: {
          userId: Number(userId),
          tierId: Number(tierId)
        }
      }
    });
    res.json({ message: "Tier removido del usuario correctamente" });
  } catch (error) {
    console.error("Error al remover tier:", error);
    res.status(400).json({ error: "No se pudo remover el Tier" });
  }
});

// PUT: Actualizar Perfil (nombres, modo, familia)
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
      include: { tierRanks: { include: { tier: true } }, tags: true }
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
