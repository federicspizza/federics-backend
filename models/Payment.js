import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'MXN'
    },
    items: [{
        name: String,
        detail: String,
        price: Number,
        quantity: Number
    }],
    paymentMethod: {
        type: String,
        enum: ['card', 'saved_card', 'cash'],
        required: true
    },
    cardDetails: {
        last4: String,
        brand: String,
        cardHolder: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
    },
    customerInfo: {
        name: String,
        email: String,
        phone: String
    },
    deliveryAddress: {
        street: String,
        colony: String,
        municipality: String,
        interiorNumber: String,
        description: String
    }
}, {
    timestamps: true
});

// Generar número de orden único
paymentSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `PZ${timestamp}${random}`;
    }
    next();
});

export default mongoose.model('Payment', paymentSchema);