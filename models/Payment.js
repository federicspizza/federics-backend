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
        default: function() {
            // ✅ GENERAR orderNumber POR DEFECTO
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `PZ${timestamp}${random}`;
        }
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
    }
}, {
    timestamps: true
});

// ✅ HOOK PRE-SAVE MEJORADO
paymentSchema.pre('save', function(next) {
    console.log('🔢 Ejecutando pre-save hook para orderNumber...');
    
    // Solo generar si no existe
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `PZ${timestamp}${random}`;
        console.log('✅ OrderNumber generado en pre-save:', this.orderNumber);
    }
    
    next();
});

// ✅ MÉTODO ESTÁTICO PARA GENERAR orderNumber
paymentSchema.statics.generateOrderNumber = function() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PZ${timestamp}${random}`;
};

export default mongoose.model('Payment', paymentSchema);