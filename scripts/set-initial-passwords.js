"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Users_1 = __importDefault(require("../src/models/Users"));
const hash_1 = require("../src/utils/hash");
dotenv_1.default.config();
/**
 * This script iterates over all users with type==='adult' and assigns them
 * sequential passwords 0001, 0002, ... (hashed and stored in passwordHash).
 * It prints a CSV with userId, fullName, phone, plainPassword so that you can
 * distribute the initial credentials.
 *
 * SECURITY NOTE: sequential numeric passwords are extremely weak. Use this
 * only for bootstrapping in an isolated environment and make users change
 * the password on first login.
 */
async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI is not set in environment variables');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri, { dbName: 'test' });
    console.log('✅ Connected to MongoDB');
    // Fetch adult users sorted by creation date (oldest first)
    const adults = await Users_1.default.find({ type: 'adult' }).sort({ createdAt: 1 });
    if (!adults.length) {
        console.log('No adult users found');
        process.exit(0);
    }
    console.log('Updating', adults.length, 'adult users...');
    const csv = ['userId,fullName,phone,plainPassword'];
    for (let i = 0; i < adults.length; i++) {
        const user = adults[i];
        const plainPassword = String(i + 1).padStart(4, '0'); // 0001, 0002 ...
        // If initialPassword already exists, skip to avoid overwriting manual changes
        if (user.initialPassword) {
            console.log(`ℹ️  Skip ${user.fullName} — password already set`);
            continue;
        }
        user.passwordHash = await (0, hash_1.hashPassword)(plainPassword);
        user.initialPassword = plainPassword;
        await user.save();
        csv.push(`${user._id},"${user.fullName}",${user.phone},${plainPassword}`);
        console.log(`🔑 Set password for ${user.fullName} -> ${plainPassword}`);
    }
    console.log('\nCSV with initial credentials:\n');
    console.log(csv.join('\n'));
    await mongoose_1.default.disconnect();
    console.log('✅ Done');
}
main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
