import ProductCertificate from './model';
import { IProductCertificate } from './model';
import User from '../../users/model';
import Product from '../products/model';


let ProductCertificateModel: any = null;
let UserModel: any = null;

const getProductCertificateModel = () => {
  if (!ProductCertificateModel) {
    ProductCertificateModel = ProductCertificate;
  }
  return ProductCertificateModel;
};

const getUserModel = () => {
  if (!UserModel) {
    UserModel = User;
  }
  return UserModel;
};


let ProductModel: any = null;

const getProductModel = () => {
  if (!ProductModel) {
    ProductModel = Product;
  }
  return ProductModel;
};
export class ProductCertificatesService {
  async getAll(filters: { productId?: string, certificateNumber?: string, issuer?: string, productCategory?: string, status?: string, startDate?: string, endDate?: string, expiryStartDate?: string, expiryEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = {};

    if (filters.productId) filter.productId = filters.productId;
    if (filters.certificateNumber) filter.certificateNumber = filters.certificateNumber;
    if (filters.issuer) filter.issuer = filters.issuer;
    if (filters.productCategory) filter.productCategory = filters.productCategory;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.issueDate = {};
      if (filters.startDate) filter.issueDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.issueDate.$lte = new Date(filters.endDate);
    }

    if (filters.expiryStartDate || filters.expiryEndDate) {
      filter.expiryDate = {};
      if (filters.expiryStartDate) filter.expiryDate.$gte = new Date(filters.expiryStartDate);
      if (filters.expiryEndDate) filter.expiryDate.$lte = new Date(filters.expiryEndDate);
    }

    const certificates = await ProductCertificate.find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ issueDate: -1 });

    return certificates;
  }

  async getById(id: string) {
    const certificate = await ProductCertificate.findById(id)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!certificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return certificate;
  }

  async create(certificateData: Partial<IProductCertificate>, userId: string) {

    // Minimal required fields
    if (!certificateData.productName) {
      throw new Error('Не указано название продукта');
    }
    // All other fields are optional for flexibility

    // Validate productId if provided
    if (certificateData.productId) {
      const product = await Product.findById(certificateData.productId);
      if (!product) {
        throw new Error('Продукт не найден');
      }
    }

    // Use current user as inspector
    const productCertificateModel = ProductCertificate;
    const certificate = new productCertificateModel({
      ...certificateData,
      inspector: userId
    });

    await certificate.save();

    const populatedCertificate = await productCertificateModel.findById(certificate._id)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    return populatedCertificate;
  }

  async update(id: string, data: Partial<IProductCertificate>) {
    const updatedCertificate = await ProductCertificate.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!updatedCertificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return updatedCertificate;
  }

  async delete(id: string) {
    const result = await ProductCertificate.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Сертификат продукта не найден');
    }

    return { message: 'Сертификат продукта успешно удален' };
  }

  async getByProductId(productId: string, filters: { certificateNumber?: string, issuer?: string, productCategory?: string, status?: string, startDate?: string, endDate?: string, expiryStartDate?: string, expiryEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = { productId };

    if (filters.certificateNumber) filter.certificateNumber = filters.certificateNumber;
    if (filters.issuer) filter.issuer = filters.issuer;
    if (filters.productCategory) filter.productCategory = filters.productCategory;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.issueDate = {};
      if (filters.startDate) filter.issueDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.issueDate.$lte = new Date(filters.endDate);
    }

    if (filters.expiryStartDate || filters.expiryEndDate) {
      filter.expiryDate = {};
      if (filters.expiryStartDate) filter.expiryDate.$gte = new Date(filters.expiryStartDate);
      if (filters.expiryEndDate) filter.expiryDate.$lte = new Date(filters.expiryEndDate);
    }

    const certificates = await ProductCertificate.find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ issueDate: -1 });

    return certificates;
  }

  async getByInspectorId(inspectorId: string, filters: { productId?: string, certificateNumber?: string, issuer?: string, productCategory?: string, status?: string, startDate?: string, endDate?: string, expiryStartDate?: string, expiryEndDate?: string, productName?: string, batchNumber?: string }) {
    const filter: any = { inspector: inspectorId };

    if (filters.productId) filter.productId = filters.productId;
    if (filters.certificateNumber) filter.certificateNumber = filters.certificateNumber;
    if (filters.issuer) filter.issuer = filters.issuer;
    if (filters.productCategory) filter.productCategory = filters.productCategory;
    if (filters.status) filter.status = filters.status;
    if (filters.productName) filter.productName = filters.productName;
    if (filters.batchNumber) filter.batchNumber = filters.batchNumber;

    if (filters.startDate || filters.endDate) {
      filter.issueDate = {};
      if (filters.startDate) filter.issueDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.issueDate.$lte = new Date(filters.endDate);
    }

    if (filters.expiryStartDate || filters.expiryEndDate) {
      filter.expiryDate = {};
      if (filters.expiryStartDate) filter.expiryDate.$gte = new Date(filters.expiryStartDate);
      if (filters.expiryEndDate) filter.expiryDate.$lte = new Date(filters.expiryEndDate);
    }

    const certificates = await ProductCertificate.find(filter)
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ issueDate: -1 });

    return certificates;
  }

  async getExpiringSoon(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const certificates = await ProductCertificate.find({
      expiryDate: {
        $gte: today,
        $lte: futureDate
      },
      status: { $ne: 'expired' }
    })
      .populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role')
      .sort({ expiryDate: 1 });

    return certificates;
  }

  async approve(id: string, approvedBy: string) {
    const certificate = await ProductCertificate.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!certificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return certificate;
  }

  async reject(id: string, rejectedBy: string, rejectionReason: string) {
    const certificate = await ProductCertificate.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        rejectionReason
      },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!certificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return certificate;
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected' | 'expired') {
    const certificate = await ProductCertificate.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!certificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return certificate;
  }

  async addRecommendations(id: string, recommendations: string) {
    const certificate = await ProductCertificate.findByIdAndUpdate(
      id,
      { recommendations },
      { new: true }
    ).populate('productId', 'name')
      .populate('inspector', 'fullName role')
      .populate('approvedBy', 'fullName role');

    if (!certificate) {
      throw new Error('Сертификат продукта не найден');
    }

    return certificate;
  }

  async getStatistics() {
    const stats = await ProductCertificate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const categoryStats = await ProductCertificate.aggregate([
      {
        $group: {
          _id: '$productCategory',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const issuerStats = await ProductCertificate.aggregate([
      {
        $group: {
          _id: '$issuer',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await ProductCertificate.countDocuments();

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byIssuer: issuerStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }
}