import mongoose, { Schema, Document } from 'mongoose';

export interface IProductPurchase extends Document {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unit: string;
    weight?: number; // Вес единицы продукта
    weightUnit?: 'г' | 'кг' | 'мл' | 'л';
    pricePerUnit: number;
    totalPrice: number;
    supplier: string;
    batchNumber?: string;
    expirationDate?: Date;
    purchaseDate: Date;
    invoiceNumber?: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProductPurchaseSchema = new Schema<IProductPurchase>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Продукт обязателен'],
        index: true
    },
    quantity: {
        type: Number,
        required: [true, 'Количество обязательно'],
        min: [0.01, 'Количество должно быть положительным']
    },
    unit: {
        type: String,
        required: [true, 'Единица измерения обязательна'],
        trim: true
    },
    weight: {
        type: Number,
        min: [0, 'Вес не может быть отрицательным']
    },
    weightUnit: {
        type: String,
        enum: ['г', 'кг', 'мл', 'л'],
        default: 'г'
    },
    pricePerUnit: {
        type: Number,
        required: [true, 'Цена за единицу обязательна'],
        min: [0, 'Цена не может быть отрицательной']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Общая сумма обязательна'],
        min: [0, 'Сумма не может быть отрицательной']
    },
    supplier: {
        type: String,
        required: false,
        trim: true,
        maxlength: [100, 'Поставщик не может превышать 100 символов']
    },
    batchNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Номер партии не может превышать 50 символов']
    },
    expirationDate: {
        type: Date
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Дата закупки обязательна'],
        default: Date.now,
        index: true
    },
    invoiceNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Номер накладной не может превышать 50 символов']
    },
    notes: {
        type: String,
        maxlength: [500, 'Заметки не могут превышать 500 символов']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Вычисление общей суммы перед сохранением
ProductPurchaseSchema.pre('save', function (next) {
    if (this.isModified('quantity') || this.isModified('pricePerUnit')) {
        this.totalPrice = this.quantity * this.pricePerUnit;
    }
    next();
});

export default mongoose.model<IProductPurchase>('ProductPurchase', ProductPurchaseSchema, 'product_purchases');
