const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BusSchema = new Schema({
    BusNumber:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    capacity:{
        type: Number,
        required: true,
        min: 1,
    },
    status:{
        type: String,
        enum: ['active','Maintenance', 'inactive'],
        default: 'active',
    },
    driverId:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    route_id:{
        type: Schema.Types.ObjectId,
        ref: 'Route',
        default:null,
    },
},{timestamps:true})
const Bus = mongoose.model('Bus', BusSchema);
module.exports = Bus;