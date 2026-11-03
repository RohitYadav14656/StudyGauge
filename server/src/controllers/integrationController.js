import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
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
      message: `Successfully synchronized ${provider}`,
    });
  } catch (error) {
    next(error);
  }
};

