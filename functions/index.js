const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Map of sizes you want
const sizes = {
    thumbnail: 200,
    listing: 400,
    detail: 800
};

exports.updateProductWithResizedImages = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const bucket = object.bucket;
    const contentType = object.contentType;

    if (!contentType.startsWith('image/') || !filePath.startsWith('products/resized/')) {
        return null; // Ignore non-images or files outside resized folder
    }

    const fileName = filePath.split('/').pop();
    const originalName = fileName.substring(0, fileName.lastIndexOf('_')); // e.g., "product123.jpg_200x200" → "product123.jpg"

    try {
        const bucketRef = admin.storage().bucket(bucket);
        const resizedUrl = await bucketRef.file(filePath).getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // very long expiry
        });

        // Query Firestore using filename field
        const productsRef = admin.firestore().collection('products');
        const snapshot = await productsRef.where('originalFileName', '==', originalName).get();

        if (snapshot.empty) {
            console.log(`No matching product found for image: ${originalName}`);
            return null;
        }

        snapshot.forEach(async (doc) => {
            // Determine which size this is from the filename
            let sizeKey = null;
            for (const key of Object.keys(sizes)) {
                if (fileName.includes(`_${sizes[key]}x${sizes[key]}`)) {
                    sizeKey = key;
                    break;
                }
            }
            if (!sizeKey) sizeKey = 'detail'; // fallback

            // Update the product document
            await doc.ref.set({
                images: {
                    [sizeKey]: resizedUrl[0] // signed URL
                }
            }, { merge: true });

            console.log(`Updated product ${doc.id} with ${sizeKey} image: ${resizedUrl[0]}`);
        });

    } catch (error) {
        console.error('Error updating product with resized image:', error);
        return null;
    }
});
