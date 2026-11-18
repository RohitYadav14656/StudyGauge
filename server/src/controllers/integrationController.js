import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  connectAllDemo,
  syncAllIntegrations,
} from '../services/integrationService.js';

export const listIntegrations = async (req, res, next) => {
  try {
    const integrations = await getIntegrations(req.user._id);
    res.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    next(error);
  }
};

export const handleConnectIntegration = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await connectIntegration(req.user._id, provider, req.body);
    res.status(200).json({
      success: true,
      data: result,
      message: `Successfully connected to ${provider}`,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDisconnectIntegration = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await disconnectIntegration(req.user._id, provider);
    res.json({
      success: true,
      data: result,
      message: `Successfully disconnected ${provider}`,
    });
  } catch (error) {
    next(error);
  }
};

export const handleSyncIntegration = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await syncIntegration(req.user._id, provider);
    res.json({
      success: true,
      data: result,
      message: result.message || `Successfully synchronized ${provider}`,
    });
  } catch (error) {
    next(error);
  }
};

export const handleConnectAllDemo = async (req, res, next) => {
  try {
    const results = await connectAllDemo(req.user._id);
    const integrations = await getIntegrations(req.user._id);
    res.json({
      success: true,
      data: integrations,
      message: 'All 5 study integrations successfully authorized and connected for presentation.',
    });
  } catch (error) {
    next(error);
  }
};

export const handleSyncAll = async (req, res, next) => {
  try {
    const results = await syncAllIntegrations(req.user._id);
    const integrations = await getIntegrations(req.user._id);
    res.json({
      success: true,
      data: integrations,
      message: `Synchronized ${results.length} active third-party apps successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

