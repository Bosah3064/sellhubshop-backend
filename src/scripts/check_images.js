const { supabase } = require('../helpers/supabase');

async function checkImages() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, images')
            .limit(5);

        if (error) throw error;

        console.log('Sample Product Images:');
        products.forEach(p => {
            console.log(`Product: ${p.name} (ID: ${p.id})`);
            console.log('Images:', JSON.stringify(p.images, null, 2));
            console.log('-------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

checkImages();
