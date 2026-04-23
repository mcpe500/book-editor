import { Router } from 'express';
import { providerManager } from '../services/ai/providerManager.js';

const router = Router();

router.get('/', (_req, res) => {
  const providers = providerManager.getProviders();
  res.json(providers);
});

router.post('/', async (req, res, next) => {
  try {
    const { id, provider, name, apiKey, baseUrl, model, enabled } = req.body;

    if (!provider || !name) {
      res.status(400).json({ error: 'provider and name are required' });
      return;
    }

    const config = await providerManager.saveProvider({
      id: id || provider,
      provider,
      name,
      apiKey,
      baseUrl,
      model,
      enabled: enabled ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json(config);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res) => {
  const providers = providerManager.getProviders();
  const provider = providers.find(p => p.id === req.params.id);

  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }

  res.json(provider);
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, apiKey, baseUrl, model, enabled } = req.body;

    const providers = providerManager.getProviders();
    const existing = providers.find(p => p.id === req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }

    const config = await providerManager.saveProvider({
      ...existing,
      name: name ?? existing.name,
      apiKey: apiKey ?? existing.apiKey,
      baseUrl: baseUrl ?? existing.baseUrl,
      model: model ?? existing.model,
      enabled: enabled ?? existing.enabled,
    });

    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const success = await providerManager.deleteProvider(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Provider not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/test', async (req, res, next) => {
  try {
    const provider = providerManager.getProvider(req.params.id);

    if (!provider) {
      res.status(404).json({ error: 'Provider not found or not enabled' });
      return;
    }

    try {
      const response = await provider.chat([
        { role: 'user', content: 'Say "test successful" if you can hear me.' }
      ], { temperature: 0, maxTokens: 50 });

      res.json({
        success: true,
        message: 'Connection successful',
        response: response.content,
      });
    } catch (error) {
      res.json({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
