
import fs from 'fs';
import path from 'path';

const filePath = 'src/pages/Marketplace.tsx';

try {
    const content = fs.readFileSync(filePath, 'utf8');

    const checks = [
        'const loadProducts',
        'const loadCurrentUserProfile',
        'const toggleFavorite',
        'const submitReport',
        'const getSignalIcon',
        'Restored Helper Functions',
        'const createContactSession',
        'const createNewContactSession',
        'const checkActiveContactSession',
        'const handleDatabaseError',
        'const openContact',
        'const openReviews',
        'const openMessages'
    ];

    console.log('--- Duplicate Check Results ---');
    checks.forEach(check => {
        // Escape regex special chars if any
        const regex = new RegExp(check.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = (content.match(regex) || []).length;
        console.log(`"${check}": ${matches} occurrence(s)`);

        if (matches > 1) {
            // Find line numbers
            let lines = [];
            content.split('\n').forEach((line, index) => {
                if (line.includes(check)) lines.push(index + 1);
            });
            console.log(`    Validation: Found at lines: ${lines.join(', ')}`);
        }
    });

} catch (err) {
    console.error('Error reading file:', err);
}
