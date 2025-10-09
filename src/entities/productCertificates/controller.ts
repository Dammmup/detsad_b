import { Request, Response } from 'express';
import { ProductCertificatesService } from './service';

const productCertificatesService = new ProductCertificatesService();

export const getAllProductCertificates = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId, certificateNumber, issuer, productCategory, status, startDate, endDate, expiryStartDate, expiryEndDate, productName, batchNumber } = req.query;
    
    const certificates = await productCertificatesService.getAll({
      productId: productId as string,
      certificateNumber: certificateNumber as string,
      issuer: issuer as string,
      productCategory: productCategory as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expiryStartDate: expiryStartDate as string,
      expiryEndDate: expiryEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(certificates);
  } catch (err) {
    console.error('Error fetching product certificates:', err);
    res.status(500).json({ error: 'Ошибка получения сертификатов продуктов' });
  }
};

export const getProductCertificateById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const certificate = await productCertificatesService.getById(req.params.id);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error fetching product certificate:', err);
    res.status(404).json({ error: err.message || 'Сертификат продукта не найден' });
  }
};

export const createProductCertificate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const certificate = await productCertificatesService.create(req.body, req.user.id as string);
    res.status(201).json(certificate);
  } catch (err: any) {
    console.error('Error creating product certificate:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания сертификата продукта' });
  }
};

export const updateProductCertificate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const certificate = await productCertificatesService.update(req.params.id, req.body);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error updating product certificate:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления сертификата продукта' });
  }
};

export const deleteProductCertificate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await productCertificatesService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting product certificate:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления сертификата продукта' });
  }
};

export const getProductCertificatesByProductId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { productId } = req.params;
    const { certificateNumber, issuer, productCategory, status, startDate, endDate, expiryStartDate, expiryEndDate, productName, batchNumber } = req.query;
    
    const certificates = await productCertificatesService.getByProductId(productId, {
      certificateNumber: certificateNumber as string,
      issuer: issuer as string,
      productCategory: productCategory as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expiryStartDate: expiryStartDate as string,
      expiryEndDate: expiryEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(certificates);
  } catch (err: any) {
    console.error('Error fetching product certificates by product ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сертификатов продуктов по продукту' });
  }
};

export const getProductCertificatesByInspectorId = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { inspectorId } = req.params;
    const { productId, certificateNumber, issuer, productCategory, status, startDate, endDate, expiryStartDate, expiryEndDate, productName, batchNumber } = req.query;
    
    const certificates = await productCertificatesService.getByInspectorId(inspectorId, {
      productId: productId as string,
      certificateNumber: certificateNumber as string,
      issuer: issuer as string,
      productCategory: productCategory as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      expiryStartDate: expiryStartDate as string,
      expiryEndDate: expiryEndDate as string,
      productName: productName as string,
      batchNumber: batchNumber as string
    });
    
    res.json(certificates);
  } catch (err: any) {
    console.error('Error fetching product certificates by inspector ID:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сертификатов продуктов по инспектору' });
  }
};

export const getExpiringSoon = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { days } = req.query;
    const daysNum = days ? parseInt(days as string) : 30;
    
    const certificates = await productCertificatesService.getExpiringSoon(daysNum);
    res.json(certificates);
  } catch (err: any) {
    console.error('Error fetching expiring soon certificates:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения скоро истекающих сертификатов' });
  }
};

export const approveProductCertificate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { approvedBy } = req.body;
    
    if (!approvedBy) {
      return res.status(400).json({ error: 'Не указан утверждающий' });
    }
    
    const certificate = await productCertificatesService.approve(req.params.id, approvedBy);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error approving product certificate:', err);
    res.status(404).json({ error: err.message || 'Ошибка утверждения сертификата продукта' });
  }
};

export const rejectProductCertificate = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { rejectedBy, rejectionReason } = req.body;
    
    if (!rejectedBy) {
      return res.status(400).json({ error: 'Не указан отклоняющий' });
    }
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Не указана причина отклонения' });
    }
    
    const certificate = await productCertificatesService.reject(req.params.id, rejectedBy, rejectionReason);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error rejecting product certificate:', err);
    res.status(404).json({ error: err.message || 'Ошибка отклонения сертификата продукта' });
  }
};

export const updateProductCertificateStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Не указан статус' });
    }
    
    const certificate = await productCertificatesService.updateStatus(req.params.id, status);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error updating product certificate status:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления статуса сертификата продукта' });
  }
};

export const addProductCertificateRecommendations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recommendations } = req.body;
    
    if (!recommendations) {
      return res.status(400).json({ error: 'Не указаны рекомендации' });
    }
    
    const certificate = await productCertificatesService.addRecommendations(req.params.id, recommendations);
    res.json(certificate);
  } catch (err: any) {
    console.error('Error adding product certificate recommendations:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления рекомендаций к сертификату продукта' });
  }
};

export const getProductCertificateStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await productCertificatesService.getStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching product certificate statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики сертификатов продуктов' });
  }
};