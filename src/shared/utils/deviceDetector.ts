import { IDeviceMetadata } from "../../entities/staffAttendanceTracking/model";

export const DEVICE_RESOLUTION_MAP: Record<string, string[]> = {
    '390x844': ['iPhone 12', 'iPhone 13', 'iPhone 14'],
    '428x926': ['iPhone 12 Pro Max', 'iPhone 13 Pro Max', 'iPhone 14 Pro Max'],
    '393x852': ['iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro'],
    '430x932': ['iPhone 14 Pro Max', 'iPhone 15 Pro Max'],
    '375x812': ['iPhone X', 'iPhone XS', 'iPhone 11 Pro'],
    '414x896': ['iPhone XR', 'iPhone 11', 'iPhone XS Max', 'iPhone 11 Pro Max'],
    '320x568': ['iPhone 5', 'iPhone 5S', 'iPhone 5C', 'iPhone SE (1st gen)'],
    '375x667': ['iPhone 6', 'iPhone 7', 'iPhone 8', 'iPhone SE (2nd gen)'],
    '414x736': ['iPhone 6 Plus', 'iPhone 7 Plus', 'iPhone 8 Plus'],
    '360x800': ['Samsung Galaxy S20', 'Samsung Galaxy S21', 'Samsung Galaxy A52', 'Samsung Galaxy A53'],
    '360x780': ['Samsung Galaxy S22', 'Samsung Galaxy S23'],
    '412x915': ['Samsung Galaxy S20 Ultra', 'Samsung Galaxy S21 Ultra', 'Google Pixel 6 Pro'],
    '411x914': ['Google Pixel 6', 'Google Pixel 7', 'Google Pixel 8'],
    '440x956': ['Google Pixel 7 Pro', 'Google Pixel 8 Pro', 'High-end Android'],
    '360x640': ['Older Android Device', 'Samsung Galaxy S5', 'Moto G'],
    '412x869': ['Samsung Galaxy Note 10+', 'Samsung Galaxy Note 20 Ultra'],
    '384x854': ['Sony Xperia Devices'],
};

/**
 * Обогащает метаданные устройства, определяя браузер, ОС и модель
 */
export const enrichDeviceMetadata = (metadata: IDeviceMetadata): IDeviceMetadata => {
    const enriched = { ...metadata };

    // 1. Парсинг User Agent если есть
    if (enriched.userAgent && (!enriched.browser || !enriched.os)) {
        const ua = enriched.userAgent;

        // Определение ОС
        if (!enriched.os) {
            if (ua.includes('iPhone OS')) {
                const match = ua.match(/iPhone OS (\d+_\d+)/);
                enriched.os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
            } else if (ua.includes('Android')) {
                const match = ua.match(/Android (\d+(\.\d+)?)/);
                enriched.os = match ? `Android ${match[1]}` : 'Android';
            } else if (ua.includes('Windows NT')) {
                enriched.os = 'Windows';
            } else if (ua.includes('Mac OS X')) {
                enriched.os = 'macOS';
            }
        }

        // Определение Браузера
        if (!enriched.browser) {
            if (ua.includes('Chrome') && !ua.includes('Edg')) enriched.browser = 'Chrome';
            else if (ua.includes('Safari') && !ua.includes('Chrome')) enriched.browser = 'Safari';
            else if (ua.includes('Firefox')) enriched.browser = 'Firefox';
            else if (ua.includes('Edg')) enriched.browser = 'Edge';
        }
    }

    // 2. Определение модели по разрешению и платформе
    if (enriched.screenResolution) {
        const resolution = enriched.screenResolution.replace(/\s/g, '');
        let models = DEVICE_RESOLUTION_MAP[resolution];

        // Проверка ландшафта
        if (!models) {
            const parts = resolution.split('x');
            if (parts.length === 2) {
                models = DEVICE_RESOLUTION_MAP[`${parts[1]}x${parts[0]}`];
            }
        }

        if (models) {
            // Если у нас iPhone, но список моделей содержит Android, или наоборот - фильтруем
            const isIOS = enriched.platform?.toLowerCase().includes('iphone') || enriched.os?.toLowerCase().includes('ios');
            const isAndroid = enriched.platform?.toLowerCase().includes('android') || enriched.os?.toLowerCase().includes('android');

            let filteredModels = models;
            if (isIOS) {
                filteredModels = models.filter(m => m.toLowerCase().includes('iphone'));
            } else if (isAndroid) {
                filteredModels = models.filter(m => !m.toLowerCase().includes('iphone'));
            }

            if (filteredModels.length > 0) {
                enriched.deviceModel = filteredModels.join(', ');
            }
        }
    }

    return enriched;
};

/**
 * Определяет модель устройства по разрешению экрана (устарело, используйте enrichDeviceMetadata)
 */
export const getDeviceModelByResolution = (resolution: string | undefined): string | undefined => {
    if (!resolution) return undefined;
    const normalized = resolution.replace(/\s/g, '');
    if (DEVICE_RESOLUTION_MAP[normalized]) return DEVICE_RESOLUTION_MAP[normalized].join(', ');
    const parts = normalized.split('x');
    if (parts.length === 2) {
        const reversed = `${parts[1]}x${parts[0]}`;
        if (DEVICE_RESOLUTION_MAP[reversed]) return DEVICE_RESOLUTION_MAP[reversed].join(', ');
    }
    return undefined;
};
