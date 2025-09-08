const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateProductWithResizedImage = functions.storage.object().onFinalize(async (object) => {
    // Only process images in the 'products/resized/' folder
    if (!object.name.startsWith('products/resized/') || !object.contentType?.startsWith('image/')) {
        return null;
    }

    const filePath = object.name; // e.g., "products/resized/my_image_300.webp"
    const bucket = admin.storage().bucket(object.bucket); // Admin SDK bucket object

    // Extract the original file name
    const fileName = filePath.split('/').pop(); // "my_image_300.webp"
    const originalName = fileName.substring(0, fileName.lastIndexOf('_')); // "my_image"

    try {
        // Construct the public download URL
        const resizedUrl = `https://firebasestorage.googleapis.com/v0/b/${object.bucket}/o/${encodeURIComponent(filePath)}?alt=media`;

        // Query Firestore for the product with this original image
        const productsRef = admin.firestore().collection('products');
        const q = productsRef.where('originalImage', '==', `https://firebasestorage.googleapis.com/v0/b/${object.bucket}/o/products%2Foriginals%2F${encodeURIComponent(originalName)}?alt=media`);
        const snapshot = await q.get();

        if (snapshot.empty) {
            console.log(`No matching product found for image: ${originalName}`);
            return null;
        }

        // Update product(s) with the new resized URL
        const updates = [];
        snapshot.forEach(doc => {
            updates.push(doc.ref.update({
                mainImage: resizedUrl,
                originalImage: admin.firestore.FieldValue.delete()
            }));
            console.log(`Queued update for product ${doc.id} with resized image URL: ${resizedUrl}`);
        });

        await Promise.all(updates);
        console.log('All products updated successfully');
        return null;

    } catch (error) {
        console.error('Error updating product with resized image:', error);
        return null;
    }
});
